import "dotenv/config";
import path from "path";

const parsedPort = Number(process.env.PORT ?? "8080");

if (Number.isNaN(parsedPort)) {
  throw new Error("PORT environment variable must be a number");
}

export const config = {
  host: process.env.HOST || "0.0.0.0",
  port: parsedPort,
  dbConnectionString: process.env.DATABASE_URL ?? "",
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL ?? "",
  /** JSON payload webhook (invoice submit); optional — if unset, forwarding is skipped */
  n8nInvoiceDataWebhookUrl: process.env.N8N_INVOICE_DATA_WEBHOOK_URL ?? "",
  frontendDistPath:
    process.env.FRONTEND_DIST_PATH || path.resolve(process.cwd(), "public"),
};

export const requireEnv = (value: string, envName: string) => {
  if (!value) {
    throw new Error(`${envName} environment variable is required`);
  }

  return value;
};