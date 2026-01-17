import { useEffect, useMemo, useState } from "react";
import { Paper, Box, Typography } from "@mui/material";
import TextField from "../Inputs/TextField";
import Checkbox from "../Inputs/Checkbox";
import DatePicker from "../Inputs/DatePicker";
import FileUploadSingleImage from "../Inputs/FileUploadSingleImage";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { analyzeInvoiceImage } from "../../services/invoiceAnalysis";
import { useTranslation } from "react-i18next";

const initialForm = {
  afm: "",
  series: "",
  number: "",
  mark: "",
  project: "",
  date: "",
  isPaid: false,
  comments: "",
  vendorName: "",
  totalPrice: "",
  file: null, // ✅ single image
};

const isEmpty = (v) => String(v ?? "").trim().length === 0;
const isNumeric = (v) => /^[0-9]+$/.test(String(v ?? "").trim());
const isMoney = (v) => /^[0-9]+([.,][0-9]{1,2})?$/.test(String(v ?? "").trim());

export default function InvoiceForm({ formIndex, onFormChange, submitAttempted = false }) {
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
      series: true,
      number: true,
      mark: true,
      project: true,
      date: true,
      isPaid: true,
      comments: true,
      vendorName: true,
      totalPrice: true,
      file: true,
    });

  const errors = useMemo(() => {
    const e = {};

    // Required text fields
    if (isEmpty(formData.project)) e.project = t("validation.required");
    if (isEmpty(formData.comments)) e.comments = t("validation.required");
    if (isEmpty(formData.vendorName)) e.vendorName = t("validation.required");

    // Required numeric-ish fields
    if (isEmpty(formData.afm)) e.afm = t("validation.required");
    else if (!isNumeric(formData.afm)) e.afm = t("validation.numbersOnly");
    else if (String(formData.afm).trim().length !== 9) e.afm = t("validation.afmLength");

    if (isEmpty(formData.series)) e.series = t("validation.required");
    else if (!isNumeric(formData.series)) e.series = t("validation.numbersOnly");

    if (isEmpty(formData.number)) e.number = t("validation.required");
    else if (!isNumeric(formData.number)) e.number = t("validation.numbersOnly");

    if (isEmpty(formData.mark)) e.mark = t("validation.required");
    else if (!isNumeric(formData.mark)) e.mark = t("validation.numbersOnly");

    // Date required
    if (isEmpty(formData.date)) e.date = t("validation.required");

    // Checkbox required (since you said all fields required)
    if (formData.isPaid !== true && formData.isPaid !== false) e.isPaid = t("validation.checkbox");
    // If you literally mean user must explicitly choose: force true/false is already explicit.
    // If you mean "must be checked", uncomment:
    // if (!formData.isPaid) e.isPaid = "Πρέπει να επιλεγεί.";

    // Total price required + valid money
    if (isEmpty(formData.totalPrice)) e.totalPrice = t("validation.required");
    else if (!isMoney(formData.totalPrice)) e.totalPrice = t("validation.money");

    // File required
    if (!formData.file) e.file = t("validation.uploadReceipt");

    return e;
  }, [formData, t]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

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

  return (
    <Paper elevation={0} className="invoice-card">
      <Box className="invoice-card__header">
        <Box>
          <Typography variant="subtitle1">
            {t("invoice.title", { index: formIndex + 1 })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("invoice.hint")}
          </Typography>
        </Box>
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
          label={t("fields.series")}
          value={formData.series}
          onChange={(e) => setField("series", e.target.value)}
          onBlur={() => markTouched("series")}
          error={showError("series") && !!errors.series}
          helperText={showError("series") ? errors.series : ""}
          inputMode="numeric"
          size="small"
        />

        <TextField
          label={t("fields.number")}
          value={formData.number}
          onChange={(e) => setField("number", e.target.value)}
          onBlur={() => markTouched("number")}
          error={showError("number") && !!errors.number}
          helperText={showError("number") ? errors.number : ""}
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
          label={t("fields.date")}
          value={formData.date}
          onChange={(e) => setField("date", e.target.value)}
          onBlur={() => markTouched("date")}
          error={showError("date") && !!errors.date}
          helperText={showError("date") ? errors.date : ""}
          size="small"
        />

        <Box className="invoice-card__inline">
          <Checkbox
            label={t("fields.isPaid")}
            checked={formData.isPaid}
            onChange={(e) => setField("isPaid", e.target.checked)}
            onBlur={() => markTouched("isPaid")}
            size="small"
          />
          {/* If you want to show error under checkbox: */}
          {showError("isPaid") && errors.isPaid ? (
            <Typography variant="caption" color="error">
              {errors.isPaid}
            </Typography>
          ) : null}
        </Box>

   

        <TextField
          label={t("fields.vendorName")}
          value={formData.vendorName}
          onChange={(e) => setField("vendorName", e.target.value)}
          onBlur={() => markTouched("vendorName")}
          error={showError("vendorName") && !!errors.vendorName}
          helperText={showError("vendorName") ? errors.vendorName : ""}
          size="small"
        />

        <TextField
          label={t("fields.totalPrice")}
          value={formData.totalPrice}
          onChange={(e) => setField("totalPrice", e.target.value)}
          onBlur={() => markTouched("totalPrice")}
          error={showError("totalPrice") && !!errors.totalPrice}
          helperText={showError("totalPrice") ? errors.totalPrice : ""}
          inputMode="decimal"
          size="small"
        />

             <TextField
          label={t("fields.comments")}
          value={formData.comments}
          onChange={(e) => setField("comments", e.target.value)}
          onBlur={() => markTouched("comments")}
          error={showError("comments") && !!errors.comments}
          helperText={showError("comments") ? errors.comments : ""}
          multiline
          rows={3}
          size="small"
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
            <Typography variant="caption" color="error" sx={{ mt: 0.75 }}>
              {errors.file}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}
