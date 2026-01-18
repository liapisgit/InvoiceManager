import { z } from "zod";

export const userSignUpSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(6),
});

export const userLoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});
