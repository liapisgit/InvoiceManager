import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import userRouter from "./routes/userRoutes";
import invoiceRouter from "./routes/invoiceRoutes";
import uploadRouter from "./routes/uploadRoutes";
import companyRouter from "./routes/companyRoutes";
import { config } from "./config/env";
import { authMiddleware } from "./middlewares/authMiddleware";

const app = express();
const uploadsDir = path.resolve(process.cwd(), "uploads");
const frontendDistPath = config.frontendDistPath;
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", authMiddleware, express.static(uploadsDir));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/users", userRouter);
app.use("/api/invoices", authMiddleware, invoiceRouter);
app.use("/api/upload", authMiddleware, uploadRouter);
app.use("/api/companies", authMiddleware, companyRouter);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get(/^(?!\/api|\/uploads|\/health).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", (req, res) => {
    res.send("ok");
  });
}

app.listen(config.port, config.host, () => {
  console.log(`Server running on http://${config.host}:${config.port}`);

  if (hasFrontendBuild) {
    console.log(`Serving frontend from ${frontendDistPath}`);
  }
});
