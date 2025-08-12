import { z } from "zod";

// Base schemas for reusability
const emailSchema = z.email({ message: "Please enter a valid email address" });
const passwordSchema = z.string().min(6, { 
  message: "Password must be at least 6 characters long" 
});

// Registration validation schema
export const registerSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must not exceed 50 characters" }),
  password: passwordSchema
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "Password must contain at least one uppercase, lowercase, and number"
    }),
});

// Login validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

// Type inference for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
