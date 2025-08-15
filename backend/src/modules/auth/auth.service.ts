import prisma from "../../lib/db";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";
import { th } from "zod/v4/locales/index.cjs";

export class AuthService {
  static async register({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    console.log(existingUser);
    if (existingUser) {
      throw new Error("USER_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, 12); // เพิ่ม security
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  static async login({ email, password }: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return user;
  }
}
