import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import "../App.css";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";

const UNASSIGNED_PROJECT_FILTER = "__UNASSIGNED__";

const getInvoiceMonthKey = (value) => (value ? String(value).slice(0, 7) : "");

const isPresent = (value) => {
  if (typeof value === "boolean") return true;
  return String(value ?? "").trim().length > 0;
};

const getProjectKey = (project) =>
  isPresent(project) ? String(project).trim() : UNASSIGNED_PROJECT_FILTER;

const getProjectLabel = (projectKey, t) =>
  projectKey === UNASSIGNED_PROJECT_FILTER ? t("dashboard.none") : projectKey;

const getNumericAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export default function ProjectTotalsDashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState({
    project: "",
    invoice_date: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language === "el" ? "el-GR" : "en-GB", {
        style: "currency",
        currency: "EUR",
      }),
    [i18n.language],
  );

  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === "el" ? "el-GR" : "en-GB", {
        month: "long",
        year: "numeric",
      }),
    [i18n.language],
  );

  const formatMonthLabel = useCallback(
    (monthKey) => {
      if (!monthKey) return t("dashboard.all");

      const date = new Date(`${monthKey}-01T00:00:00`);
      if (Number.isNaN(date.getTime())) return monthKey;

      return monthFormatter.format(date);
    },
    [monthFormatter, t],
  );

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

  const dashboardInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.status !== "duplicate" &&
          invoice.status !== "error" &&
          invoice.status !== "processing",
      ),
    [invoices],
  );

  const filterOptions = useMemo(() => {
    const projects = [
      ...new Set(dashboardInvoices.map((invoice) => getProjectKey(invoice.project))),
    ].sort((first, second) =>
      getProjectLabel(first, t).localeCompare(getProjectLabel(second, t)),
    );

    const months = [
      ...new Set(
        dashboardInvoices
          .map((invoice) => getInvoiceMonthKey(invoice.invoice_date))
          .filter(Boolean),
      ),
    ].sort((first, second) => second.localeCompare(first));

    return { projects, months };
  }, [dashboardInvoices, t]);

  const filteredInvoices = useMemo(() => {
    return dashboardInvoices.filter((invoice) => {
      if (filters.project && getProjectKey(invoice.project) !== filters.project) {
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

  const projectTotals = useMemo(() => {
    const totalsByProject = new Map();

    filteredInvoices.forEach((invoice) => {
      const projectKey = getProjectKey(invoice.project);
      const currentProject = totalsByProject.get(projectKey) ?? {
        projectKey,
        invoiceCount: 0,
        totalAmount: 0,
      };

      currentProject.invoiceCount += 1;
      currentProject.totalAmount += getNumericAmount(invoice.total_amount);
      totalsByProject.set(projectKey, currentProject);
    });

    return [...totalsByProject.values()].sort((first, second) => {
      if (second.totalAmount !== first.totalAmount) {
        return second.totalAmount - first.totalAmount;
      }

      return getProjectLabel(first.projectKey, t).localeCompare(
        getProjectLabel(second.projectKey, t),
      );
    });
  }, [filteredInvoices, t]);

  const totalAmount = useMemo(
    () => projectTotals.reduce((sum, project) => sum + project.totalAmount, 0),
    [projectTotals],
  );

  const maxProjectTotal = Math.max(
    ...projectTotals.map((project) => project.totalAmount),
    0,
  );

  return (
    <>
      <AppHeader
        disabled={isLoading || isRefreshing}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              startIcon={<ArrowBackIcon />}
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.45)",
              }}
            >
              {t("projectTotals.backToInvoices")}
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
              <Typography variant="h6">{t("projectTotals.title")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("projectTotals.subtitle")}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t("projectTotals.results", {
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
                  {getProjectLabel(project, t)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("projectTotals.month")}
              value={filters.invoice_date}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  invoice_date: event.target.value,
                }))
              }
              select
              size="small"
            >
              <MenuItem value="">{t("dashboard.all")}</MenuItem>
              {filterOptions.months.map((month) => (
                <MenuItem key={month} value={month}>
                  {formatMonthLabel(month)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="text"
              onClick={() =>
                setFilters({
                  project: "",
                  invoice_date: "",
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
        ) : projectTotals.length === 0 ? (
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
              {dashboardInvoices.length === 0
                ? t("dashboard.emptyTitle")
                : t("projectTotals.noMatchesTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dashboardInvoices.length === 0
                ? t("dashboard.emptyDescription")
                : t("projectTotals.noMatches")}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 2,
              }}
            >
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: 4, border: "1px solid #d1d5db" }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t("projectTotals.filteredTotal")}
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.5 }}>
                  {moneyFormatter.format(totalAmount)}
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: 4, border: "1px solid #d1d5db" }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t("projectTotals.projectCount")}
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.5 }}>
                  {projectTotals.length}
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: 4, border: "1px solid #d1d5db" }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t("projectTotals.invoiceCount")}
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.5 }}>
                  {filteredInvoices.length}
                </Typography>
              </Paper>
            </Box>

            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 4, border: "1px solid #d1d5db" }}
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
                    {t("projectTotals.byProject")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filters.invoice_date
                      ? t("projectTotals.monthSummary", {
                          month: formatMonthLabel(filters.invoice_date),
                        })
                      : t("projectTotals.allMonthsSummary")}
                  </Typography>
                </Box>
                <Chip
                  label={moneyFormatter.format(totalAmount)}
                  color="primary"
                  variant="filled"
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {projectTotals.map((project) => {
                  const percentage =
                    totalAmount > 0 ? (project.totalAmount / totalAmount) * 100 : 0;
                  const barWidth =
                    maxProjectTotal > 0
                      ? (project.totalAmount / maxProjectTotal) * 100
                      : 0;

                  return (
                    <Box key={project.projectKey}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                          flexWrap: "wrap",
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1">
                            {getProjectLabel(project.projectKey, t)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t("projectTotals.invoiceCountWithValue", {
                              count: project.invoiceCount,
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="subtitle1">
                            {moneyFormatter.format(project.totalAmount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t("projectTotals.percentage", {
                              percentage: percentage.toFixed(1),
                            })}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          height: 10,
                          borderRadius: 999,
                          backgroundColor: "#e5e7eb",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${barWidth}%`,
                            height: "100%",
                            borderRadius: 999,
                            backgroundColor: "#51af8b",
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        )}
      </Container>
    </>
  );
}
