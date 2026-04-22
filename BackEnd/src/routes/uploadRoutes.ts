import { Router } from "express";
import { upload } from "../middlewares/uploadMiddleware";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import axios from "axios";
import { config, requireEnv } from "../config/env";
import { invoiceRepository } from "../repositories/invoiceRepository";

const uploadRouter = Router();

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
