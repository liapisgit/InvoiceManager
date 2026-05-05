import { dbClient } from "../lib/prisma";

type CreateInvoiceData = {
  invoice_date?: Date | null;
  document_type?: string;
  mark?: string | null;
  series?: string;
  number?: string;
  issuer_vat_number?: string;
  issuer_name?: string;
  recipient_vat_number?: string;
  recipient_name?: string;
  recipient_code?: string;
  project?: string;
  payment_method?: string;
  value_before_discount?: number;
  discount_amount?: number;
  net_amount?: number;
  vat_amount?: number;
  withholding_amount?: number;
  fees_or_stamps?: string;
  total_amount?: number;
  issuer_iban?: string;
  is_paid?: boolean;
  comments?: string;
  company?: string;
  category?: string;
  expense_type?: string;
  file_url?: string;
  file_path?: string;
  file_hash?: string;
  file_upload_id?: string;
  status?: string;
  approval_status?: string | null;
  createdBy?: string;
};

type UpdateInvoiceData = Partial<CreateInvoiceData>;

export const invoiceRepository = {
  // async create(data: CreateInvoiceData) {
  //   return dbClient.invoice.create({
  //     data: {
  //       ...data,
  //       total_amount: data.total_amount.toString(),
  //     }
  //   });
  // },
  async create(data: CreateInvoiceData) {
    return dbClient.invoice.create({ data: data });
  },

  async findAll() {
    return dbClient.invoice.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return dbClient.invoice.findUnique({
      where: { id },
    });
  },

  async findByMark(mark: string) {
    return dbClient.invoice.findUnique({
      where: { mark },
    });
  },

  async findByFileUploadId(file_upload_id: string) {
    return dbClient.invoice.findFirst({
      where: { file_upload_id },
      orderBy: { createdAt: "desc" },
    });
  },

  async update(id: string, data: UpdateInvoiceData) {
    return dbClient.invoice.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return dbClient.invoice.delete({
      where: { id },
    });
  },
};
