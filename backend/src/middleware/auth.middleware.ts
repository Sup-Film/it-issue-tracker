import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Define JWT payload interface for type safety
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    // Use promisified JWT verification for better error handling
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    // Better error differentiation
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "Token has expired",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    // Handle unexpected errors
    console.error("Authentication error:", error);
    return res.status(500).json({
      message: "Authentication service error",
      code: "AUTH_ERROR",
    });
  }
};
