import { Router } from "express";
import { upload } from "../middlewares/uploadMiddleware";

const uploadRouter = Router();

// Upload single image
uploadRouter.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    res.status(201).json({
      message: "Image uploaded successfully",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
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
