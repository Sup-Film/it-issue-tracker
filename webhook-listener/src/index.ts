import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import dotenv from "dotenv";

/**
 * ตัวรับ Webhook
 * -----------------------
 * วัตถุประสงค์: รับคำขอแบบ POST จากบริการอื่น (sender/backend)
 * ที่ส่งเหตุการณ์เช่น `issue.updated` มาให้ โดยจะยืนยันว่าคำขอ
 * มาจากผู้ส่งที่เชื่อถือได้ด้วยการตรวจ HMAC ที่มี timestamp ประกอบ
 * (ช่วยป้องกันการปลอมและการ replay)
 *
 * แนวคิด:
 * - rawBody: เก็บไบต์ดิบของคำขอก่อนที่ Express จะ parse เป็น JSON
 *   เพราะ HMAC ต้องคำนวณจากไบต์เดียวกันที่ผู้ส่งเซ็นไว้
 * - Header `X-Signature`: ผู้ส่งจะส่งข้อมูลในรูป `t=<timestamp>,hmac=<hex>`
 *   เพื่อให้เราตรวจสอบความสดใหม่ (anti-replay) และความถูกต้อง (HMAC)
 * - WEBHOOK_SECRET: ความลับร่วม (shared secret) ต้องตรงกับผู้ส่งและ
 *   ต้องเก็บเป็นความลับ (ห้าม commit ลง git)
 */

// === ขยาย type ของ Express Request ===
// เราเพิ่ม property `rawBody?: Buffer` เพื่อเก็บไบต์ดิบของ request body
// (ก่อน Express จะ parse เป็น JSON) ซึ่งจำเป็นสำหรับการตรวจ HMAC
declare module "express-serve-static-core" {
  interface Request {
    rawBody?: Buffer;
  }
}

// === โหลด environment variables ===
// โดยปกติให้สร้างไฟล์ `.env` ที่มีค่า WEBHOOK_SECRET และ SERVER_PORT
// ตัวอย่าง .env:
// WEBHOOK_SECRET=07d3...
// SERVER_PORT=4000
dotenv.config(); // โหลดค่า .env เข้ามาใน process.env

const app = express();
const port = process.env.SERVER_PORT || 4000; // ถ้าไม่มีใน env ให้ใช้ 4000 เป็น default
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!; // ความลับร่วมที่ต้องตรงกับ sender

// === Middleware: อ่าน body และเก็บ raw body ===
// เราใช้ express.json() เพื่อ parse JSON แต่เพิ่ม option `verify` ที่จะถูกเรียก
// ก่อน parsing เสร็จ ซึ่งจะได้รับ raw Buffer ของ body เป็นพารามิเตอร์
// - ทำไมต้องเก็บ rawBuffer? เพราะ HMAC ที่ sender คำนวณจะอิงกับไบต์ดิบ
//   ถ้าเราใช้ JSON.stringify หรือ parser อื่น ๆ ก่อนจะทำให้ลายเซ็นไม่ตรง
app.use(
  express.json({
    verify: (req: Request, res, buf) => {
      // เก็บ Buffer ดิบไว้ใน req.rawBody สำหรับการตรวจสอบลายเซ็น
      req.rawBody = buf;
    },
  })
);

// === Route: /webhook ===
// ขั้นตอนหลัก:
// 1) อ่าน header `X-Signature` ซึ่งเราคาดว่าจะได้รูปแบบ `t=<timestamp>,hmac=<hex>`
// 2) ตรวจ timestamp ว่าไม่เก่าจนถูกปฏิเสธ (anti-replay)
// 3) คำนวณ HMAC จาก `${timestamp}.${rawBody}` และเปรียบเทียบกับค่าใน header
app.post("/webhook", (req, res: Response) => {
  // อ่าน header ที่ sender ส่งมา
  const signatureHeader = req.header("X-Signature");
  if (!signatureHeader) {
    // ถ้าไม่มี header ที่คาดไว้ ให้ตอบ 400
    return res.status(400).send("X-Signature header is missing.");
  }

  // แยกค่า t= และ hmac= ออกจาก header
  const parts = signatureHeader.split(",").reduce((acc, part) => {
    const [key, value] = part.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts["t"];
  const receivedHmac = parts["hmac"];

  if (!timestamp || !receivedHmac) {
    // รูปแบบ header ผิด -> 400
    return res.status(400).send("Invalid X-Signature header format.");
  }

  // === ตรวจ timestamp เพื่อป้องกัน replay attack ===
  // แปลง timestamp ที่ sender ส่งมาเป็นเลขวินาที และเทียบกับเวลาปัจจุบัน
  const timeDifference = Math.abs(
    Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
  );
  if (timeDifference > 300) {
    // ถ้าต่างเกิน 5 นาที ให้ปฏิเสธ (408)
    console.warn(
      `[Webhook] Rejected: Old timestamp (diff: ${timeDifference}s)`
    );
    return res.status(408).send("Request timestamp is too old.");
  }

  // === ตรวจสอบ HMAC (ยืนยันความถูกต้องของข้อมูล) ===
  // 1) สร้างสตริงที่ sender ต้องใช้เซ็น: `${timestamp}.${rawBody}`
  // 2) สร้าง HMAC ด้วย SHA256 และความลับร่วม
  // 3) เปรียบเทียบกับค่าใน header โดยใช้ timingSafeEqual
  const signaturePayload = `${timestamp}.${req.rawBody!.toString()}`;
  const expectedHmac = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signaturePayload)
    .digest("hex");

  // แปลงเป็น Buffer และตรวจความยาวก่อนเปรียบเทียบ
  try {
    const receivedBuf = Buffer.from(receivedHmac, "hex");
    const expectedBuf = Buffer.from(expectedHmac, "hex");
    if (
      receivedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(receivedBuf, expectedBuf)
    ) {
      // ลายเซ็นไม่ตรง -> ปฏิเสธ 403
      console.warn("[Webhook] Rejected: Invalid signature");
      return res.status(403).send("Invalid signature.");
    }
  } catch (err) {
    // รูปแบบ hmac ใน header ไม่ใช่ hex ที่ถูกต้อง -> ปฏิเสธ
    console.warn("[Webhook] ปฏิเสธ: รูปแบบลายเซ็นไม่ถูกต้อง");
    return res.status(403).send("Invalid signature.");
  }

  console.log("[Webhook] Received and verified successfully:", req.body);
  res.status(200).json({ status: "received" });
});

app.listen(port, () => {
  console.log(`Webhook listener is listening on port ${port}`);
});
