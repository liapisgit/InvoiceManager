import { Router } from "express";
import { validate } from "../middlewares/validationMiddleware";
import { userSignUpSchema, userLoginSchema } from "../schemas/userSchemas";
import { userRepository } from "../repositories/userRepository";

const userRouter = Router();

userRouter.post("/signup", validate(userSignUpSchema), async (req, res) => {
  const user = await userRepository.create(req.body);
  res.json(user);
});

export default userRouter;
