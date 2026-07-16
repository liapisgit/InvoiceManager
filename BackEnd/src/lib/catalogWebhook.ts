import axios from "axios";
import { config } from "../config/env";
import type { AuthPayload } from "../types/express";

export type CatalogEntity = "user" | "company" | "project";
export type CatalogAction = "created" | "updated" | "deleted";

type TriggerCatalogWebhookParams = {
  entity: CatalogEntity;
  action: CatalogAction;
  data: unknown;
  actor?: AuthPayload | undefined;
};

export const triggerCatalogWebhook = async ({
  entity,
  action,
  data,
  actor,
}: TriggerCatalogWebhookParams) => {
  const webhookUrl = config.n8nCatalogWebhookUrl?.trim();
  if (!webhookUrl) return;

  try {
    await axios.post(
      webhookUrl,
      {
        event: `${entity}.${action}`,
        entity,
        action,
        timestamp: new Date().toISOString(),
        ...(actor
          ? {
              actor: {
                user_id: actor.user_id,
                user_name: actor.user_name,
                first_name: actor.first_name,
                last_name: actor.last_name,
              },
            }
          : {}),
        data,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error(`n8n catalog webhook failed (${entity}.${action}):`, err);
  }
};
