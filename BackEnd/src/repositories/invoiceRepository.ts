import { dbClient } from "../lib/prisma";

type CreateInvoiceData = {
  afm?: string;
  invoice_series?: string;
  invoice_number?: string;
  mark?: string;
  project?: string;
  iban?: string;
  invoice_date: Date;
  isPaid?: boolean;
  comments?: string;
  vendor_name: string;
  total_amount: number;
};

type UpdateInvoiceData = Partial<CreateInvoiceData>;

export const invoiceRepository = {
  async create(data: CreateInvoiceData) {
    return dbClient.invoice.create({ 
      data: {
        ...data,
        total_amount: data.total_amount.toString(),
      }
    });
  },

  async findAll() {
    return dbClient.invoice.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string) {
    return dbClient.invoice.findUnique({ 
      where: { id } 
    });
  },


  async delete(id: string) {
    return dbClient.invoice.delete({
      where: { id }
    });
  },
};
