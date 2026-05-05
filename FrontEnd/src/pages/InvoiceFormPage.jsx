import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptIcon from "@mui/icons-material/Receipt";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import "../App.css";
import InvoiceForm, {
  COMPANY_OPTIONS,
  COMPANY_PROJECT_OPTIONS,
} from "../components/Forms/InvoiceForm";
import FileUploadSingleImage from "../components/Inputs/FileUploadSingleImage";
import AppHeader from "../components/layout/AppHeader";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";
import { updateInvoiceSchema } from "../schemas/invoiceSchemas";

const initialUploadForm = {
  file: null,
  company: "",
  project: "",
  is_paid: "",
  comments: "",
  approval_status: "",
};

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
  const [uploadForm, setUploadForm] = useState(initialUploadForm);
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
  const uploadProjectOptions = useMemo(
    () => COMPANY_PROJECT_OPTIONS[uploadForm.company] || [],
    [uploadForm.company],
  );
  const isUploadValid = Boolean(
    uploadForm.file && uploadForm.company && uploadForm.project,
  );

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
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
  const canSubmit = isEditMode ? allValid : isUploadValid;

  const setUploadField = (field, value) => {
    setUploadForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "company" ? { project: "" } : {}),
    }));
  };

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
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      if (!isEditMode) {
        const formData = new FormData();
        formData.append("image", uploadForm.file);
        formData.append("company", uploadForm.company);
        formData.append("project", uploadForm.project);
        if (uploadForm.is_paid !== "") {
          formData.append("is_paid", uploadForm.is_paid);
        }
        if (uploadForm.comments.trim()) {
          formData.append("comments", uploadForm.comments.trim());
        }
        if (uploadForm.approval_status) {
          formData.append("approval_status", uploadForm.approval_status);
        }

        await apiClient.post("/api/upload/invoice", formData);
        setUploadForm(initialUploadForm);
        setShowSuccess(true);
        setSubmitAttempted(false);
        setErrorMessage("");
        setShowError(false);
        navigate("/");
        return;
      }

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
              {isEditMode ? t("invoiceEdit.title") : t("upload.title")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEditMode
                ? t("invoiceEdit.subtitle")
                : t("upload.subtitle")}
            </Typography>
          </Box>

          {isEditMode ? (
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
          ) : (
            <Box className="forms-group__list">
              <Paper elevation={0} className="invoice-card">
                <Box className="invoice-card__grid invoice-card__grid--top">
                  <TextField
                    label={t("fields.company")}
                    value={uploadForm.company}
                    onChange={(event) =>
                      setUploadField("company", event.target.value)
                    }
                    error={submitAttempted && !uploadForm.company}
                    helperText={
                      submitAttempted && !uploadForm.company
                        ? t("validation.required")
                        : ""
                    }
                    select
                    size="small"
                  >
                    <MenuItem value="">
                      <em>-</em>
                    </MenuItem>
                    {COMPANY_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={t("fields.project")}
                    value={uploadForm.project}
                    onChange={(event) =>
                      setUploadField("project", event.target.value)
                    }
                    error={submitAttempted && !uploadForm.project}
                    helperText={
                      submitAttempted && !uploadForm.project
                        ? t("validation.required")
                        : ""
                    }
                    select
                    size="small"
                    disabled={!uploadForm.company}
                  >
                    <MenuItem value="">
                      <em>-</em>
                    </MenuItem>
                    {uploadProjectOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={t("fields.approval_status")}
                    value={uploadForm.approval_status}
                    onChange={(event) =>
                      setUploadField("approval_status", event.target.value)
                    }
                    select
                    size="small"
                  >
                    <MenuItem value="">
                      <em>{t("dashboard.pendingApproval")}</em>
                    </MenuItem>
                    <MenuItem value="approved">
                      {t("approvalStatus.approved")}
                    </MenuItem>
                    <MenuItem value="not_approved">
                      {t("approvalStatus.not_approved")}
                    </MenuItem>
                  </TextField>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={uploadForm.is_paid === "true"}
                        onChange={(event) =>
                          setUploadField(
                            "is_paid",
                            event.target.checked ? "true" : "false",
                          )
                        }
                      />
                    }
                    label={t("fields.is_paid")}
                  />
                </Box>
                <Box className="invoice-card__grid">
                  <TextField
                    className="invoice-card__full"
                    label={t("fields.comments")}
                    value={uploadForm.comments}
                    onChange={(event) =>
                      setUploadField("comments", event.target.value)
                    }
                    multiline
                    minRows={3}
                    size="small"
                  />
                  <Box className="invoice-card__file">
                    <FileUploadSingleImage
                      label={t("fields.receipt")}
                      value={uploadForm.file}
                      onChange={(file) => setUploadField("file", file)}
                      icon={ReceiptIcon}
                      helperText={t("file.helperText")}
                    />
                    {submitAttempted && !uploadForm.file ? (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {t("validation.uploadReceipt")}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}
        </Paper>

        <Box className="app-actions">
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={!canSubmit || isUiLocked}
          >
            {isEditMode ? t("invoiceEdit.submit") : t("upload.submit")}
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
