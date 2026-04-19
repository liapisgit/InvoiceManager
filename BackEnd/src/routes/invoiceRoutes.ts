import { Router } from "express";
import axios from "axios";
import { validate } from "../middlewares/validationMiddleware";
import { createInvoiceSchema } from "../schemas/invoiceSchemas";
import { invoiceRepository } from "../repositories/invoiceRepository";
import { config } from "../config/env";

const invoiceRouter = Router();

// Create a new invoice
invoiceRouter.post("/", validate(createInvoiceSchema), async (req, res) => {
  try {
    const invoice = await invoiceRepository.create({
      ...req.body,
      createdBy: req.user!.user_id,
    });

    const dataWebhookUrl = config.n8nInvoiceDataWebhookUrl?.trim();
    if (dataWebhookUrl) {
      const userLabel =
        `${req.user!.first_name ?? ""} ${req.user!.last_name ?? ""}`.trim() ||
        req.user!.user_name;
      try {
        await axios.post(
          dataWebhookUrl,
          { ...req.body, user: userLabel },
          { headers: { "Content-Type": "application/json" } },
        );
      } catch (n8nErr) {
        console.error("n8n invoice-data webhook failed:", n8nErr);
      }
    }

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
