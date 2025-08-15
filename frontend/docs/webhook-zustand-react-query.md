# Beginner Tutorial: Webhook, zustand และ @tanstack/react-query (ภาษาไทย)

เอกสารนี้เขียนสำหรับคนที่เริ่มต้น — ทุกขั้นตอนจะเป็นแบบคัดลอกแล้ววางได้จริง (copy-paste-ready). ผมจะให้ไฟล์ตัวอย่าง, คำสั่งที่ต้องรัน, และคำอธิบายสั้น ๆ ว่าทำไมต้องทำแบบนี้

สิ่งที่จะได้ทำตามใน tutorial นี้
- สร้าง Webhook endpoint (Express) และทดสอบด้วย curl/Postman
- เขียน `zustand` store สำหรับ auth (persist) และใช้ใน component
- ตั้งค่า `@tanstack/react-query` (provider + hook + mutation) และเชื่อมกับ zustand
- เขียน unit test แบบง่ายสำหรับ `useUser` (Vitest + msw) เพื่อให้เข้าใจ testing flow

---

## โครงสร้างที่จะเพิ่ม/แก้ (ไฟล์ที่คุณจะสร้างตาม tutorial นี้)
- backend/src/modules/webhook/webhook.route.ts  (Webhook handler)
- frontend/src/stores/auth.store.ts           (zustand store) — โปรเจกต์มีอยู่แล้ว แต่ผมจะอธิบายซ้ำ
- frontend/src/components/providers/QueryProvider.tsx (react-query provider) — โปรเจกต์มีอยู่แล้ว
- frontend/src/hooks/useAuth.ts              (useUser hook) — โปรเจกต์มีอยู่แล้ว
- test/useUser.test.ts                        (ตัวอย่าง unit test)

ถ้าต้องการผมสามารถสร้างไฟล์ backend ให้ด้วย (บอกผมได้) — ตอนนี้ผมจะสอนทีละขั้นตอนให้คุณทำตาม

---

## ส่วนที่ 0 — เตรียมเครื่องมือ (ทำครั้งเดียว)
ก่อนเริ่ม ให้แน่ใจว่าคุณมี:
- Node.js >= 18
- pnpm (หากยังไม่มี): `npm i -g pnpm`
- Docker (ถ้าต้องการให้ DB ทำงาน)

ในโฟลเดอร์ `frontend/` ให้ติดตั้ง lib ที่จะใช้บน client:
```bash
cd frontend
pnpm install zustand @tanstack/react-query axios
```

หมายเหตุ: repo ของคุณมี `api.ts`, `QueryProvider.tsx`, `auth.store.ts`, `useAuth.ts` อยู่แล้ว — ถ้าคุณทำตาม tutorial นี้ คุณจะเข้าใจการทำงานอย่างละเอียด

---

## ส่วนที่ 1 — สร้าง Webhook handler (Backend) — มือใหม่ก็ทำได้
เป้าหมาย: สร้าง route ที่ตรวจ signature และ ack เร็ว

1) สร้างไฟล์: `backend/src/modules/webhook/webhook.route.ts`

คัดลอกโค้ดข้างล่างไปวางในไฟล์นั้น:

```ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

function verifySignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string) {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch (e) {
    return false;
  }
}

router.post('/issue-updated', express.raw({ type: 'application/json' }), async (req, res) => {
  const raw = req.body as Buffer;
  const signature = req.header('x-webhook-signature');

  if (!verifySignature(raw, signature, process.env.WEBHOOK_SECRET || '')) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  res.status(200).send('OK');

  // ทำงานหนักใน background: push job ไป Queue
  // ตัวอย่าง (pseudo): jobQueue.add('processIssueWebhook', payload)
});

export default router;
```

2) ต่อ route กับแอปหลัก (ถ้ายังไม่ได้เชื่อม) ใน `backend/src/index.ts` ให้เพิ่ม:

```ts
import webhookRoutes from './modules/webhook/webhook.route';
app.use('/api/webhook', webhookRoutes);
```

3) ตั้ง env: ใน `.env` ของ backend ให้เพิ่ม (ตัวอย่าง):

```
WEBHOOK_SECRET=mysecret
```

4) ทดสอบจากเครื่องส่ง webhook (Linux/macOS example):

```bash
PAYLOAD='{"issueId":"abc","status":"RESOLVED"}'
SIGNATURE="sha256=$(echo -n $PAYLOAD | openssl dgst -sha256 -hmac 'mysecret' | sed 's/^.* //')"
curl -X POST http://localhost:8080/api/webhook/issue-updated -H "Content-Type: application/json" -H "x-webhook-signature: $SIGNATURE" -d "$PAYLOAD"
```

ถ้าใช้ PowerShell ให้รันสคริปต์ Node เล็กๆ เพื่อสร้าง signature หรือใช้ Postman โดยคำนวณ HMAC ด้วย external script

---

## ส่วนที่ 2 — สร้าง/ทำความเข้าใจ `zustand` store ขั้นตอนต่อขั้นตอน
สมมติไฟล์ `frontend/src/stores/auth.store.ts` ยังไม่มี หรือคุณอยากสร้างใหม่ ให้ทำตามนี้

1) สร้างไฟล์: `frontend/src/stores/auth.store.ts`

วางโค้ดนี้ (copy-paste):

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User { userId: string; email: string; role: string }

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: () => boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: () => !!get().user,
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (err) {
          console.warn('logout failed', err);
        }
        set({ user: null });
      }
    }),
    { name: 'auth-storage' }
  )
);
```

2) ใช้ store ใน component — สร้าง `frontend/src/components/Header.tsx` (ตัวอย่างง่ายๆ)

```tsx
import React from 'react';
import { useAuthStore } from '@/stores/auth.store';

export default function Header() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  return (
    <header style={{ padding: 12 }}>
      {user ? (
        <>
          <span style={{ marginRight: 8 }}>{user.email}</span>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <a href="/auth/login">Login</a>
      )}
    </header>
  );
}
```

3) ทดสอบด้วยการเรียก `/me` ด้วย `useUser` (จาก hook ของ repo) — ถ้า backend ตอบ 200 ผลจะเซ็ตลง store อัตโนมัติ

---

## ส่วนที่ 3 — ตั้งค่า @tanstack/react-query และเขียน hook ที่ใช้งานได้จริง
1) Provider: ถ้ายังไม่มี ให้สร้าง `frontend/src/components/providers/QueryProvider.tsx` (repo มีอยู่แล้ว)

โค้ดตัวอย่าง (จาก repo):

```tsx
"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

2) Hook `useUser` (repo มีอยู่แล้ว) — ถ้าต้องการสร้างใหม่ ให้คัดลอกจาก repo:

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export const useUser = () => {
  const setUser = useAuthStore(state => state.setUser);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/me');
      setUser(data);
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};
```

3) ใช้ `useCreateIssue` mutation ตัวอย่าง (copy-paste):

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post('/issues', payload),
    onSuccess: () => qc.invalidateQueries(['issues'])
  });
}
```

---

## ส่วนที่ 4 — เขียน unit test ง่ายๆ สำหรับ `useUser` (Vitest + msw)
1) ติดตั้งเครื่องมือสำหรับทดสอบ (จาก root หรือ frontend):
```bash
pnpm add -D vitest @testing-library/react @testing-library/react-hooks msw
```

2) สร้างไฟล์ทดสอบ: `frontend/test/useUser.test.ts` และวางโค้ดนี้:

```ts
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from '@/hooks/useAuth';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('http://localhost:8080/api/me', (req, res, ctx) => {
    return res(ctx.json({ userId: 'u1', email: 'a@b.com', role: 'USER' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('useUser sets auth store', async () => {
  const qc = new QueryClient();
  const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const { result, waitFor } = renderHook(() => useUser(), { wrapper });
  await waitFor(() => result.current.isSuccess);
  expect(result.current.data.email).toBe('a@b.com');
});
```

3) รัน test:
```bash
pnpm vitest -r
```

---

## ส่วนที่ 5 — คำอธิบายสั้นๆ ว่าทำไมแต่ละขั้น
- Webhook: ต้อง verify signature เพื่อป้องกันการ spoofing
- zustand: เก็บ state ที่ต้องแชร์ระหว่าง component และ persist ข้อมูล non-sensitive
- react-query: จัดการ remote data (cache, refetch, invalidate) — เป็น source-of-truth สำหรับ data ที่มาจาก API

---

## สรุปแบบ checklist สำหรับมือใหม่
- สร้างไฟล์ webhook, เพิ่ม route, ตั้ง `WEBHOOK_SECRET`
- สร้าง/ยืนยัน `auth.store.ts` ใน frontend
- ห่อแอปด้วย `QueryProvider` และใช้ `useUser` เพื่อดึง `/me`
- เขียน test ง่าย ๆ ด้วย Vitest + msw

---

เสร็จแล้ว — ถ้าต้องการ ผมจะช่วยสร้างไฟล์ backend/webhook และทดสอบให้เสร็จใน repo (ผมจะ commit/สร้างไฟล์ให้) หรือจะให้ชี้ทีละขั้นตอนขณะแก้โค้ด คุณเลือกได้ครับ
---

## ความต้องการเบื้องต้น (Prerequisites)
- Node.js >= 18
- pnpm (แนะนำ): `npm i -g pnpm`
- Docker (ถ้าจะรันฐานข้อมูล Postgres ที่ repo ใช้)

ติดตั้ง dependencies (จากโฟลเดอร์ `frontend/`):
```bash
pnpm install zustand@^4.4.0 @tanstack/react-query@^5.0.0 axios@^1.5.0
```

หมายเหตุ: โปรเจกต์นี้มี `frontend/src/lib/api.ts` ที่ตั้ง `withCredentials: true` อยู่แล้ว — สำคัญสำหรับ cookie-based auth

---

## ส่วนที่ 1 — Webhook (Backend) — การออกแบบและการทดสอบ

เป้าหมาย: สร้าง endpoint รับ event, ยืนยัน signature ด้วย HMAC, ack เร็ว และส่ง payload ไป background worker

1) Contract ที่แนะนำ
- Endpoint: `POST /api/webhook/issue-updated`
- Header: `x-webhook-signature: sha256=<hex>`
- Body: raw JSON

2) ตัวอย่างโค้ด (Express, ไฟล์: `backend/src/modules/webhook/webhook.route.ts` — เป็นตัวอย่างเพื่อวางลงใน backend ของคุณ)

```ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

function verifySignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string) {
  if (!signatureHeader) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch (e) {
    return false;
  }
}

// ใช้ express.raw() เฉพาะ route ที่ต้องการอ่าน raw body
router.post('/issue-updated', express.raw({ type: 'application/json' }), async (req, res) => {
  const raw = req.body as Buffer;
  const signature = req.header('x-webhook-signature');

  if (!verifySignature(raw, signature, process.env.WEBHOOK_SECRET || '')) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // parse และตรวจ schema เบื้องต้น
  let payload: any;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  // ACK early
  res.status(200).send('OK');

  // ส่งงานหนักไปรัน background worker / queue
  // ตัวอย่าง: publish ไป Redis/Queue หรือ push job ให้ worker
  // await jobQueue.add('processIssueWebhook', payload);
});

export default router;
```

3) ทดสอบ Webhook ด้วย curl (สมมติ secret = `mysecret`)

บนเครื่องที่ส่ง webhook:
```bash
PAYLOAD='{"issueId":"abc","status":"RESOLVED"}'
SIGNATURE="sha256=$(echo -n $PAYLOAD | openssl dgst -sha256 -hmac 'mysecret' | sed 's/^.* //')"
curl -X POST http://localhost:8080/api/webhook/issue-updated -H "Content-Type: application/json" -H "x-webhook-signature: $SIGNATURE" -d "$PAYLOAD"
```

หมายเหตุ (Windows PowerShell): ใช้วิธีคำนวณ HMAC ที่เหมาะสมบน PowerShell หรือใช้ Node script เล็กๆ เพื่อสร้าง signature

4) แนวปฏิบัติ
- ACK เร็ว แล้วค่อยประมวลผลใน background worker
- เก็บเฉพาะ metadata ลง logs; หลีกเลี่ยงการเก็บ payload ที่มีข้อมูล sensitive
- ป้องกัน replay: ตรวจ timestamp และ nonces เมื่อ provider ส่งมา

---

## ส่วนที่ 2 — zustand (frontend) — ออกแบบและใช้งานจริง

เป้าหมาย: เก็บข้อมูล non-sensitive (เช่น profile) และ UI state แบบ persistable

1) ตัวอย่าง store ในโปรเจกต์ (`frontend/src/stores/auth.store.ts`)

สรุป: store เก็บ `user` (id, email, role), มี `setUser`, `isAuthenticated`, `logout` ซึ่งเรียก API แล้วเคลียร์ state

โค้ดตัวอย่าง (อ่านจาก repo ของคุณ — pattern เดียวกัน):

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User { userId: string; email: string; role: string }

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: () => boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: () => !!get().user,
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (err) {
          console.warn('logout failed', err);
        }
        set({ user: null });
      }
    }),
    { name: 'auth-storage' }
  )
);
```

2) วิธีใช้ใน Component

```tsx
import { useAuthStore } from '@/stores/auth.store';

function Header() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  return (
    <header>
      {user ? (
        <>
          <span>{user.email}</span>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <a href="/auth/login">Login</a>
      )}
    </header>
  );
}
```

3) Best practices
- อย่าเก็บ token ใน store (
  backend ควรเก็บ access/refresh token ใน httpOnly cookie)
- แยก store ตาม concern: auth store, ui store, domain store
- ระวังการ persist ข้อมูลขนาดใหญ่ใน localStorage

---

## ส่วนที่ 3 — @tanstack/react-query — ตั้งค่า hook และ patterns

1) Provider (จาก repo)

ไฟล์ `frontend/src/components/providers/QueryProvider.tsx` เป็นตัวอย่างที่ดี — สร้าง `QueryClient` หนึ่งตัวและใช้ `QueryClientProvider` รอบทั้งแอป

2) Hook ตัวอย่าง: `useUser` (repo ใช้งานอยู่)

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export const useUser = () => {
  const setUser = useAuthStore(state => state.setUser);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/me');
      setUser(data);
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
};
```

3) Mutation pattern และ cache invalidation

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => api.post('/issues', payload),
    onSuccess: () => qc.invalidateQueries(['issues'])
  });
}
```

4) Tips
- ตั้ง `staleTime` ให้เหมาะสม (profile: 5m เหมาะสำหรับข้อมูลโปรไฟล์)
- ใช้ optimistic 업데이트เมื่อ UX สำคัญ และ rollback เมื่อล้มเหลว
- ตั้ง global `onError` เพื่อดัก 401 และรีไดเรกต์ไปหน้า login

---

## ส่วนที่ 4 — Integration: เรียงลำดับการทำงานจริง

Flow: Login → backend ตั้ง cookie → frontend call `/me` → react-query ตั้ง cache → zustand เก็บ profile

ตัวอย่าง sequence:
1. User POST /api/auth/login (credentials)
2. Backend ตอบ 200 และเซ็ต httpOnly cookie (accessToken)
3. Client โหลด layout → `useUser()` เรียก `/me` → ถ้า 200 จะ `setUser` ใน zustand

ข้อดี: server-side token handling และ client ใช้ react-query เป็น source of truth สำหรับ remote data

---

## ส่วนที่ 5 — Security / Performance / Testing Checklist (สรุปแบบ actionable)

Security
- เก็บ tokens ใน httpOnly cookie (avoid storing JWT in localStorage)
- ยืนยัน input ด้วย Zod (frontend + backend)
- Webhook: verify signature, timestamp, replay protection
- ใช้ CORS whitelist และ `withCredentials: true` สำหรับ axios

Performance
- Profile: staleTime = 5m; Feed: shorter staleTime
- Avoid persisting large stores; splitและlazy loadเมื่อจำเป็น

Testing
- Unit test: mock api สำหรับ store และ react-query hooks (Vitest)
- Integration/API: Supertest (backend)
- E2E: Playwright ทดสอบ login cookie flows

---

## ตัวอย่างการทดสอบสั้นๆ (unit test for `useUser` using Vitest + msw)

ตัวอย่างไอเดีย (pseudo):

```ts
// test/useUser.test.ts
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from '@/hooks/useAuth';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('http://localhost:8080/api/me', (req, res, ctx) => {
    return res(ctx.json({ userId: 'u1', email: 'a@b.com', role: 'USER' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('useUser sets auth store', async () => {
  const qc = new QueryClient();
  const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const { result, waitFor } = renderHook(() => useUser(), { wrapper });
  await waitFor(() => result.current.isSuccess);
  expect(result.current.data.email).toBe('a@b.com');
});
```

---

## Next steps (แนะนำลำดับการทำจริง)
1. ถ้ายังไม่มี DB/Backend รัน ให้เริ่ม Docker-compose ของ repo (Postgres) แล้วรัน backend
2. เพิ่ม webhook route ใน backend และทดสอบด้วย curl / Postman
3. เพิ่ม global axios interceptor เพื่อดัก 401 → redirect ไป login
4. เขียน unit tests สำหรับ `useUser` และ `auth.store`

---

ถ้าต้องการ ผมจะต่อให้เป็น:
- ตัวอย่างไฟล์ webhook handler ที่พร้อมวางจริงใน `backend/src/modules/webhook/` พร้อม job-queue example (Redis

- ตัวอย่าง refresh-token flow (backend + client interceptor)
- สร้าง unit test ที่ใช้งานได้จริงใน repo (Vitest + msw)

แจ้งผมว่าต้องการแบบใดต่อ แล้วผมจะสร้างไฟล์ตัวอย่างให้พร้อมทดสอบครับ
