import { z } from "zod";
import { Priority, IssueStatus } from "@prisma/client";

export const createIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(3, "Category is required"),
  priority: z.enum(Priority),
});

export const updateStatusSchema = z.object({
  status: z.enum(IssueStatus),
});

export const assignIssueSchema = z.object({
  assigneeId: z.cuid("Invalid user ID format"),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AssignIssueInput = z.infer<typeof assignIssueSchema>;
