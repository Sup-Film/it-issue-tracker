import { Request, Response } from "express";
import prisma from "../../lib/db";
import {
  createIssueSchema,
  updateStatusSchema,
  assignIssueSchema,
} from "./issue.validation";
import { ZodError } from "zod";

export const createIssue = async (req: Request, res: Response) => {
  try {
    const issueData = createIssueSchema.parse(req.body);
    const authorId = req.user?.userId;

    if (!authorId) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    const issue = await prisma.issue.create({
      data: {
        ...issueData,
        author: { connect: { id: authorId } },
        updatedBy: { connect: { id: authorId } },
      },
    });

    res.status(201).json(issue);
  } catch (error) {
    if (error instanceof ZodError) {
      // Error ของ Zod จะใช้ error.issues
      console.log(error.issues);

      // แปลงเป็น format ที่ frontend เข้าใจง่าย
      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join("."), // "user.email"
        message: issue.message, // "Invalid email address"
        code: issue.code, // "invalid_string"
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getIssues = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const { role, userId } = req.user;
  let issues;

  try {
    if (role === "ADMIN") {
      const { status, priority, search } = req.query;
      issues = await prisma.issue.findMany({
        where: {
          // ถ้ามี status จะ filter ตามที่กำหนด
          status: status ? (status as any) : undefined,
          // ถ้ามี priority จะ filter ตามที่กำหนด
          priority: priority ? (priority as any) : undefined,
          // ถ้ามี search จะ filter ตามที่กำหนด
          OR: search
            ? [
                { title: { contains: search as string, mode: "insensitive" } },
                {
                  description: {
                    contains: search as string,
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
    } else if (role === "SUPPORT") {
      // Support สามารถดูปัญหาที่ได้รับมอบหมายให้
      issues = await prisma.issue.findMany({
        where: { assigneeId: userId },
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // User สามารถดูปัญหาที่ตัวเองสร้างได้
      issues = await prisma.issue.findMany({
        where: { authorId: userId },
        include: { assignee: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
    res.status(200).json(issues);
  } catch (error) {
    console.error("Error fetching issues:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);
    const updatedById = req.user?.userId;

    if (!updatedById) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        status,
        updatedBy: { connect: { id: updatedById } },
      },
    });

    res.status(200).json(updatedIssue);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.issues);

      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const assignIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assigneeId } = assignIssueSchema.parse(req.body);
    const updatedById = req.user?.userId;

    if (!updatedById) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        assignee: { connect: { id: assigneeId } },
        updatedBy: { connect: { id: updatedById } },
      },
    });

    res.status(200).json(updatedIssue);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.issues);

      const formattedErrors = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
