import { Router } from "express";
import { validate } from "../middlewares/validationMiddleware";
import { createInvoiceSchema, updateInvoiceSchema } from "../schemas/invoiceSchemas";
import { invoiceRepository } from "../repositories/invoiceRepository";

const invoiceRouter = Router();

// Create a new invoice
invoiceRouter.post("/", validate(createInvoiceSchema), async (req, res) => {
  try {
    const invoice = await invoiceRepository.create(req.body);
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ 
      error: "Failed to create invoice",
      details: error?.message || "Unknown error"
    });
  }
});

// Get all invoices
invoiceRouter.get("/", async (req, res) => {
  try {
    const invoices = await invoiceRepository.findAll();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Get invoice by ID
invoiceRouter.get("/:id", async (req, res) => {
  try {
    const invoice = await invoiceRepository.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});


// Delete invoice
invoiceRouter.delete("/:id", async (req, res) => {
  try {
    await invoiceRepository.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default invoiceRouter;
