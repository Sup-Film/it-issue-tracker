import { z } from "zod";

export const createIssueSchema = z.object({
  title: z.string().min(3, "หัวข้อต้องมีอย่างน้อย 3 ตัวอักษร"),
  description: z.string().min(10, "รายละเอียดต้องยาวอย่างน้อย 10 ตัวอักษร"),
  category: z.string().min(2, "ระบุหมวดหมู่"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
