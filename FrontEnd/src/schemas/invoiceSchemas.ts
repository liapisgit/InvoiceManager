import { z } from "zod";

const statusSchema = z.enum(["processing", "needs_review", "complete", "error","duplicate"]);
const approvalStatusSchema = z.enum([
  "APPROVED",
  "PENDING",
  "REJECTED",
]);
const paymentStatusSchema = z.enum(["Paid", "To be Paid", "Urgent"]);
const optionalStatusSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  statusSchema.optional(),
);
const optionalApprovalStatusSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  approvalStatusSchema.nullable().optional(),
);

export const createInvoiceSchema = z.object({
  invoice_date: z.coerce.date().optional(),
  document_type: z.string().optional(),
  mark: z.string().min(1).nullable().optional(),
  series: z.string().optional(),
  number: z.string().optional(),
  issuer_vat_number: z.string().optional(),
  issuer_name: z.string().optional(),
  recipient_vat_number: z.string().optional(),
  recipient_name: z.string().optional(),
  recipient_code: z.string().optional(),
  project: z.string().optional(),
  payment_method: z.string().optional(),
  value_before_discount: z.coerce.number().optional(),
  discount_amount: z.coerce.number().optional(),
  net_amount: z.coerce.number().optional(),
  vat_amount: z.coerce.number().optional(),
  withholding_amount: z.coerce.number().optional(),
  fees_or_stamps: z.string().optional(),
  total_amount: z.coerce
    .number()
    .positive("Total amount must be positive")
    .optional(),
  issuer_iban: z.string().optional(),
  payment_status: paymentStatusSchema.optional(),
  comments: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  expense_type: z.string().optional(),
  file_url: z.string().optional(),
  file_path: z.string().optional(),
  display_name: z.string().optional(),
  file_hash: z.string().optional(),
  file_upload_id: z.string().optional(),
  status: optionalStatusSchema,
  approval_status: optionalApprovalStatusSchema,
  approver_id: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  invoice_date: z.any().optional(),
  document_type: z.any().optional(),
  mark: z.any().optional(),
  series: z.any().optional(),
  number: z.any().optional(),
  issuer_vat_number: z.any().optional(),
  issuer_name: z.any().optional(),
  recipient_vat_number: z.any().optional(),
  recipient_name: z.any().optional(),
  recipient_code: z.any().optional(),
  project: z.any().optional(),
  payment_method: z.any().optional(),
  value_before_discount: z.any().optional(),
  discount_amount: z.any().optional(),
  net_amount: z.any().optional(),
  vat_amount: z.any().optional(),
  withholding_amount: z.any().optional(),
  fees_or_stamps: z.any().optional(),
  total_amount: z.any().optional(),
  issuer_iban: z.any().optional(),
  payment_status: z.any().optional(),
  comments: z.any().optional(),
  company: z.any().optional(),
  category: z.any().optional(),
  expense_type: z.any().optional(),
  file_url: z.any().optional(),
  file_path: z.any().optional(),
  display_name: z.any().optional(),
  file_hash: z.any().optional(),
  file_upload_id: z.any().optional(),
  status: z.any().optional(),
  approver_id: z.any().optional(),
});
