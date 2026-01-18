import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes";
import invoiceRouter from "./routes/invoiceRoutes";
dotenv.config();
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("ok");
});
app.use("/api/users", userRouter);
app.use("/api/invoices", invoiceRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
