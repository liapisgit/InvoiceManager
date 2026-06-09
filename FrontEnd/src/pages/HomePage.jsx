import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import InvoiceFilePreview from "../components/InvoiceFilePreview";
import AppHeader from "../components/layout/AppHeader";
import "../App.css";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";

const DISPLAY_FIELDS = [
  "recipient_name",
  "expense_type",
  "total_amount",
  "comments",
];

const getInvoiceMonthKey = (value) => (value ? String(value).slice(0, 7) : "");
const getCurrentMonthFilter = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const isPresent = (value) => {
  if (typeof value === "boolean") return true;
  return String(value ?? "").trim().length > 0;
};

const UNASSIGNED_PROJECT_FILTER = "__UNASSIGNED__";
const PAYMENT_STATUS_LABEL_KEYS = {
  Paid: "paymentState.paid",
  "To be Paid": "paymentState.toBePaid",
  Urgent: "paymentState.urgent",
};

const formatPaymentStatus = (paymentStatus, t) => {
  const labelKey = PAYMENT_STATUS_LABEL_KEYS[paymentStatus];
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
  return String(value);
};

const getInvoiceIdentifier = (invoice, t) => {
  const displayName = String(invoice?.display_name ?? "").trim();
  if (displayName) return displayName;

  const datePart = String(invoice?.invoice_date ?? "").slice(0, 10).trim();
  const issuerPart = String(invoice?.issuer_name ?? "").trim();
  const numberPart = String(invoice?.number ?? "").trim();
  const parts = [datePart, issuerPart, numberPart].filter(Boolean);

  return parts.length ? parts.join("_") : t("dashboard.invoiceFallback");
};

const getStatusChipConfig = (status, t) => {
  const normalizedStatus = status || "complete";
  const label = t(`invoiceStatus.${normalizedStatus}`, {
    defaultValue: normalizedStatus,
  });

  if (normalizedStatus === "processing") {
    return { label, color: "warning", variant: "filled" };
  }
  if (normalizedStatus === "needs_review") {
    return { label, color: "warning", variant: "outlined" };
  }
  if (normalizedStatus === "error") {
    return { label, color: "error", variant: "filled" };
  }
  return { label, color: "success", variant: "outlined" };
};

const getApprovalChipConfig = (approvalStatus, t) => {
  if (approvalStatus === "APPROVED") {
    return {
      label: t("approvalStatus.APPROVED"),
      color: "success",
      variant: "filled",
    };
  }
  if (approvalStatus === "REJECTED") {
    return {
      label: t("approvalStatus.REJECTED"),
      color: "error",
      variant: "outlined",
    };
  }
  if (approvalStatus === "PENDING") {
    return {
      label: t("approvalStatus.PENDING"),
      color: "warning",
      variant: "outlined",
    };
  }

  return {
    label: t("dashboard.pendingApproval"),
    color: "default",
    variant: "outlined",
  };
};

const getApprovalTooltipTitle = (invoice, t) => {
  const isFinalApprovalStatus =
    invoice.approval_status === "APPROVED" ||
    invoice.approval_status === "REJECTED";
  if (!isFinalApprovalStatus) return "";

  const approverLabel = String(
    invoice.approverLabel ||
      (invoice.approver_id === "0" ? invoice.createdByLabel : "") ||
      invoice.approver_id ||
      "",
  ).trim();

  return approverLabel
    ? t("approvalStatus.approverTooltip", { approver: approverLabel })
    : "";
};

const getPaymentChipConfig = (paymentStatus, t) => {
  if (paymentStatus === "Paid") {
    return {
      label: formatPaymentStatus(paymentStatus, t),
      color: "success",
      variant: "filled",
    };
  }
  if (paymentStatus === "Urgent") {
    return {
      label: formatPaymentStatus(paymentStatus, t),
      color: "warning",
      variant: "filled",
    };
  }

  return {
    label: paymentStatus
      ? formatPaymentStatus(paymentStatus, t)
      : t("dashboard.emptyValue"),
    color: "default",
    variant: "outlined",
  };
};

export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState({
    recipient_name: "",
    project: "",
    invoice_date: getCurrentMonthFilter(),
    user: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPreviewInvoice, setSelectedPreviewInvoice] = useState(null);
  const hasLoadedInvoicesRef = useRef(false);

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const loadInvoices = useCallback(async ({ background = false } = {}) => {
    if (background) {
      setErrorMessage("");
    } else if (hasLoadedInvoicesRef.current) {
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
      console.error("Error fetching invoices:", error);
      setErrorMessage(t("dashboard.fetchError"));
    } finally {
      if (!background) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [t]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    const hasProcessingInvoices = invoices.some(
      (invoice) => invoice.status === "processing",
    );
    if (!hasProcessingInvoices) return undefined;

    const intervalId = window.setInterval(() => {
      loadInvoices({ background: true });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [invoices, loadInvoices]);

  const dashboardInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.status !== "duplicate" && invoice.status !== "error",
      ),
    [invoices],
  );

  const filterOptions = useMemo(() => {
    const uniqueValues = (field) =>
      [
        ...new Set(
          dashboardInvoices.map((invoice) => invoice[field]).filter(isPresent),
        ),
      ].sort((first, second) => String(first).localeCompare(String(second)));

    return {
      recipients: uniqueValues("recipient_name"),
      projects: uniqueValues("project"),
      users: [
        ...new Set(
          dashboardInvoices
            .map((invoice) => invoice.createdByLabel || invoice.createdBy)
            .filter(Boolean),
        ),
      ].sort((first, second) => String(first).localeCompare(String(second))),
    };
  }, [dashboardInvoices]);

  const filteredInvoices = useMemo(() => {
    return dashboardInvoices.filter((invoice) => {
      if (
        filters.recipient_name &&
        invoice.recipient_name !== filters.recipient_name
      ) {
        return false;
      }
      if (filters.project === UNASSIGNED_PROJECT_FILTER) {
        if (isPresent(invoice.project)) return false;
      } else if (filters.project && invoice.project !== filters.project) {
        return false;
      }
      if (
        filters.user &&
        (invoice.createdByLabel || invoice.createdBy) !== filters.user
      ) {
        return false;
      }
      if (
        filters.invoice_date &&
        getInvoiceMonthKey(invoice.invoice_date) !== filters.invoice_date
      ) {
        return false;
      }
      return true;
    });
  }, [dashboardInvoices, filters]);

  useEffect(() => {
    if (!selectedPreviewInvoice) return;

    const stillVisible = filteredInvoices.some(
      (invoice) => invoice.id === selectedPreviewInvoice.id,
    );

    if (!stillVisible) {
      setSelectedPreviewInvoice(null);
    }
  }, [filteredInvoices, selectedPreviewInvoice]);

  return (
    <>
      <AppHeader
        disabled={isLoading || isRefreshing}
        actions={
          <>
            <Button
              variant="contained"
              onClick={() => navigate("/invoices/new")}
              startIcon={<AddIcon />}
              disabled={isLoading}
              sx={{
                bgcolor: "#fff",
                color: "#2f8f6e",
                "&:hover": { bgcolor: "#f3fffa" },
              }}
            >
              {t("dashboard.newInvoice")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard/project-totals")}
              startIcon={<AssessmentIcon />}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.45)",
              }}
            >
              {t("projectTotals.navLabel")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => loadInvoices()}
              startIcon={
                isRefreshing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <RefreshIcon />
                )
              }
              disabled={isRefreshing}
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
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6">{t("dashboard.title")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("dashboard.subtitle")}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t("dashboard.results", {
                count: filteredInvoices.length,
                total: dashboardInvoices.length,
              })}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 2,
            }}
          >
            <TextField
              label={t("fields.recipient_name")}
              value={filters.recipient_name}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  recipient_name: event.target.value,
                }))
              }
              select
              size="small"
            >
              <MenuItem value="">{t("dashboard.all")}</MenuItem>
              {filterOptions.recipients.map((recipient) => (
                <MenuItem key={recipient} value={recipient}>
                  {recipient}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("fields.project")}
              value={filters.project}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, project: event.target.value }))
              }
              select
              size="small"
            >
              <MenuItem value="">{t("dashboard.all")}</MenuItem>
              <MenuItem value={UNASSIGNED_PROJECT_FILTER}>
                {t("dashboard.none")}
              </MenuItem>
              {filterOptions.projects.map((project) => (
                <MenuItem key={project} value={project}>
                  {project}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("dashboard.userFilter")}
              value={filters.user}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, user: event.target.value }))
              }
              select
              size="small"
            >
              <MenuItem value="">{t("dashboard.all")}</MenuItem>
              {filterOptions.users.map((user) => (
                <MenuItem key={user} value={user}>
                  {user}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("fields.invoice_date")}
              value={filters.invoice_date}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  invoice_date: event.target.value,
                }))
              }
              type="month"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="text"
              onClick={() =>
                setFilters({
                  recipient_name: "",
                  project: "",
                  invoice_date: "",
                  user: "",
                })
              }
            >
              {t("dashboard.clearFilters")}
            </Button>
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
        ) : filteredInvoices.length === 0 ? (
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
              {t("dashboard.emptyTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dashboardInvoices.length === 0
                ? t("dashboard.emptyDescription")
                : t("dashboard.noMatches")}
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.2fr) 420px" },
              gap: 3,
              alignItems: "start",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredInvoices.map((invoice) => {
                const visibleEntries = DISPLAY_FIELDS.filter((field) =>
                  isPresent(invoice[field]),
                );
                const hasPreview = Boolean(String(invoice.file_url ?? "").trim());
                const isSelectedPreview = selectedPreviewInvoice?.id === invoice.id;
                const invoiceIdentifier = getInvoiceIdentifier(invoice, t);
                const isMissingCostCenter = !isPresent(invoice.project);
                const statusChip = getStatusChipConfig(invoice.status, t);
                const approvalChip = getApprovalChipConfig(
                  invoice.approval_status,
                  t,
                );
                const approvalTooltipTitle = getApprovalTooltipTitle(invoice, t);
                const paymentChip = getPaymentChipConfig(
                  invoice.payment_status,
                  t,
                );

                return (
                  <Paper
                    key={invoice.id}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      backgroundColor: isMissingCostCenter ? "#fee2e2" : "#fff",
                      border: isSelectedPreview
                        ? "1px solid #51af8b"
                        : isMissingCostCenter
                          ? "1px solid #fca5a5"
                        : "1px solid #d1d5db",
                      borderLeft: isMissingCostCenter ? "6px solid #dc2626" : undefined,
                      boxShadow: isSelectedPreview
                        ? "0 0 0 3px rgba(81, 175, 139, 0.12)"
                        : isMissingCostCenter
                          ? "0 8px 24px rgba(220, 38, 38, 0.08)"
                        : "none",
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
                      <Box>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {invoiceIdentifier}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={isMissingCostCenter ? "#b91c1c" : "text.secondary"}
                          sx={{ fontWeight: isMissingCostCenter ? 600 : 400 }}
                        >
                          {`${t("dashboard.costCenter")
                            .toLocaleUpperCase(i18n.language)}: ${formatValue(
                            "project",
                            invoice.project,
                            i18n.language,
                            t,
                          )}`}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={statusChip.label}
                          color={statusChip.color}
                          variant={statusChip.variant}
                        />
                        <Tooltip title={approvalTooltipTitle} arrow>
                          <Chip
                            label={approvalChip.label}
                            color={approvalChip.color}
                            variant={approvalChip.variant}
                          />
                        </Tooltip>
                        <Chip
                          label={`${t("fields.invoice_date")}: ${formatValue(
                            "invoice_date",
                            invoice.invoice_date,
                            i18n.language,
                            t,
                          )}`}
                          variant="outlined"
                        />
                        <Chip
                          label={`${t("fields.payment_status")}: ${formatValue(
                            "payment_status",
                            invoice.payment_status,
                            i18n.language,
                            t,
                          )}`}
                          color={paymentChip.color}
                          variant={paymentChip.variant}
                        />
                        <Button
                          variant={isSelectedPreview ? "contained" : "outlined"}
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() =>
                            setSelectedPreviewInvoice((currentInvoice) =>
                              currentInvoice?.id === invoice.id ? null : invoice,
                            )
                          }
                          disabled={!hasPreview}
                        >
                          {t("dashboard.previewInvoice")}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                        >
                          {t("dashboard.updateInvoice")}
                        </Button>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 1.5,
                      }}
                    >
                      {visibleEntries.map((field) => (
                        <Box
                          key={`${invoice.id}-${field}`}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: isMissingCostCenter ? "#fff" : "#f8fafc",
                            border: isMissingCostCenter
                              ? "1px solid #fecaca"
                              : "1px solid #e5e7eb",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 0.5 }}
                          >
                            {t(`fields.${field}`)}
                          </Typography>
                          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                            {formatValue(field, invoice[field], i18n.language, t)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <InvoiceFilePreview
              fileUrl={selectedPreviewInvoice?.file_url}
              title={t("dashboard.previewTitle")}
              subtitle={
                selectedPreviewInvoice
                  ? getInvoiceIdentifier(selectedPreviewInvoice, t)
                  : ""
              }
              emptyMessage={t("dashboard.previewEmpty")}
              helperMessage={t("dashboard.previewHelper")}
              frameTitle={t("dashboard.previewFrameTitle")}
              unsupportedMessage={t("dashboard.previewUnsupported")}
              openOriginalLabel={t("dashboard.openOriginalFile")}
              altText={
                selectedPreviewInvoice?.recipient_name ||
                t("dashboard.invoiceFallback")
              }
              sx={{
                position: { lg: "sticky" },
                top: { lg: 24 },
                minHeight: 520,
              }}
            />
          </Box>
        )}
      </Container>
    </>
  );
}
