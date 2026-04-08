import { useCallback, useMemo, useState } from "react";
import {
  Container,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { apiClient } from "../services/apiClient";

import InvoiceForm from "../components/Forms/InvoiceForm";
import { createInvoiceSchema } from "../schemas/invoiceSchemas";
import { clearToken } from "../services/auth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { getUserFullNameFromToken } from "../services/auth";

export default function HomePage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([{}]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [busyFormIndexes, setBusyFormIndexes] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, i18n } = useTranslation();
  const isUiLocked = busyFormIndexes.size > 0 || isSubmitting;
  const user = getUserFullNameFromToken();

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const handleAddNew = () => setForms((prev) => [...prev, {}]);

  const handleFormChange = useCallback((index, formData) => {
    setForms((prev) => {
      const next = [...prev];
      next[index] = formData;
      return next;
    });
  }, []);

  const handleRemoveForm = useCallback((index) => {
    setForms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAnalysisStateChange = useCallback((formIndex, isBusy) => {
    setBusyFormIndexes((prev) => {
      const next = new Set(prev);
      if (isBusy) next.add(formIndex);
      else next.delete(formIndex);
      return next;
    });
  }, []);

  const allValid = useMemo(() => {
    if (!forms.length) return false;
    return forms.every((f) => f?.isValid === true);
  }, [forms]);

  const handleComplete = async () => {
    if (isUiLocked) return;
    setSubmitAttempted(true);
    if (!allValid) return;

    setIsSubmitting(true);
    try {
      await Promise.all(
        forms.map((form) => {
          const payload = createInvoiceSchema.parse(form);
          console.log("payload", payload);
          return Promise.allSettled([
            apiClient.post(`/api/invoices`, payload),
            axios.post(
              "http://100.104.68.112:5678/webhook/upload-invoice-data",
              { ...payload, user: user },
              { headers: { "Content-Type": "application/json" } },
            ),
          ]);
        }),
      );

      setShowSuccess(true);
      setForms([{}]);
      setSubmitAttempted(false);
      setErrorMessage("");
      setShowError(false);
      setResetVersion((v) => v + 1);
    } catch (error) {
      const fallback = t("app.error");
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || fallback
        : fallback;
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseError = () => setShowError(false);
  const handleCloseSuccess = () => setShowSuccess(false);

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    window.localStorage.setItem("lang", language);
  };

  return (
    <>
      {/* header */}
      <Box
        sx={{
          height: 56,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#51af8b",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
          Invoice Manager
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <ToggleButtonGroup
            size="small"
            value={i18n.language}
            exclusive
            onChange={(_, value) => value && handleLanguageChange(value)}
            disabled={isUiLocked}
          >
            <ToggleButton value="el">EL</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            onClick={handleLogout}
            disabled={isUiLocked}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* rest of your current App UI unchanged */}
      <Container maxWidth="md" className="app-root">
        <Paper elevation={0} className="forms-group">
          <Box className="forms-group__header">
            <Typography variant="subtitle1">{t("app.invoices")}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("app.entries", { count: forms.length })}
            </Typography>
          </Box>

          <Box className="forms-group__list">
            {forms.map((_, index) => (
              <InvoiceForm
                key={`${resetVersion}-${index}`}
                formIndex={index}
                onFormChange={handleFormChange}
                onRemove={handleRemoveForm}
                onAnalysisStateChange={handleAnalysisStateChange}
                canRemove={forms.length > 1}
                submitAttempted={submitAttempted}
              />
            ))}
          </Box>

          <Box className="forms-group__footer">
            <Button
              variant="outlined"
              onClick={handleAddNew}
              disabled={isUiLocked}
              startIcon={<AddIcon />}
            >
              {t("app.addInvoice")}
            </Button>
          </Box>
        </Paper>

        <Box className="app-actions">
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={!allValid || isUiLocked}
          >
            {t("app.completeReview")}
          </Button>
        </Box>

        <Backdrop
          open={isUiLocked}
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 10 }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        <Snackbar
          open={showSuccess}
          autoHideDuration={6000}
          onClose={handleCloseSuccess}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSuccess}
            severity="success"
            sx={{ width: "100%" }}
          >
            {t("app.success")}
          </Alert>
        </Snackbar>

        <Snackbar
          open={showError}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseError}
            severity="error"
            sx={{ width: "100%" }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
