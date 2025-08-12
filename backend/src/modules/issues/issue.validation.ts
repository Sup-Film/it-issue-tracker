import { z } from "zod";
import { Priority, IssueStatus } from "@prisma/client";

export const idParamSchema = z.object({
  id: z.cuid("Invalid ID format"),
});

export const createIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(3, "Category is required"),
  priority: z.enum(Priority),
});

export const getIssueSchema = z.object({
  status: z.enum(IssueStatus).optional(),
  priority: z.enum(Priority).optional(),
  search: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(IssueStatus),
});

export const assignIssueSchema = z.object({
  assigneeId: z.cuid("Invalid user ID format"),
});

export type IdParamsInput = z.infer<typeof idParamSchema>;
export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type GetIssueInput = z.infer<typeof getIssueSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AssignIssueInput = z.infer<typeof assignIssueSchema>;
