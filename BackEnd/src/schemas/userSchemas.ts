import { z } from "zod";

const passwordSchema = z.string().min(8).max(128);

const PHONE_PREFIX = "30";

// Stores every phone as 30 + 10 digits (e.g. 306971234567); empty -> null
const normalizePhone = (value: unknown) => {
  if (typeof value !== "string") return value;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 ? `${PHONE_PREFIX}${digits}` : digits;
};

export const phoneSchema = z.preprocess(
  normalizePhone,
  z
    .string()
    .regex(/^30\d{10}$/, "not a valid phone number (expected 30 followed by 10 digits)")
    .nullable()
    .optional(),
);

export const userLoginSchema = z.object({
  user_name: z.string().min(3),
  password: z.string(),
});

export const createUserSchema = z.object({
  user_name: z.string().trim().min(3).max(50),
  password: passwordSchema,
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  phone: phoneSchema,
  is_approver: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: passwordSchema,
});
