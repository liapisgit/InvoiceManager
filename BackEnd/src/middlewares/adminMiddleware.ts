import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { userRepository } from "../repositories/userRepository";

export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.user_id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Authentication is required" });
    }

    const user = await userRepository.findById(req.user.user_id);
    if (!user?.is_admin) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ error: "Admin access is required" });
    }

    return next();
  } catch (error) {
    console.error("Error checking admin access:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to verify admin access" });
  }
};
