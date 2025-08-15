import prisma from "../../lib/db";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "./auth.validation";
import { ZodError } from "zod";
import { AuthService } from "./auth.service";
import { formatZodErrors } from "../../utils/zodErrorFormatter";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const user = await AuthService.register({ name, email, password });

    console.log(user);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.issues);

      return res
        .status(400)
        .json({ message: "Invalid input", errors: formatZodErrors(error) });
    }

    if (error instanceof Error && error.message === "USER_EXISTS") {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await AuthService.login({ email, password });

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" } // Token will expire in 1 day
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.issues);

      return res
        .status(400)
        .json({ message: "Invalid input", errors: formatZodErrors(error) });
    }

    if (error instanceof Error) {
      if (error.message === "USER_NOT_FOUND") {
        return res.status(404).json({ message: "User not found" });
      }
      if (error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }
    
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  return res.status(200).json({ message: "Logged out successfully" });
};
