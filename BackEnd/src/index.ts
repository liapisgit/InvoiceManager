import express from "express";
import path from "path";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes";
import invoiceRouter from "./routes/invoiceRoutes";
import uploadRouter from "./routes/uploadRoutes";
dotenv.config();
const app = express();

app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("ok");
});
app.use("/api/users", userRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/upload", uploadRouter); 

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
