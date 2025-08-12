import { PrismaClient } from '@prisma/client';

// ประกาศตัวแปร global เพื่อเก็บอินสแตนซ์ของ PrismaClient
// เพื่อให้ PrismaClient ถูกใช้งานซ้ำในระหว่างการ hot reload ใน development
// เพื่อหลีกเลี่ยงการใช้การเชื่อมต่อฐานข้อมูลจนหมด
declare global {
  var prisma: PrismaClient | undefined;
}

// สร้างอินสแตนซ์ของ PrismaClient
// หากตัวแปร global มีอินสแตนซ์ของ PrismaClient อยู่แล้ว ให้ใช้งานซ้ำ
// หากไม่มี ให้สร้างอินสแตนซ์ใหม่
const prisma = global.prisma || new PrismaClient();

// ใน environment ที่ไม่ใช่ production ให้เก็บอินสแตนซ์ของ PrismaClient ไว้ในตัวแปร global
// เพื่อป้องกันการสร้างอินสแตนซ์หลายตัวในระหว่างการ hot reload
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

// ส่งออกอินสแตนซ์ของ PrismaClient เพื่อใช้งานในส่วนอื่นของแอปพลิเคชัน
export default prisma;