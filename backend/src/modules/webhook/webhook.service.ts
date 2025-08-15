import crypto from 'crypto';
import fetch from 'node-fetch';
import { Issue, User } from '@prisma/client';

// Type ที่รวมข้อมูล issue และ user ที่อัปเดต (ใช้สำหรับ payload)
type IssueWithRelations = Issue & { updatedBy: User | null };

// Secret และ URL สำหรับ webhook
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;
const WEBHOOK_URL = process.env.WEBHOOK_URL!;

// ฟังก์ชันสำหรับ sign payload เพื่อความปลอดภัย (HMAC SHA256)
// ใช้ timestamp + payload เพื่อป้องกัน replay attack และยืนยันความถูกต้องของข้อมูล
const signPayload = (timestamp: string, payload: object): string => {
  const signaturePayload = `${timestamp}.${JSON.stringify(payload)}`;
  return crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(signaturePayload)
    .digest('hex');
};

// ฟังก์ชันส่ง webhook พร้อมกลไก retry (exponential backoff)
// ถ้าส่งไม่สำเร็จจะพยายามใหม่สูงสุด 3 ครั้ง (2s, 4s)
const sendRequestWithRetry = async (payload: object, attempt = 1): Promise<void> => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signPayload(timestamp, payload);
  
  console.log(`[Webhook] Attempt ${attempt}: Sending issue.updated event to ${WEBHOOK_URL}`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // ส่ง signature ใน header เพื่อให้ปลายทางตรวจสอบความถูกต้อง
        'X-Signature': `t=${timestamp},hmac=${signature}`,
      },
      body: JSON.stringify(payload),
      timeout: 5000, // 5 seconds
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }
    console.log('[Webhook] Successfully sent.');
  } catch (error) {
    // ถ้าส่งไม่สำเร็จ log error และ retry (สูงสุด 3 ครั้ง)
    console.error(`[Webhook] Attempt ${attempt} failed:`, error);
    if (attempt < 3) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
      await new Promise(res => setTimeout(res, delay));
      await sendRequestWithRetry(payload, attempt + 1);
    } else {
      console.error('[Webhook] All retry attempts failed.');
    }
  }
};

// Service สำหรับส่ง event ไปยัง Webhook
export const WebhookService = {
  // ส่ง event เมื่อ issue ถูกอัปเดต (เช่น status เปลี่ยน)
  async sendIssueUpdate(issue: IssueWithRelations) {
    // ถ้า env ไม่ครบ ให้ข้าม (ป้องกัน error ใน dev/test)
    if (!WEBHOOK_SECRET || !WEBHOOK_URL) {
      console.warn('[Webhook] WEBHOOK_SECRET or WEBHOOK_URL is not configured. Skipping.');
      return;
    }

    // เตรียม payload สำหรับ webhook
    const payload = {
      event: 'issue.updated',
      issue_id: issue.id,
      new_status: issue.status,
      updated_by: issue.updatedBy?.email || 'System',
    };
    
    // ส่ง webhook (async, ไม่ block flow หลัก)
    sendRequestWithRetry(payload);
  },
};