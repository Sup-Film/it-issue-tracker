import prisma from "../../lib/db";

export class userService {
  static async getSupportUsers() {
    return prisma.user.findMany({
      where: { role: "SUPPORT" },
      select: { id: true, name: true, email: true },
    });
  }
}
