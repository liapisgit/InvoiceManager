import { z } from "zod";

export const createInvoiceSchema = z.object({
  invoice_date: z.coerce.date().optional(),
  document_type: z.string().optional(),
  mark: z.string().optional(),
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
  is_paid: z.boolean().optional(),
  comments: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  expense_type: z.string().optional(),
  file_url: z.string().optional(),
  file_hash: z.string().optional(),
  file_upload_id: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  invoice_date: z.date().optional(),
  document_type: z.string().optional(),
  mark: z.string().optional(),
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
  is_paid: z.boolean().optional(),
  comments: z.string().optional(),
  company: z.string().optional(),
  category: z.string().optional(),
  expense_type: z.string().optional(),
  file_url: z.string().optional(),
  file_hash: z.string().optional(),
  file_upload_id: z.string().optional(),
});
