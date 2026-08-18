import { getTokenPayload } from "./auth";

const STORAGE_PREFIX = "invoice-manager:duplicate-notifications";
export const DUPLICATE_TRACKING_UPDATED_EVENT =
  "invoice-manager:duplicate-tracking-updated";

const getStorageKey = (userId, type) =>
  `${STORAGE_PREFIX}:${userId}:${type}`;

const normalizeEntries = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry) => entry && typeof entry.id === "string" && entry.id)
    .map((entry) => ({
      id: entry.id,
      displayName: String(entry.displayName ?? ""),
      type: entry.type === "error" ? "error" : "duplicate",
    }));
};

export const readDuplicateNotificationEntries = (userId, type) => {
  if (!userId || typeof window === "undefined") return [];

  try {
    return normalizeEntries(
      JSON.parse(window.localStorage.getItem(getStorageKey(userId, type)) || "[]"),
    );
  } catch {
    return [];
  }
};

export const writeDuplicateNotificationEntries = (userId, type, entries) => {
  if (!userId || typeof window === "undefined") return;

  window.localStorage.setItem(
    getStorageKey(userId, type),
    JSON.stringify(normalizeEntries(entries)),
  );
};

export const trackInvoiceForDuplicateNotification = (invoice) => {
  const userId = getTokenPayload()?.user_id;
  const invoiceId = String(invoice?.id ?? "");
  if (!userId || !invoiceId || typeof window === "undefined") return;

  const pending = readDuplicateNotificationEntries(userId, "pending");
  if (!pending.some((entry) => entry.id === invoiceId)) {
    pending.push({
      id: invoiceId,
      displayName: String(invoice?.display_name ?? ""),
    });
    writeDuplicateNotificationEntries(userId, "pending", pending);
  }

  window.dispatchEvent(new Event(DUPLICATE_TRACKING_UPDATED_EVENT));
};
