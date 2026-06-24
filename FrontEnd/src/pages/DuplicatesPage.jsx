import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";
import "../App.css";

const DETAIL_FIELDS = [
  "invoice_date",
  "issuer_name",
  "recipient_name",
  "number",
  "total_amount",
  "project",
  "payment_status",
  "status",
];

const isPresent = (value) => {
  if (typeof value === "boolean") return true;
  return String(value ?? "").trim().length > 0;
};

const normalizeMark = (mark) => String(mark ?? "").trim();

const normalizeDisplayName = (displayName) => String(displayName ?? "").trim();

const formatPaymentStatus = (paymentStatus, t) => {
  const labelKeys = {
    Paid: "paymentState.paid",
    "To be Paid": "paymentState.toBePaid",
    Urgent: "paymentState.urgent",
  };
  const labelKey = labelKeys[paymentStatus];
  return labelKey ? t(labelKey) : String(paymentStatus).replaceAll("_", " ");
};

const formatValue = (field, value, language, t) => {
  if (value == null || value === "") return t("dashboard.emptyValue");
  if (field === "invoice_date") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(language === "el" ? "el-GR" : "en-GB");
  }
  if (field === "payment_status") {
    return formatPaymentStatus(value, t);
  }
  if (field === "status") {
    return t(`invoiceStatus.${value}`, { defaultValue: value });
  }
  return String(value);
};

const getInvoiceIdentifier = (invoice, t) => {
  const displayName = String(invoice?.display_name ?? "").trim();
  if (displayName) return displayName;

  const parts = [
    String(invoice?.invoice_date ?? "").slice(0, 10),
    invoice?.issuer_name,
    invoice?.number,
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);

  return parts.length ? parts.join(" - ") : t("dashboard.invoiceFallback");
};

const getCreatedTimestamp = (invoice) => {
  const timestamp = new Date(invoice?.createdAt ?? 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const buildDuplicateGroups = (invoices) => {
  const groupsByDuplicateKey = invoices.reduce((groups, invoice) => {
    const mark = normalizeMark(invoice.mark);
    const displayName = normalizeDisplayName(invoice.display_name);
    const duplicateKey = mark || displayName;
    if (!duplicateKey) return groups;

    const duplicateField = mark ? "mark" : "display_name";
    const groupKey = `${duplicateField}:${duplicateKey}`;

    const group = groups.get(groupKey) ?? {
      type: duplicateField,
      value: duplicateKey,
      invoices: [],
    };
    group.invoices.push(invoice);
    groups.set(groupKey, group);
    return groups;
  }, new Map());

  return [...groupsByDuplicateKey.values()]
    .filter((group) => group.invoices.length > 1)
    .map((group) => ({
      ...group,
      key: `${group.type}:${group.value}`,
      invoices: [...group.invoices].sort(
        (first, second) => getCreatedTimestamp(second) - getCreatedTimestamp(first),
      ),
    }))
    .sort(
      (first, second) =>
        first.type.localeCompare(second.type) || first.value.localeCompare(second.value),
    );
};

export default function DuplicatesPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const hasLoadedInvoicesRef = useRef(false);

  const duplicateGroups = useMemo(() => buildDuplicateGroups(invoices), [invoices]);

  const duplicateInvoiceCount = useMemo(
    () => duplicateGroups.reduce((count, group) => count + group.invoices.length, 0),
    [duplicateGroups],
  );

  const loadInvoices = useCallback(async () => {
    if (hasLoadedInvoicesRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await apiClient.get("/api/invoices");
      setInvoices(Array.isArray(response.data) ? response.data : []);
      hasLoadedInvoicesRef.current = true;
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching duplicate invoices:", error);
      setErrorMessage(t("duplicates.fetchError"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/invoices/${deleteTarget.invoice.id}`);
      setInvoices((current) =>
        current.filter((invoice) => invoice.id !== deleteTarget.invoice.id),
      );
      setSuccessMessage(t("duplicates.deleteSuccess"));
      setErrorMessage("");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting duplicate invoice:", error);
      const fallback = t("duplicates.deleteError");
      const message = axios.isAxiosError(error)
        ? error.response?.data?.details || error.response?.data?.error || fallback
        : fallback;
      setErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isLoading || isRefreshing || isDeleting;

  return (
    <>
      <AppHeader
        disabled={isBusy}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              disabled={isBusy}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.45)",
              }}
            >
              {t("dashboard.backToDashboard")}
            </Button>
            <Button
              variant="outlined"
              onClick={loadInvoices}
              disabled={isRefreshing || isDeleting}
              startIcon={
                isRefreshing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <RefreshIcon />
                )
              }
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.45)",
              }}
            >
              {t("dashboard.refresh")}
            </Button>
            <Button
              variant="outlined"
              onClick={handleLogout}
              disabled={isBusy}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.45)",
              }}
            >
              {t("app.logout")}
            </Button>
          </>
        }
      />

      <Container maxWidth="lg" className="app-root">
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: "1px solid #d1d5db",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography variant="h6">{t("duplicates.title")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("duplicates.subtitle")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={t("duplicates.groupCount", {
                  count: duplicateGroups.length,
                })}
                color="warning"
                variant="outlined"
              />
              <Chip
                label={t("duplicates.invoiceCount", {
                  count: duplicateInvoiceCount,
                })}
                color="warning"
              />
            </Box>
          </Box>
        </Paper>

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {isLoading ? (
          <Box
            sx={{
              minHeight: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : duplicateGroups.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: "1px solid #d1d5db",
              textAlign: "center",
            }}
          >
            <Typography variant="h6" gutterBottom>
              {t("duplicates.emptyTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("duplicates.emptyDescription")}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {duplicateGroups.map((group) => (
              <Paper
                key={group.key}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: "1px solid #f59e0b",
                  backgroundColor: "#fffbeb",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6">
                      {group.type === "mark"
                        ? t("duplicates.markTitle", { mark: group.value })
                        : t("duplicates.displayNameTitle", {
                            displayName: group.value,
                          })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.type === "mark"
                        ? t("duplicates.groupHelp")
                        : t("duplicates.displayNameGroupHelp")}
                    </Typography>
                  </Box>
                  <Chip
                    label={t("duplicates.records", {
                      count: group.invoices.length,
                    })}
                    color="warning"
                  />
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {group.invoices.map((invoice, index) => {
                    const visibleFields = DETAIL_FIELDS.filter((field) =>
                      isPresent(invoice[field]),
                    );

                    return (
                      <Paper
                        key={invoice.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: "1px solid #e5e7eb",
                          backgroundColor: "#fff",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 1.5 }}>
                            <Box>
                              <Typography variant="subtitle1">
                                {index + 1}. {getInvoiceIdentifier(invoice, t)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {t("duplicates.createdBy", {
                                  user:
                                    invoice.createdByLabel ||
                                    invoice.createdBy ||
                                    t("dashboard.emptyValue"),
                                })}
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              disabled={isDeleting}
                              onClick={() =>
                                setDeleteTarget({
                                  invoice,
                                  groupType: group.type,
                                  groupValue: group.value,
                                })
                              }
                            >
                              {t("duplicates.deleteRecord")}
                            </Button>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(170px, 1fr))",
                            gap: 1,
                          }}
                        >
                          {visibleFields.map((field) => (
                            <Box
                              key={`${invoice.id}-${field}`}
                              sx={{
                                p: 1.25,
                                borderRadius: 2,
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mb: 0.5 }}
                              >
                                {t(`fields.${field}`)}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ wordBreak: "break-word" }}
                              >
                                {formatValue(field, invoice[field], i18n.language, t)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        <Dialog
          open={Boolean(deleteTarget)}
          onClose={() => {
            if (!isDeleting) setDeleteTarget(null);
          }}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>{t("duplicates.deleteTitle")}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {deleteTarget
                ? deleteTarget.groupType === "mark"
                  ? t("duplicates.deletePrompt", {
                      invoice: getInvoiceIdentifier(deleteTarget.invoice, t),
                      mark: deleteTarget.groupValue,
                    })
                  : t("duplicates.deleteDisplayNamePrompt", {
                      invoice: getInvoiceIdentifier(deleteTarget.invoice, t),
                      displayName: deleteTarget.groupValue,
                    })
                : ""}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              {t("existingInvoice.cancel")}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={isDeleting}
            >
              {t("duplicates.confirmDelete")}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={5000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            onClose={() => setSuccessMessage("")}
            sx={{ width: "100%" }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
