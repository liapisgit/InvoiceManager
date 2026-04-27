import { useCallback, useEffect, useMemo, useState } from "react";
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
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import "../App.css";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";

const DISPLAY_FIELDS = [
  "document_type",
  "invoice_date",
  "mark",
  "series",
  "number",
  "issuer_vat_number",
  "issuer_name",
  "recipient_vat_number",
  "recipient_name",
  "recipient_code",
  "project",
  "payment_method",
  "value_before_discount",
  "discount_amount",
  "net_amount",
  "vat_amount",
  "withholding_amount",
  "fees_or_stamps",
  "total_amount",
  "issuer_iban",
  "is_paid",
  "comments",
  "company",
  "category",
  "expense_type",
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

const formatValue = (field, value, language, t) => {
  if (value == null || value === "") return t("dashboard.emptyValue");
  if (field === "invoice_date") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(language === "el" ? "el-GR" : "en-GB");
  }
  if (field === "is_paid") {
    return value ? t("common.yes") : t("common.no");
  }
  return String(value);
};

const GOOGLE_DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([^/]+)/i,
  /drive\.google\.com\/open\?id=([^&]+)/i,
  /drive\.google\.com\/uc\?[^#]*id=([^&]+)/i,
  /docs\.google\.com\/uc\?[^#]*id=([^&]+)/i,
];

const getGoogleDriveFileId = (url) => {
  const normalizedUrl = String(url ?? "").trim();
  if (!normalizedUrl) return "";

  for (const pattern of GOOGLE_DRIVE_FILE_ID_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return "";
};

const getPreviewConfig = (fileUrl) => {
  const normalizedUrl = String(fileUrl ?? "").trim();
  if (!normalizedUrl) {
    return { src: "", kind: "empty" };
  }

  const googleDriveFileId = getGoogleDriveFileId(normalizedUrl);
  if (googleDriveFileId) {
    return {
      src: `https://drive.google.com/file/d/${googleDriveFileId}/preview`,
      kind: "iframe",
    };
  }

  const lowerUrl = normalizedUrl.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(lowerUrl)) {
    return { src: normalizedUrl, kind: "image" };
  }
  if (/\.pdf(\?|#|$)/i.test(lowerUrl)) {
    return { src: normalizedUrl, kind: "iframe" };
  }

  return { src: normalizedUrl, kind: "link" };
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

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const loadInvoices = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await apiClient.get("/api/invoices");
      setInvoices(Array.isArray(response.data) ? response.data : []);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setErrorMessage(t("dashboard.fetchError"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filterOptions = useMemo(() => {
    const uniqueValues = (field) =>
      [...new Set(invoices.map((invoice) => invoice[field]).filter(Boolean))].sort(
        (first, second) => String(first).localeCompare(String(second)),
      );

    return {
      recipients: uniqueValues("recipient_name"),
      projects: uniqueValues("project"),
      users: [
        ...new Set(
          invoices
            .map((invoice) => invoice.createdByLabel || invoice.createdBy)
            .filter(Boolean),
        ),
      ].sort((first, second) => String(first).localeCompare(String(second))),
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (
        filters.recipient_name &&
        invoice.recipient_name !== filters.recipient_name
      ) {
        return false;
      }
      if (filters.project && invoice.project !== filters.project) return false;
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
  }, [filters, invoices]);

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
              onClick={() => loadInvoices(true)}
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
                total: invoices.length,
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
              {invoices.length === 0
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

                return (
                  <Paper
                    key={invoice.id}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: isSelectedPreview
                        ? "1px solid #51af8b"
                        : "1px solid #d1d5db",
                      boxShadow: isSelectedPreview
                        ? "0 0 0 3px rgba(81, 175, 139, 0.12)"
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
                          {invoice.issuer_name ||
                            invoice.recipient_name ||
                            t("dashboard.invoiceFallback")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[invoice.company, invoice.project]
                            .filter(Boolean)
                            .join(" • ") || t("dashboard.emptyValue")}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
                          label={`${t("fields.is_paid")}: ${formatValue(
                            "is_paid",
                            invoice.is_paid,
                            i18n.language,
                            t,
                          )}`}
                          color={invoice.is_paid ? "success" : "default"}
                          variant={invoice.is_paid ? "filled" : "outlined"}
                        />
                        <Button
                          variant={isSelectedPreview ? "contained" : "outlined"}
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setSelectedPreviewInvoice(invoice)}
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

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 4,
                border: "1px solid #d1d5db",
                position: { lg: "sticky" },
                top: { lg: 24 },
                minHeight: 520,
              }}
            >
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {t("dashboard.previewTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedPreviewInvoice
                  ? selectedPreviewInvoice.recipient_name ||
                    selectedPreviewInvoice.issuer_name ||
                    t("dashboard.invoiceFallback")
                  : t("dashboard.previewEmpty")}
              </Typography>

              {selectedPreviewInvoice ? (
                (() => {
                  const previewConfig = getPreviewConfig(
                    selectedPreviewInvoice.file_url,
                  );

                  if (previewConfig.kind === "image") {
                    return (
                      <Box
                        component="img"
                        src={previewConfig.src}
                        alt={
                          selectedPreviewInvoice.recipient_name ||
                          t("dashboard.invoiceFallback")
                        }
                        sx={{
                          width: "100%",
                          height: 520,
                          objectFit: "contain",
                          borderRadius: 2,
                          border: "1px solid #e5e7eb",
                          backgroundColor: "#f8fafc",
                        }}
                      />
                    );
                  }

                  if (previewConfig.kind === "iframe") {
                    return (
                      <Box
                        component="iframe"
                        src={previewConfig.src}
                        title={t("dashboard.previewFrameTitle")}
                        sx={{
                          width: "100%",
                          height: 520,
                          border: "1px solid #e5e7eb",
                          borderRadius: 2,
                          backgroundColor: "#fff",
                        }}
                      />
                    );
                  }

                  return (
                    <Box
                      sx={{
                        height: 520,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        gap: 2,
                        px: 3,
                        borderRadius: 2,
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#f8fafc",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t("dashboard.previewUnsupported")}
                      </Typography>
                      <Button
                        variant="contained"
                        component="a"
                        href={selectedPreviewInvoice.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t("dashboard.openOriginalFile")}
                      </Button>
                    </Box>
                  );
                })()
              ) : (
                <Box
                  sx={{
                    height: 520,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 3,
                    borderRadius: 2,
                    border: "1px dashed #cbd5e1",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard.previewHelper")}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Container>
    </>
  );
}
