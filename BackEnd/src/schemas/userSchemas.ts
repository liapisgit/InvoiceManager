import { z } from "zod";

const passwordSchema = z.string().min(8).max(128);

export const userLoginSchema = z.object({
  user_name: z.string().min(3),
  password: z.string(),
});

export const createUserSchema = z.object({
  user_name: z.string().trim().min(3).max(50),
  password: passwordSchema,
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(50).nullable().optional(),
  is_approver: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: passwordSchema,
});
