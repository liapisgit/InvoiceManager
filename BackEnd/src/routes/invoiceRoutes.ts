import { Router } from "express";
import axios from "axios";
import { validate } from "../middlewares/validationMiddleware";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from "../schemas/invoiceSchemas";
import { invoiceRepository } from "../repositories/invoiceRepository";
import { userRepository } from "../repositories/userRepository";
import { config } from "../config/env";
import type { Invoice } from "../generated/prisma/client";
import type { AuthPayload } from "../types/express";

const invoiceRouter = Router();

const getUserLabel = (user: AuthPayload) =>
  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.user_name;

const getStoredUserLabel = (user: {
  user_name: string;
  first_name: string | null;
  last_name: string | null;
}) => `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.user_name;

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

const SELF_APPROVER_ID = "0";
const getApprovalStatusForApprover = (approverId: string | null | undefined) => {
  if (!hasValue(approverId)) return "";
  return approverId === SELF_APPROVER_ID ? "APPROVED" : "PENDING";
};

const withInvoiceLabels = async (invoiceOrInvoices: Invoice | Invoice[]) => {
  const invoices = Array.isArray(invoiceOrInvoices)
    ? invoiceOrInvoices
    : [invoiceOrInvoices];

  const userIds = [
    ...new Set(
      invoices
        .map((invoice) => invoice.createdBy)
        .filter((createdBy): createdBy is string => Boolean(createdBy)),
    ),
  ];
  const users = userIds.length ? await userRepository.findManyByIds(userIds) : [];
  const userLabels = new Map(
    users.map((user) => [user.id, getStoredUserLabel(user)]),
  );
  const approverPhones = [
    ...new Set(
      invoices
        .map((invoice) => invoice.approver_id)
        .filter(
          (approverId): approverId is string =>
            Boolean(approverId) && approverId !== SELF_APPROVER_ID,
        ),
    ),
  ];
  const approvers = approverPhones.length
    ? await userRepository.findManyByPhones(approverPhones)
    : [];
  const approverLabels = new Map(
    approvers.map((user) => [user.phone, getStoredUserLabel(user)]),
  );

  const enriched = invoices.map((invoice) => {
    const createdByLabel = invoice.createdBy
      ? userLabels.get(invoice.createdBy) || invoice.createdBy
      : "";

    return {
      ...invoice,
      createdByLabel,
      approverLabel:
        invoice.approver_id === SELF_APPROVER_ID
          ? createdByLabel
          : invoice.approver_id
            ? approverLabels.get(invoice.approver_id) || invoice.approver_id
            : "",
    };
  });

  return Array.isArray(invoiceOrInvoices) ? enriched : enriched[0];
};

const buildInvoiceWebhookPayload = (invoice: Invoice) => {
  const { id, createdAt, lastUpdatedAt, ...invoicePayload } = invoice;
  return JSON.parse(JSON.stringify(invoicePayload));
};

const getApproverLabelForWebhook = async (
  invoice: Invoice,
  user: AuthPayload,
) => {
  if (!invoice.approver_id) return "";
  if (invoice.approver_id === SELF_APPROVER_ID) return getUserLabel(user);

  const [approver] = await userRepository.findManyByPhones([invoice.approver_id]);
  return approver ? getStoredUserLabel(approver) : invoice.approver_id;
};

const triggerInvoiceDataWebhook = async (invoice: Invoice, user: AuthPayload) => {
  const dataWebhookUrl = config.n8nInvoiceDataWebhookUrl?.trim();
  if (!dataWebhookUrl) return;

  try {
    const approver = await getApproverLabelForWebhook(invoice, user);

    await axios.post(
      dataWebhookUrl,
      {
        ...buildInvoiceWebhookPayload(invoice),
        user: getUserLabel(user),
        ...(approver ? { approver } : {}),
      },
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (n8nErr) {
    console.error("n8n invoice-data webhook failed:", n8nErr);
  }
};

// Create a new invoice
invoiceRouter.post("/", validate(createInvoiceSchema), async (req, res) => {
  try {
    const invoice = await invoiceRepository.create({
      ...req.body,
      createdBy: req.user!.user_id,
    });

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
    res.json(await withInvoiceLabels(invoices));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Get invoice by mark
invoiceRouter.get("/by-mark/:mark", async (req, res) => {
  try {
    const invoice = await invoiceRepository.findByMark(req.params.mark);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(await withInvoiceLabels(invoice));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Get invoice by file upload id
invoiceRouter.get("/by-file-upload-id/:fileUploadId", async (req, res) => {
  try {
    const invoice = await invoiceRepository.findByFileUploadId(
      req.params.fileUploadId,
    );
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(await withInvoiceLabels(invoice));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Get invoice by ID
invoiceRouter.get("/:id", async (req, res) => {
  try {
    const invoice = await invoiceRepository.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(await withInvoiceLabels(invoice));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Update invoice
invoiceRouter.patch("/:id", validate(updateInvoiceSchema), async (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: "Invoice id is required" });
    }

    const existingInvoice = await invoiceRepository.findById(id);
    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const nextCompany = req.body.company ?? existingInvoice.company;
    const nextProject = req.body.project ?? existingInvoice.project;
    const canEditApprover = !hasValue(existingInvoice.approver_id);
    const {
      approval_status: _ignoredApprovalStatus,
      approver_id: submittedApproverId,
      ...safeBody
    } = req.body;
    const nextPaymentStatus =
      req.body.payment_status ?? existingInvoice.payment_status;
    const nextApproverId =
      canEditApprover && submittedApproverId !== undefined
        ? submittedApproverId
        : existingInvoice.approver_id;
    const nextApprovalStatus =
      canEditApprover && submittedApproverId !== undefined
        ? getApprovalStatusForApprover(nextApproverId)
        : "";

    if (
      !hasValue(nextCompany) ||
      !hasValue(nextProject) ||
      !hasValue(nextPaymentStatus) ||
      !hasValue(nextApproverId)
    ) {
      return res.status(400).json({
        error: "Missing required invoice fields",
        details:
          "Company, project, payment status, and approver are required to update an invoice.",
      });
    }
    const shouldMarkComplete =
      existingInvoice.status === "needs_review" &&
      hasValue(nextCompany) &&
      hasValue(nextProject);

    const invoice = await invoiceRepository.update(id, {
      ...safeBody,
      ...(canEditApprover && submittedApproverId !== undefined
        ? {
            approver_id: submittedApproverId,
            approval_status: nextApprovalStatus,
          }
        : {}),
      ...(shouldMarkComplete ? { status: "complete" } : {}),
      createdBy: req.user!.user_id,
    });
    await triggerInvoiceDataWebhook(invoice, req.user!);
    res.json(await withInvoiceLabels(invoice));
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    res.status(500).json({
      error: "Failed to update invoice",
      details: error?.message || "Unknown error",
    });
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
