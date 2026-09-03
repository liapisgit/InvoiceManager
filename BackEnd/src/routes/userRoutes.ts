import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../middlewares/validationMiddleware";
import { updateUserSchema } from "../schemas/catalogSchemas";
import { userLoginSchema } from "../schemas/userSchemas";
import { userRepository } from "../repositories/userRepository";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { triggerCatalogWebhook } from "../lib/catalogWebhook";
import jwt from "jsonwebtoken";

const userRouter = Router();

const getUserLabel = (user: {
  first_name: string | null;
  last_name: string | null;
}) => `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

userRouter.post("/login", validate(userLoginSchema), async (req, res) => {
  const user = await userRepository.findByUserName(req.body.user_name);

  if (!user || !user.is_active || user.password !== req.body.password) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Invalid user_name or password" });
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "JWT_SECRET is not configured" });
  }
  const accessToken = jwt.sign(
    {
      user_id: user.id,
      user_name: user.user_name,
      first_name: user.first_name,
      last_name: user.last_name,
      is_admin: user.is_admin,
      createdAt: user.createdAt,
      lastUpdatedAt: user.lastUpdatedAt,
    },
    jwtSecret,
    { expiresIn: "30d" },
  );
  return res.json({
    accessToken,
  });
});

userRouter.get("/approvers", authMiddleware, async (_req, res) => {
  try {
    const approvers = await userRepository.findApprovers();
    return res.json(
      approvers.map((user) => ({
        id: user.id,
        phone: user.phone,
        user_name: user.user_name,
        label: getUserLabel(user),
      })),
    );
  } catch (error) {
    console.error("Error fetching approvers:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch approvers",
    });
  }
});

userRouter.get("/", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await userRepository.findAll();
    return res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch users",
    });
  }
});

userRouter.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validate(updateUserSchema),
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "User id is required" });
      }
      const user = await userRepository.update(id, req.body);
      await triggerCatalogWebhook({
        entity: "user",
        action: "updated",
        data: user,
        actor: req.user,
      });
      return res.json(user);
    } catch (error: any) {
      console.error("Error updating user:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to update user",
        details: error?.message || "Unknown error",
      });
    }
  },
);

userRouter.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "User id is required" });
      }
      if (id === req.user?.user_id) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: "You cannot delete your own account",
        });
      }
      const user = await userRepository.deactivate(id);
      await triggerCatalogWebhook({
        entity: "user",
        action: "deleted",
        data: user,
        actor: req.user,
      });
      return res.status(StatusCodes.NO_CONTENT).send();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      if (error?.code === "P2025") {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to delete user",
        details: error?.message || "Unknown error",
      });
    }
  },
);

export default userRouter;
