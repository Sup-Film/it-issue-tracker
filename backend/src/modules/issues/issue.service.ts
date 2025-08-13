import { IssueStatus } from "@prisma/client";
import prisma from "../../lib/db";
import {
  CreateIssueInput,
  GetIssueInput,
  UpdateStatusInput,
} from "./issue.validation";
import { io } from "../../lib/socket";

export class IssueService {
  // Create a new issue
  static async createIssue(data: CreateIssueInput, authorId: string) {
    return await prisma.issue.create({
      data: {
        ...data,
        author: { connect: { id: authorId } },
        updatedBy: { connect: { id: authorId } },
      },
    });
  }

  static async getAdmin(filters: GetIssueInput) {
    return await prisma.issue.findMany({
      where: {
        status: filters.status,
        priority: filters.priority,
        OR: filters.search
          ? [
              {
                title: {
                  contains: filters.search as string,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: filters.search as string,
                  mode: "insensitive",
                },
              },
            ]
          : undefined,
      },
      // ทำการดึงข้อมูลความสัมพันธ์ของ ผู้สร้าง และ ผู้รับผิดชอบ
      include: {
        author: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getSupportIssues(userId: string) {
    return await prisma.issue.findMany({
      where: { assigneeId: userId },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getUserIssues(userId: string) {
    return await prisma.issue.findMany({
      where: { authorId: userId },
      include: { assignee: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  static async updateIssueStatus(
    id: string,
    status: IssueStatus,
    updatedById: string
  ) {
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        status, // status เป็น string (enum) เช่น "IN_PROGRESS"
        updatedBy: { connect: { id: updatedById } },
      },
    });

    const authorId = updatedIssue.authorId;

    if (io && authorId) {
      try {
        io.to(authorId).emit("issue:status_changed", updatedIssue);
        console.log(
          `Issue status changed for issue ID ${id}, notifying author ${authorId}`
        );
      } catch (err) {
        // log error เฉพาะส่วน socket
        console.error("Socket emit error:", err);
      }
    }

    return updatedIssue;
  }

  static async assignIssue(
    id: string,
    assigneeId: string,
    updatedById: string
  ) {
    return await prisma.issue.update({
      where: { id },
      data: {
        assignee: { connect: { id: assigneeId } },
        updatedBy: { connect: { id: updatedById } },
      },
    });
  }
}
