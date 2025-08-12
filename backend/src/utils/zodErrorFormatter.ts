import { ZodError } from "zod";

/**
 * แปลง ZodError ให้อยู่ในรูปแบบที่ frontend เข้าใจง่าย (Reusable)
 */
export const formatZodErrors = (error: ZodError) =>
  error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
