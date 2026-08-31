import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const optionalTrimmedString = z.preprocess(
  emptyToNull,
  z.string().nullable().optional(),
);

const vatNumberSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^[0-9]{9}$/, "VAT number must have 9 digits")
    .nullable()
    .optional(),
);

export const createCompanySchema = z.object({
  company_display_name: z.string().trim().min(1),
  company_name: z.string().trim().min(1),
  vat_number: vatNumberSchema,
  is_issuer: z.boolean().optional(),
  is_self_project: z.boolean().optional(),
  auto_self_approve: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const createProjectSchema = z.object({
  company_id: z.string().min(1),
  name: z.string().trim().min(1),
  is_active: z.boolean().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).optional(),
  is_active: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  first_name: optionalTrimmedString,
  last_name: optionalTrimmedString,
  phone: optionalTrimmedString,
  approver_number: optionalTrimmedString,
  is_approver: z.boolean().optional(),
  is_admin: z.boolean().optional(),
});
