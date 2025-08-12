import { Router } from "express";
import {
  createIssue,
  getIssues,
  updateIssueStatus,
  assignIssue,
} from "./issue.controller";
import { authenticateToken } from "../../middleware/auth.middleware";
import {
  requireAdmin,
  requireSupportOrAdmin,
} from "../../middleware/role.middleware";

const router = Router();

// Middleware สำหรับตรวจสอบ Token
router.use(authenticateToken);

router.post("/", createIssue); // ทุกคนที่ผ่านการตรวจสอบสิทธิ์สามารถสร้างปัญหาได้
router.get("/", getIssues); // ทุกคนที่ผ่านการตรวจสอบสิทธิ์สามารถดูปัญหาได้ตาม Role ที่กำหนด

// Only Admin and Support can change status or assign
router.put("/:id/status", requireSupportOrAdmin, updateIssueStatus);
router.put("/:id/assign", requireAdmin, assignIssue);

export default router;
