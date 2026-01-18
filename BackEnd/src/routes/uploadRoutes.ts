import { Router } from "express";
import { upload } from "../middlewares/uploadMiddleware";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import axios from "axios";

const uploadRouter = Router();

const N8N_WEBHOOK_URL = "https://n8n.3dforge.fun/webhook/upload-invoice-image";

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

    const webhookResponse = await axios.post(N8N_WEBHOOK_URL, formData, {
      headers: formData.getHeaders(),
    });

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
        data: webhookResponse.data,
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
