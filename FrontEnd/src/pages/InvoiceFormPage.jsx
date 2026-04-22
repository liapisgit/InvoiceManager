import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  Paper,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import "../App.css";
import InvoiceForm from "../components/Forms/InvoiceForm";
import AppHeader from "../components/layout/AppHeader";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
} from "../schemas/invoiceSchemas";

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const isEditMode = Boolean(invoiceId);
  const [forms, setForms] = useState([{}]);
  const [loadedForms, setLoadedForms] = useState([null]);
  const [formLoadVersions, setFormLoadVersions] = useState([0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [busyFormIndexes, setBusyFormIndexes] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);
  const [isOpeningExistingInvoice, setIsOpeningExistingInvoice] = useState(false);
  const [existingInvoiceDialog, setExistingInvoiceDialog] = useState({
    open: false,
    formIndex: null,
    invoiceId: "",
    duplicateField: "",
    duplicateValue: "",
    message: "",
  });
  const { t } = useTranslation();
  const isUiLocked =
    busyFormIndexes.size > 0 || isSubmitting || isFetchingInvoice;

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const handleAddNew = () => {
    if (isEditMode) return;
    setForms((prev) => [...prev, {}]);
    setLoadedForms((prev) => [...prev, null]);
    setFormLoadVersions((prev) => [...prev, 0]);
  };

  const handleFormChange = useCallback((index, formData) => {
    setForms((prev) => {
      const next = [...prev];
      next[index] = formData;
      return next;
    });
  }, []);

  const handleRemoveForm = useCallback((index) => {
    setForms((prev) => prev.filter((_, i) => i !== index));
    setLoadedForms((prev) => prev.filter((_, i) => i !== index));
    setFormLoadVersions((prev) => prev.filter((_, i) => i !== index));
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
    return forms.every((form) => form?.isValid === true);
  }, [forms]);

  useEffect(() => {
    if (!invoiceId) return;

    let isActive = true;
    setIsFetchingInvoice(true);

    apiClient
      .get(`/api/invoices/${invoiceId}`)
      .then((response) => {
        if (!isActive) return;
        setForms([{}]);
        setLoadedForms([response.data]);
        setFormLoadVersions((prev) => [(prev[0] || 0) + 1]);
        setErrorMessage("");
        setShowError(false);
      })
      .catch((error) => {
        if (!isActive) return;
        const fallback = t("invoiceEdit.fetchError");
        const message = axios.isAxiosError(error)
          ? error.response?.data?.details ||
            error.response?.data?.error ||
            fallback
          : fallback;
        setErrorMessage(message);
        setShowError(true);
      })
      .finally(() => {
        if (isActive) {
          setIsFetchingInvoice(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [invoiceId, t]);

  const handleExistingInvoiceDetected = useCallback(
    ({ formIndex, invoiceId, duplicateField, duplicateValue, message }) => {
      setExistingInvoiceDialog({
        open: true,
        formIndex,
        invoiceId: String(invoiceId ?? ""),
        duplicateField: String(duplicateField ?? ""),
        duplicateValue: String(duplicateValue ?? ""),
        message: message || t("existingInvoice.defaultMessage"),
      });
    },
    [t],
  );

  const handleCloseExistingInvoiceDialog = useCallback(() => {
    if (isOpeningExistingInvoice) return;

    setExistingInvoiceDialog({
      open: false,
      formIndex: null,
      invoiceId: "",
      duplicateField: "",
      duplicateValue: "",
      message: "",
    });
  }, [isOpeningExistingInvoice]);

  const handleOpenExistingInvoice = useCallback(async () => {
    if (
      existingInvoiceDialog.formIndex == null ||
      isOpeningExistingInvoice
    ) {
      return;
    }

    setIsOpeningExistingInvoice(true);
    try {
      let response;
      if (existingInvoiceDialog.invoiceId) {
        response = await apiClient.get(
          `/api/invoices/${encodeURIComponent(existingInvoiceDialog.invoiceId)}`,
        );
      } else if (
        existingInvoiceDialog.duplicateField === "file_upload_id" &&
        existingInvoiceDialog.duplicateValue
      ) {
        response = await apiClient.get(
          `/api/invoices/by-file-upload-id/${encodeURIComponent(existingInvoiceDialog.duplicateValue)}`,
        );
      } else if (
        existingInvoiceDialog.duplicateField === "mark" &&
        existingInvoiceDialog.duplicateValue
      ) {
        response = await apiClient.get(
          `/api/invoices/by-mark/${encodeURIComponent(existingInvoiceDialog.duplicateValue)}`,
        );
      } else {
        return;
      }

      setLoadedForms((prev) => {
        const next = [...prev];
        next[existingInvoiceDialog.formIndex] = response.data;
        return next;
      });
      setFormLoadVersions((prev) => {
        const next = [...prev];
        next[existingInvoiceDialog.formIndex] =
          (next[existingInvoiceDialog.formIndex] || 0) + 1;
        return next;
      });

      setExistingInvoiceDialog({
        open: false,
        formIndex: null,
        invoiceId: "",
        duplicateField: "",
        duplicateValue: "",
        message: "",
      });
    } catch (error) {
      const fallback = t("existingInvoice.fetchError");
      const message = axios.isAxiosError(error)
        ? error.response?.data?.details ||
          error.response?.data?.error ||
          fallback
        : fallback;
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setIsOpeningExistingInvoice(false);
    }
  }, [existingInvoiceDialog, isOpeningExistingInvoice, t]);

  const existingInvoiceIdentifierLabel = useMemo(() => {
    if (existingInvoiceDialog.duplicateField === "file_upload_id") {
      return t("existingInvoice.fileUploadIdLabel");
    }
    return t("existingInvoice.markLabel");
  }, [existingInvoiceDialog.duplicateField, t]);

  const handleComplete = async () => {
    if (isUiLocked) return;
    setSubmitAttempted(true);
    if (!allValid) return;

    setIsSubmitting(true);
    try {
      const responses = await Promise.all(
        forms.map((form) => {
          if (form?.id) {
            const payload = updateInvoiceSchema.parse(form);
            return apiClient.patch(`/api/invoices/${form.id}`, payload);
          }

          const payload = createInvoiceSchema.parse(form);
          return apiClient.post(`/api/invoices`, payload);
        }),
      );

      setShowSuccess(true);
      setSubmitAttempted(false);
      setErrorMessage("");
      setShowError(false);

      if (isEditMode) {
        setLoadedForms(responses.map((response) => response.data));
        setFormLoadVersions((prev) =>
          prev.map((version, index) => version + (responses[index] ? 1 : 0)),
        );
      } else {
        setForms([{}]);
        setLoadedForms([null]);
        setFormLoadVersions([0]);
        setResetVersion((version) => version + 1);
      }
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

  return (
    <>
      <AppHeader
        disabled={isUiLocked}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              disabled={isUiLocked}
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
              onClick={handleLogout}
              disabled={isUiLocked}
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

      <Container maxWidth="md" className="app-root">
        <Paper elevation={0} className="forms-group">
          <Box className="forms-group__header">
            <Typography variant="subtitle1">
              {isEditMode ? t("invoiceEdit.title") : t("app.invoices")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEditMode
                ? t("invoiceEdit.subtitle")
                : t("app.entries", { count: forms.length })}
            </Typography>
          </Box>

          <Box className="forms-group__list">
            {forms.map((_, index) => (
              <InvoiceForm
                key={`${resetVersion}-${formLoadVersions[index] ?? 0}-${index}`}
                formIndex={index}
                onFormChange={handleFormChange}
                onRemove={handleRemoveForm}
                onAnalysisStateChange={handleAnalysisStateChange}
                onExistingInvoiceDetected={handleExistingInvoiceDetected}
                canRemove={forms.length > 1}
                submitAttempted={submitAttempted}
                externalData={loadedForms[index]}
              />
            ))}
          </Box>

          {!isEditMode ? (
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
          ) : null}
        </Paper>

        <Box className="app-actions">
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={!allValid || isUiLocked}
          >
            {isEditMode ? t("invoiceEdit.submit") : t("app.completeReview")}
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
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            {t("app.success")}
          </Alert>
        </Snackbar>

        <Snackbar
          open={showError}
          autoHideDuration={6000}
          onClose={() => setShowError(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setShowError(false)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>

        <Dialog
          open={existingInvoiceDialog.open}
          onClose={handleCloseExistingInvoiceDialog}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>{t("existingInvoice.title")}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {existingInvoiceDialog.message || t("existingInvoice.defaultMessage")}
            </DialogContentText>
            <DialogContentText sx={{ mt: 1 }}>
              {t("existingInvoice.prompt", {
                identifierLabel: existingInvoiceIdentifierLabel,
                identifierValue: existingInvoiceDialog.duplicateValue,
              })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseExistingInvoiceDialog}
              disabled={isOpeningExistingInvoice}
            >
              {t("existingInvoice.cancel")}
            </Button>
            <Button
              onClick={handleOpenExistingInvoice}
              variant="contained"
              disabled={isOpeningExistingInvoice}
            >
              {t("existingInvoice.confirm")}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
