import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import type { AuthPayload } from "../types/express";
import { userRepository } from "../repositories/userRepository";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "JWT_SECRET is not configured" });
  }

  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, jwtSecret);
    if (
      typeof decoded === "string" ||
      !decoded.user_id ||
      typeof decoded.user_id !== "string"
    ) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Invalid token payload" });
    }
  } catch {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Invalid or expired token" });
  }

  try {
    const user = await userRepository.findById(decoded.user_id);
    if (!user?.is_active) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "User account is inactive" });
    }

    req.user = decoded as AuthPayload;
    return next();
  } catch (error) {
    console.error("Error checking user account status:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to verify user account" });
  }
};
