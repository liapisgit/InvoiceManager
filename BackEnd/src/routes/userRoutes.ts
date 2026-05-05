import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { validate } from "../middlewares/validationMiddleware";
import { userLoginSchema } from "../schemas/userSchemas";
import { userRepository } from "../repositories/userRepository";
import jwt from "jsonwebtoken";

const userRouter = Router();

userRouter.post("/login", validate(userLoginSchema), async (req, res) => {
  const user = await userRepository.findByUserName(req.body.user_name);

  if (!user || user.password !== req.body.password) {
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

export default userRouter;
