import { Router } from "express";
import { upload } from "../middlewares/uploadMiddleware";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import axios from "axios";
import { config, requireEnv } from "../config/env";
import { invoiceRepository } from "../repositories/invoiceRepository";

const uploadRouter = Router();
const VALID_APPROVAL_STATUSES = new Set(["approved", "not_approved"]);

const parseOptionalBoolean = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
};

const buildExistingInvoiceResponse = ({
  invoiceId,
  duplicateField,
  duplicateValue,
  details,
  mark,
  fileUploadId,
}: {
  invoiceId: string;
  duplicateField: "mark" | "file_upload_id";
  duplicateValue: string;
  details: string;
  mark?: string | null;
  fileUploadId?: string | null;
}) => ({
  error: "Invoice already exists",
  details,
  invoiceId,
  duplicate_field: duplicateField,
  duplicate_value: duplicateValue,
  mark,
  file_upload_id: fileUploadId,
});

// Create an invoice from a user upload and start async n8n parsing.
uploadRouter.post("/invoice", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const company = String(req.body.company ?? "").trim();
    const project = String(req.body.project ?? "").trim();

    if (!company || !project) {
      return res.status(400).json({
        error: "Company and project are required",
      });
    }

    const approvalStatus = String(req.body.approval_status ?? "").trim();
    if (approvalStatus && !VALID_APPROVAL_STATUSES.has(approvalStatus)) {
      return res.status(400).json({
        error: "Invalid approval status",
      });
    }

    const n8nWebhookUrl = requireEnv(config.n8nWebhookUrl, "N8N_WEBHOOK_URL");
    const filePath = path.resolve(req.file.path);
    const relativeFilePath = path.join("uploads", req.file.filename);
    const isPaid = parseOptionalBoolean(req.body.is_paid);
    const comments = String(req.body.comments ?? "").trim();

    const invoice = await invoiceRepository.create({
      company,
      project,
      ...(isPaid === undefined ? {} : { is_paid: isPaid }),
      ...(comments ? { comments } : {}),
      ...(approvalStatus ? { approval_status: approvalStatus } : {}),
      file_path: relativeFilePath,
      status: "processing",
      createdBy: req.user!.user_id,
    });

    const formData = new FormData();
    formData.append("invoice_id", invoice.id);
    formData.append("company", company);
    formData.append("project", project);
    formData.append("file_path", relativeFilePath);
    if (isPaid !== undefined) {
      formData.append("is_paid", String(isPaid));
    }
    if (comments) {
      formData.append("comments", comments);
    }
    if (approvalStatus) {
      formData.append("approval_status", approvalStatus);
    }
    formData.append("invoice_image", fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    void axios
      .post(n8nWebhookUrl, formData, {
        headers: formData.getHeaders(),
      })
      .catch((n8nErr) => {
        console.error("n8n async invoice upload webhook failed:", n8nErr);
      });

    res.status(201).json(invoice);
  } catch (error: any) {
    console.error("Error creating invoice upload:", error);
    res.status(500).json({
      error: "Failed to create invoice upload",
      details: error?.message || "Unknown error",
    });
  }
});

// Upload single image
uploadRouter.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Forward the image to n8n webhook
    const formData = new FormData();
    const filePath = path.resolve(req.file.path);
    formData.append("invoice_image", fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const n8nWebhookUrl = requireEnv(config.n8nWebhookUrl, "N8N_WEBHOOK_URL");
    const webhookResponse = await axios.post(n8nWebhookUrl, formData, {
      headers: formData.getHeaders(),
    });
    const webhookPayload = Array.isArray(webhookResponse.data)
      ? webhookResponse.data[0]
      : webhookResponse.data;
    if (webhookPayload?.error !== undefined) {
      const mark = webhookPayload?.mark ? String(webhookPayload.mark) : "";
      const fileUploadId = webhookPayload?.file_upload_id
        ? String(webhookPayload.file_upload_id)
        : "";
      const existingInvoice = mark
        ? await invoiceRepository.findByMark(mark)
        : null;

      if (existingInvoice) {
        return res.status(409).json(
          buildExistingInvoiceResponse({
            invoiceId: existingInvoice.id,
            duplicateField: "mark",
            duplicateValue: mark,
            details: webhookPayload.error || "Invoice already exists",
            mark: existingInvoice.mark,
            fileUploadId: existingInvoice.file_upload_id,
          }),
        );
      }

      const existingInvoiceByFileUploadId = fileUploadId
        ? await invoiceRepository.findByFileUploadId(fileUploadId)
        : null;

      if (existingInvoiceByFileUploadId) {
        return res.status(409).json(
          buildExistingInvoiceResponse({
            invoiceId: existingInvoiceByFileUploadId.id,
            duplicateField: "file_upload_id",
            duplicateValue: fileUploadId,
            details: webhookPayload.error || "Invoice already exists",
            mark: existingInvoiceByFileUploadId.mark,
            fileUploadId: existingInvoiceByFileUploadId.file_upload_id,
          }),
        );
      }

      return res.status(422).json({
        error: "Failed to upload image",
        details: webhookPayload.error || "Unknown error",
        row_number: webhookPayload.row_number,
        mark,
        file_upload_id: fileUploadId,
      });
    }

    const fileUploadId = webhookPayload?.file_upload_id
      ? String(webhookPayload.file_upload_id)
      : "";
    if (fileUploadId) {
      const existingInvoice =
        await invoiceRepository.findByFileUploadId(fileUploadId);

      if (existingInvoice) {
        return res.status(409).json(
          buildExistingInvoiceResponse({
            invoiceId: existingInvoice.id,
            duplicateField: "file_upload_id",
            duplicateValue: fileUploadId,
            details: "An invoice with this file upload ID already exists.",
            mark: existingInvoice.mark,
            fileUploadId: existingInvoice.file_upload_id,
          }),
        );
      }
    }

    res.status(201).json({
      message: "Image uploaded and forwarded successfully",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      },
      webhook: {
        status: webhookResponse.status,
        data: webhookPayload,
      },
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      error: "Failed to upload image",
      details: error?.message || "Unknown error",
    });
  }
});

// Upload multiple images (up to 10)
uploadRouter.post("/images", upload.array("images", 10), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    res.status(201).json({
      message: `${files.length} image(s) uploaded successfully`,
      files: files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      })),
    });
  } catch (error: any) {
    console.error("Error uploading images:", error);
    res.status(500).json({
      error: "Failed to upload images",
      details: error?.message || "Unknown error",
    });
  }
});

export default uploadRouter;
