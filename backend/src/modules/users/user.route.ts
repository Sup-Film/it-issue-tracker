import { Router } from "express";
import { getSupportUsers } from "./user.controller";
import { authenticateToken } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/role.middleware";

const router = Router();

// Middleware สำหรับตรวจสอบ Token
router.use(authenticateToken);

// Route สำหรับดึงข้อมูลผู้ใช้ที่มีบทบาทเป็น Support
router.get("/support", requireAdmin, getSupportUsers);

export default router;
