import { z } from "zod";

export const createInvoiceSchema = z.object({
  afm: z.string().optional(),
  invoice_series: z.string().optional(),
  invoice_number: z.string().optional(),
  mark: z.string().optional(),
  project: z.string().optional(),
  iban: z.string().optional(),
  invoice_date: z.coerce.date(),
  isPaid: z.boolean().optional(),
  comments: z.string().optional(),
  vendor_name: z.string().min(1, "Vendor name is required"),
  total_amount: z.coerce.number().positive("Total amount must be positive"),
});

export const updateInvoiceSchema = z.object({
  afm: z.string().optional(),
  invoice_series: z.string().optional(),
  invoice_number: z.string().optional(),
  mark: z.string().optional(),
  project: z.string().optional(),
  iban: z.string().optional(),
  invoice_date: z.coerce.date().optional(),
  isPaid: z.boolean().optional(),
  comments: z.string().optional(),
  vendor_name: z.string().min(1).optional(),
  total_amount: z.coerce.number().positive().optional(),
});
