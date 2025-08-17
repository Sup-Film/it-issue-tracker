import { Request, Response } from "express";
import prisma from "../../lib/db";
import {
  createIssueSchema,
  updateStatusSchema,
  assignIssueSchema,
  getIssueSchema,
  idParamSchema,
} from "./issue.validation";

import { ZodError, z } from "zod";
import { formatZodErrors } from "../../utils/zodErrorFormatter";
import { IssueService } from "./issue.service";

export const createIssue = async (req: Request, res: Response) => {
  try {
    const issueData = createIssueSchema.parse(req.body);
    const authorId = req.user?.userId;

    if (!authorId) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    const issue = await IssueService.createIssue(issueData, authorId);
    res.status(201).json(issue);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.issues);
      return res.status(400).json({
        message: "Validation failed",
        errors: formatZodErrors(error),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAdminIssues = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    const filters = getIssueSchema.parse(req.query);
    const issues = await IssueService.getAdmin(filters);
    res.status(200).json(issues);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: formatZodErrors(error),
      });
    }

    console.error("Error fetching issues:", error);
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getSupportIssues = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User authentication required",
    });
  }
  try {
    const issues = await IssueService.getSupportIssues(req.user.userId);
    res.status(200).json(issues);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: formatZodErrors(error),
      });
    }

    console.error("Error fetching issues:", error);
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getUserIssues = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      message: "User authentication required",
    });
  }
  try {
    const issues = await IssueService.getUserIssues(req.user.userId);
    res.status(200).json(issues);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: formatZodErrors(error),
      });
    }

    console.error("Error fetching issues:", error);
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status } = updateStatusSchema.parse(req.body);
    const updatedById = req.user?.userId;

    if (!updatedById) {
      return res.status(401).json({ message: "User authentication required" });
    }

    // เรียก service โดยส่ง id, status, updatedById
    const updatedIssue = await IssueService.updateIssueStatus(
      id,
      status,
      updatedById
    );
    res.status(200).json(updatedIssue);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: formatZodErrors(error),
      });
    }
  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
  }
};

export const assignIssue = async (req: Request, res: Response) => {
  try {
    // Debug log: help diagnose assign failures (remove in production)
    console.log("AssignIssue called", {
      params: req.params,
      body: req.body,
      user: req.user,
    });
    const { id } = idParamSchema.parse(req.params);
    const { assigneeId } = assignIssueSchema.parse(req.body);
    const updatedById = req.user?.userId;

    if (!updatedById) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    const updatedIssue = await IssueService.assignIssue(
      id,
      assigneeId,
      updatedById
    );
    res.status(200).json(updatedIssue);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.issues);
      return res.status(400).json({
        message: "Validation failed",
        errors: formatZodErrors(error),
      });
    }

    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
