import { useCallback, useEffect, useState } from "react";
import { Alert, AlertTitle, Snackbar } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { apiClient } from "../services/apiClient";
import { getTokenPayload } from "../services/auth";
import {
  DUPLICATE_TRACKING_UPDATED_EVENT,
  readDuplicateNotificationEntries,
  writeDuplicateNotificationEntries,
} from "../services/duplicateNotifications";

const POLL_INTERVAL_MS = 5000;

export default function DuplicateInvoiceNotifier() {
  useLocation();
  const { t } = useTranslation();
  const userId = getTokenPayload()?.user_id || "";
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let isActive = true;

    const pollPendingInvoices = async () => {
      const pending = readDuplicateNotificationEntries(userId, "pending");
      const storedNotifications = readDuplicateNotificationEntries(
        userId,
        "notifications",
      );

      if (!pending.length) {
        if (isActive) setNotifications(storedNotifications);
        return;
      }

      const results = await Promise.all(
        pending.map(async (entry) => {
          try {
            const response = await apiClient.get(
              `/api/invoices/${encodeURIComponent(entry.id)}`,
            );
            return { entry, invoice: response.data };
          } catch (error) {
            return { entry, statusCode: error.response?.status };
          }
        }),
      );

      const nextPending = [];
      const nextNotifications = [...storedNotifications];

      results.forEach(({ entry, invoice, statusCode }) => {
        if (invoice?.status === "duplicate") {
          if (!nextNotifications.some((notice) => notice.id === entry.id)) {
            nextNotifications.push({
              id: entry.id,
              displayName: String(
                invoice.display_name || entry.displayName || "",
              ),
              type: "duplicate",
            });
          }
          return;
        }

        if (invoice?.status === "error") {
          if (!nextNotifications.some((notice) => notice.id === entry.id)) {
            nextNotifications.push({
              id: entry.id,
              displayName: String(
                entry.displayName || invoice.display_name || "",
              ),
              type: "error",
            });
          }
          return;
        }

        if (invoice && invoice.status !== "processing") return;
        if (statusCode === 404) return;

        nextPending.push(entry);
      });

      writeDuplicateNotificationEntries(userId, "pending", nextPending);
      writeDuplicateNotificationEntries(
        userId,
        "notifications",
        nextNotifications,
      );
      if (isActive) setNotifications(nextNotifications);
    };

    void pollPendingInvoices();
    const intervalId = window.setInterval(
      pollPendingInvoices,
      POLL_INTERVAL_MS,
    );
    const handleTrackingUpdate = () => void pollPendingInvoices();
    window.addEventListener(
      DUPLICATE_TRACKING_UPDATED_EVENT,
      handleTrackingUpdate,
    );

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener(
        DUPLICATE_TRACKING_UPDATED_EVENT,
        handleTrackingUpdate,
      );
    };
  }, [userId]);

  const handleClose = useCallback(() => {
    if (!userId || !notifications.length) return;

    const [, ...remaining] = notifications;
    writeDuplicateNotificationEntries(userId, "notifications", remaining);
    setNotifications(remaining);
  }, [notifications, userId]);

  const currentNotification = userId ? notifications[0] : undefined;
  const isErrorNotification = currentNotification?.type === "error";

  return (
    <Snackbar
      open={Boolean(currentNotification)}
      onClose={(_, reason) => {
        if (reason !== "clickaway") handleClose();
      }}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        severity={isErrorNotification ? "error" : "warning"}
        variant="filled"
        onClose={handleClose}
        sx={{ width: "100%" }}
      >
        {isErrorNotification ? (
          <>
            <AlertTitle>{t("errorNotification.title")}</AlertTitle>
            {currentNotification?.displayName
              ? t("errorNotification.messageWithName", {
                  name: currentNotification.displayName,
                })
              : t("errorNotification.message")}
          </>
        ) : (
          <>
            <AlertTitle>{t("duplicateNotification.title")}</AlertTitle>
            {currentNotification?.displayName
              ? t("duplicateNotification.messageWithName", {
                  name: currentNotification.displayName,
                })
              : t("duplicateNotification.message")}
          </>
        )}
      </Alert>
    </Snackbar>
  );
}
