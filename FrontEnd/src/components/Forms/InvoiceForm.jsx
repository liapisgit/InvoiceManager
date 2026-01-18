import { useEffect, useMemo, useState } from "react";
import { Paper, Box, Typography, IconButton } from "@mui/material";
import TextField from "../Inputs/TextField";
import Checkbox from "../Inputs/Checkbox";
import DatePicker from "../Inputs/DatePicker";
import FileUploadSingleImage from "../Inputs/FileUploadSingleImage";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { analyzeInvoiceImage } from "../../services/invoiceAnalysis";
import { useTranslation } from "react-i18next";

const initialForm = {
  afm: "",
  invoice_series: "",
  invoice_number: "",
  mark: "",
  project: "",
  invoice_date: "",
  isPaid: false,
  comments: "",
  vendor_name: "",
  total_amount: "",
  file: null, // ✅ single image
};

const isEmpty = (v) => String(v ?? "").trim().length === 0;
const isNumeric = (v) => /^[0-9]+$/.test(String(v ?? "").trim());
const isMoney = (v) => /^[0-9]+([.,][0-9]{1,2})?$/.test(String(v ?? "").trim());

export default function InvoiceForm({
  formIndex,
  onFormChange,
  onRemove,
  canRemove = true,
  submitAttempted = false,
}) {
  const [formData, setFormData] = useState(initialForm);

  // track touched for nicer UX
  const [touched, setTouched] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const { t } = useTranslation();

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const markAllTouched = () =>
    setTouched({
      afm: true,
      invoice_series: true,
      invoice_number: true,
      mark: true,
      project: true,
      invoice_date: true,
      isPaid: true,
      comments: true,
      vendor_name: true,
      total_amount: true,
      file: true,
    });

  const errors = useMemo(() => {
    const e = {};
    // Required text fields
    if (isEmpty(formData.project)) e.project = t("validation.required");
    // Comments are optional
    if (isEmpty(formData.vendor_name)) e.vendor_name = t("validation.required");
    // Required numeric-ish fields
    if (isEmpty(formData.afm)) e.afm = t("validation.required");
    else if (!isNumeric(formData.afm)) e.afm = t("validation.numbersOnly");
    else if (String(formData.afm).trim().length !== 9) e.afm = t("validation.afmLength");
    if (isEmpty(formData.invoice_series)) e.invoice_series = t("validation.required");
    else if (!isNumeric(formData.invoice_series)) e.invoice_series = t("validation.numbersOnly");
    if (isEmpty(formData.invoice_number)) e.invoice_number = t("validation.required");
    else if (!isNumeric(formData.invoice_number)) e.invoice_number = t("validation.numbersOnly");
    if (isEmpty(formData.mark)) e.mark = t("validation.required");
    else if (!isNumeric(formData.mark)) e.mark = t("validation.numbersOnly");
    // Date required
    if (isEmpty(formData.invoice_date)) e.invoice_date = t("validation.required");
    // Checkbox required (since you said all fields required)
    if (formData.isPaid !== true && formData.isPaid !== false) e.isPaid = t("validation.checkbox");
    // If you literally mean user must explicitly choose: force true/false is already explicit.
    // If you mean "must be checked", uncomment:
    // if (!formData.isPaid) e.isPaid = "Πρέπει να επιλεγεί.";
    // Total price required + valid money
    if (isEmpty(formData.total_amount)) e.total_amount = t("validation.required");
    else if (!isMoney(formData.total_amount)) e.total_amount = t("validation.money");
    // File required
    // if (!formData.file) e.file = t("validation.uploadReceipt");
    return e;
  }, [formData, t]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const hasContent = useMemo(
    () =>
      Boolean(
        formData.file ||
        formData.isPaid ||
        Object.entries(formData).some(([key, value]) => {
          if (key === "file" || key === "isPaid") return false;
          return String(value ?? "").trim().length > 0;
        })
      ),
    [formData]
  );

  // push updates up
  useEffect(() => {
    onFormChange?.(formIndex, { ...formData, isValid, errors });
  }, [formData, formIndex, onFormChange, isValid, errors]);

  useEffect(() => {
    if (!formData.file) {
      setIsAnalyzing(false);
      setAnalysisStatus("");
      return;
    }

    const controller = new AbortController();
    setIsAnalyzing(true);
    setAnalysisStatus("running");

    analyzeInvoiceImage(formData.file, { signal: controller.signal })
      .then((result) => {
        setFormData((prev) => {
          const next = { ...prev };
          Object.entries(result).forEach(([key, value]) => {
            const current = prev[key];
            const isEmptyValue = String(current ?? "").trim().length === 0;
            if (isEmptyValue || current == null) {
              next[key] = value;
            }
          });
          return next;
        });
        setAnalysisStatus("complete");
        markAllTouched();
      })
      .catch((error) => {
        if (error?.name !== "AbortError") {
          setAnalysisStatus("failed");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsAnalyzing(false);
        }
      });
    return () => controller.abort();
  }, [formData.file]);

  const showError = (field) => submitAttempted || touched[field];

  const handleRemove = () => {
    if (!canRemove) return;
    if (hasContent && !window.confirm(t("invoice.removeConfirm"))) return;
    onRemove?.(formIndex);
  };

  return (
    <Paper elevation={0} className="invoice-card">
      <Box className="invoice-card__header">
        <Box>
          <Typography variant="subtitle1" className="invoice-card__title">
            {t("invoice.title", { index: formIndex + 1 })}
          </Typography>
          <Typography variant="caption" color="text.secondary" className="invoice-card__hint">
            {t("invoice.hint")}
          </Typography>
        </Box>
        <IconButton
          size="small"
          className="invoice-card__remove"
          onClick={handleRemove}
          disabled={!canRemove}
          aria-label={t("invoice.remove")}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box className="invoice-card__grid">
        <TextField
          label={t("fields.afm")}
          value={formData.afm}
          onChange={(e) => setField("afm", e.target.value)}
          onBlur={() => markTouched("afm")}
          error={showError("afm") && !!errors.afm}
          helperText={showError("afm") ? errors.afm : ""}
          inputMode="numeric"
          size="small"
        />
        <TextField
          label={t("fields.invoice_series")}
          value={formData.invoice_series}
          onChange={(e) => setField("invoice_series", e.target.value)}
          onBlur={() => markTouched("invoice_series")}
          error={showError("invoice_series") && !!errors.invoice_series}
          helperText={showError("invoice_series") ? errors.invoice_series : ""}
          inputMode="numeric"
          size="small"
        />
        <TextField
          label={t("fields.invoice_number")}
          value={formData.invoice_number}
          onChange={(e) => setField("invoice_number", e.target.value)}
          onBlur={() => markTouched("invoice_number")}
          error={showError("invoice_number") && !!errors.invoice_number}
          helperText={showError("invoice_number") ? errors.invoice_number : ""}
          inputMode="numeric"
          size="small"
        />
        <TextField
          label={t("fields.mark")}
          value={formData.mark}
          onChange={(e) => setField("mark", e.target.value)}
          onBlur={() => markTouched("mark")}
          error={showError("mark") && !!errors.mark}
          helperText={showError("mark") ? errors.mark : ""}
          inputMode="numeric"
          size="small"
        />
        <TextField
          label={t("fields.project")}
          value={formData.project}
          onChange={(e) => setField("project", e.target.value)}
          onBlur={() => markTouched("project")}
          error={showError("project") && !!errors.project}
          helperText={showError("project") ? errors.project : ""}
          size="small"
        />
        <DatePicker
          label={t("fields.invoice_date")}
          value={formData.invoice_date}
          onChange={(value) => setField("invoice_date", value)}
          onBlur={() => markTouched("invoice_date")}
          error={showError("invoice_date") && !!errors.invoice_date}
          helperText={showError("invoice_date") ? errors.invoice_date : ""}
          size="small"
        />
        <TextField
          label={t("fields.vendor_name")}
          value={formData.vendor_name}
          onChange={(e) => setField("vendor_name", e.target.value)}
          onBlur={() => markTouched("vendor_name")}
          error={showError("vendor_name") && !!errors.vendor_name}
          helperText={showError("vendor_name") ? errors.vendor_name : ""}
          size="small"
        />
        <TextField
          label={t("fields.total_amount")}
          value={formData.total_amount}
          onChange={(e) => setField("total_amount", e.target.value)}
          onBlur={() => markTouched("total_amount")}
          error={showError("total_amount") && !!errors.total_amount}
          helperText={showError("total_amount") ? errors.total_amount : ""}
          inputMode="decimal"
          size="small"
        />
        <Box className="invoice-card__row-checkbox">
          <Checkbox
            label={t("fields.isPaid")}
            checked={formData.isPaid}
            onChange={(e) => setField("isPaid", e.target.checked)}
            onBlur={() => markTouched("isPaid")}
            size="small"
          />
          {showError("isPaid") && errors.isPaid ? (
            <Typography variant="caption" color="error">
              {errors.isPaid}
            </Typography>
          ) : null}
        </Box>
        <TextField
          label={t("fields.comments")}
          value={formData.comments}
          onChange={(e) => setField("comments", e.target.value)}
          onBlur={() => markTouched("comments")}
          error={showError("comments") && !!errors.comments}
          helperText={showError("comments") ? errors.comments : ""}
          multiline
          rows={2}
          size="small"
          className="invoice-card__full"
        />
        <Box className="invoice-card__file">
          <FileUploadSingleImage
            label={t("fields.receipt")}
            value={formData.file}
            onChange={(file) => setField("file", file)}
            icon={ReceiptIcon}
            helperText={t("file.helperText")}
            isBusy={isAnalyzing}
          />
          {analysisStatus ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {t(`analysis.${analysisStatus}`)}
            </Typography>
          ) : null}
          {showError("file") && errors.file ? (
            <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
              {errors.file}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}
