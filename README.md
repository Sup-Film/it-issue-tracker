# it-issue-tracker

This repository contains a small realtime issue tracker (Next.js frontend, Express/TypeScript backend, webhook listener and PostgreSQL) used for demos and interview testing.

## Quick start (Docker)

1. Build and start all services (frontend on :3000, backend on :8080, webhook listener on :4000, db on :5433):

````markdown
# it-issue-tracker

รีโปนี้เป็นตัวอย่างโปรเจคระบบติดตามปัญหาแบบ realtime ขนาดเล็ก โดยประกอบด้วย Frontend (Next.js), Backend (Express + TypeScript), webhook listener และ PostgreSQL — ใช้สำหรับเดโมหรือทดสอบในการสัมภาษณ์

## เริ่มใช้งานอย่างรวดเร็ว (Docker)

1. สร้างและสตาร์ททุกบริการ (frontend ที่พอร์ต 3000, backend ที่ 8080, webhook listener ที่ 4000, db ที่ 5433):

```bash
docker compose up --build
```

2. สตาร์ทเฉพาะบริการ frontend เท่านั้น (build + run) โดยไม่เปิดบริการอื่น:

```bash
docker compose up --build frontend
```

3. หยุดบริการทั้งหมด:

```bash
docker compose down
```

หมายเหตุ: บริการ `backend` จะรัน migration และ seed ผู้ใช้ตัวอย่างตอนสตาร์ทผ่าน `backend/scripts/entrypoint.sh`

## เข้าสู่ระบบ (ผู้ใช้ตัวอย่าง)

ระบบจะสร้างผู้ใช้ตัวอย่าง 3 รายให้อัตโนมัติ (ดูใน `backend/scripts/entrypoint.sh`):

- Admin: `admin@example.com` / `Password123!`
- Support: `support01@example.com` / `Password123!`
- User: `user@example.com` / `Password123!`

วิธีเข้าสู่ระบบจากหน้าเว็บ:

1. เปิด http://localhost:3000/login
2. ใช้บัญชีตัวอย่างด้านบน

หลังจากล็อกอิน ตัว client จะเก็บ session cookie (httpOnly) และคุณจะเข้าถึง `/dashboard` ได้

## ทดสอบ WebSocket (Realtime)

Frontend จะเชื่อมต่อกับ Socket.IO บน backend — หากต้องการทดสอบแบบแมนนวล:

1. เปิด console ในเบราว์เซอร์ขณะอยู่ที่หน้า dashboard — client ใช้ `socket` ใน `frontend/src/lib/socket.ts` และ URL ถูกกำหนดจาก `NEXT_PUBLIC_API_BASE_URL`
2. สามารถส่ง event จากฝั่ง server เพื่อจำลองการเปลี่ยนสถานะ ตัวอย่าง (รันจากภายใน container ของ backend หรือจากสคริปต์ที่เชื่อมต่อกับ socket ของ server):

```js
// Node script example to emit a status change
const { io } = require('socket.io-client');
const socket = io('http://localhost:8080', { withCredentials: true });
socket.on('connect', () => {
	socket.emit('issue:status_changed', { id: 'issue-id', status: 'RESOLVED' });
});
```

ที่ฝั่ง client คอมโพเนนต์ `IssueList` จะฟังเหตุการณ์ `issue:status_changed` และอัพเดต cache ของรายการอัตโนมัติ

## ตัวอย่าง Webhook

Webhook listener จะรับ POST ที่ `/webhook` และตรวจสอบ HMAC signature โดยใช้ตัวแปร `WEBHOOK_SECRET`

ตัวอย่าง `curl` สำหรับส่ง webhook ที่เซ็นแล้ว (สมมติ `WEBHOOK_SECRET` = `mysecret`):

```bash
PAYLOAD='{"issueId":"abc","status":"RESOLVED"}'
TIMESTAMP=$(date +%s)
SIGNATURE=$(printf "%s.%s" "$TIMESTAMP" "$PAYLOAD" | openssl dgst -sha256 -hmac "mysecret" -binary | xxd -p -c 256)
curl -X POST http://localhost:4000/webhook \
	-H "Content-Type: application/json" \
	-H "X-Signature: t=${TIMESTAMP},hmac=${SIGNATURE}" \
	-d "$PAYLOAD"
```

เมื่อมีคำขอที่ถูกต้อง คุณจะเห็น log ใน container ของ `webhook-listener` เช่น:

```
[Webhook] Received and verified successfully: { issueId: 'abc', status: 'RESOLVED' }
```

ถ้าการตรวจสอบลายเซ็นไม่ผ่าน จะเห็น:

```
[Webhook] Rejected: Invalid signature
```

## หมายเหตุ & แนวทางที่แนะนำ

- ห้าม commit secrets ของ production ลงใน repository หากเป็นการทดสอบ/สัมภาษณ์ชั่วคราวอาจเพิ่ม `.env` ชั่วคราวได้ แต่ควรระมัดระวังความเสี่ยงด้านความปลอดภัย

---

## Postman Collection

โฟลเดอร์นี้มีไฟล์ Postman Collection ที่เตรียมไว้ให้สำหรับทดสอบ API โดยตรง:

- ไฟล์: `it-issue-tracker.postman_collection.json` (อยู่ที่ root ของ repo)

วิธีใช้งานสั้น ๆ:

1. เปิด Postman → File → Import → เลือกไฟล์ `it-issue-tracker.postman_collection.json`
2. (ถ้ามี) สร้าง Environment ใน Postman แล้วเพิ่มตัวแปรที่ต้องการ เช่น `base_url` และ `webhook_url` ตามค่าในเครื่องคุณ
3. ใช้ seeded accounts ในการทดสอบ (backend จะ seed ผู้ใช้ตอนสตาร์ท):
	 - Admin: `admin@example.com` / `Password123!`
	 - Support: `support01@example.com` / `Password123!`
	 - User: `user@example.com` / `Password123!`

หมายเหตุสำคัญ:
- Endpoint `POST /api/auth/register` จะสร้างผู้ใช้ role `USER` เท่านั้น (ถ้าต้องการ Admin/Support ให้ใช้ผู้ใช้ที่ถูก seed หรือปรับ seed script)
- Collection นี้ประกอบด้วยตัวอย่างคำขอหลัก: register, login (Admin/Support/User), logout, get /api/me, สร้าง issue, ดึง issue ตาม role, เปลี่ยนสถานะ, assign, และ webhook test

Curl equivalents:

ตัวอย่างคำสั่ง curl ที่เทียบเท่ากับ request ใน Collection (ปรับ URL/port ตามเครื่องคุณ):

```bash
# Login (รับ cookie)
curl -i -X POST http://localhost:8080/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"admin@example.com","password":"Password123!"}'

# Get issues (ต้องมี cookie / token ถ้าจำเป็น)
curl -i http://localhost:8080/api/issues

# Create issue (ตัวอย่าง)
curl -i -X POST http://localhost:8080/api/issues \
	-H "Content-Type: application/json" \
	-d '{"title":"Example issue","description":"Steps...","priority":"LOW"}'

# Webhook signed example (ใช้ WEBHOOK_SECRET เดียวกับ webhook-listener)
PAYLOAD='{"issueId":"abc","status":"RESOLVED"}'
TIMESTAMP=$(date +%s)
SIGNATURE=$(printf "%s.%s" "$TIMESTAMP" "$PAYLOAD" | openssl dgst -sha256 -hmac "mysecret" -binary | xxd -p -c 256)
curl -X POST http://localhost:4000/webhook \
	-H "Content-Type: application/json" \
	-H "X-Signature: t=${TIMESTAMP},hmac=${SIGNATURE}" \
	-d "$PAYLOAD"
```
---
````