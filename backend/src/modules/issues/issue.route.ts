import { Router } from "express";
import {
  createIssue,
  updateIssueStatus,
  assignIssue,
  getAdminIssues,
  getSupportIssues,
  getUserIssues,
} from "./issue.controller";
import { authenticateToken } from "../../middleware/auth.middleware";
import {
  requireAdmin,
  requireSupport,
  requireSupportOrAdmin,
  requireUser,
} from "../../middleware/role.middleware";

const router = Router();

// Middleware สำหรับตรวจสอบ Token
router.use(authenticateToken);

router.post("/", createIssue); // ทุกคนที่ผ่านการตรวจสอบสิทธิ์สามารถสร้างปัญหาได้

// แยก endpoint ตาม role
router.get("/admin", requireAdmin, getAdminIssues);
router.get("/support", requireSupport, getSupportIssues);
router.get("/user", requireUser, getUserIssues);

// Only Admin and Support can change status or assign
router.put("/:id/status", requireSupportOrAdmin, updateIssueStatus);
router.put("/:id/assign", requireAdmin, assignIssue);

export default router;
