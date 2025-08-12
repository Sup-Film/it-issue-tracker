import { Request, Response, NextFunction } from "express";

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
        code: "NOT_AUTHENTICATED",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
};

// Convenient role checking functions
export const requireAdmin = requireRole(["ADMIN"]);
export const requireManagerOrAdmin = requireRole(["SUPPORT", "ADMIN"]);
export const requireUser = requireRole(["USER", "SUPPORT", "ADMIN"]);
