import { Request, Response } from "express";
import { userService } from "./user.service";

export const getSupportUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getSupportUsers();
    res.json(users);
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: "Failed to retrieve support users." });
  }
};
