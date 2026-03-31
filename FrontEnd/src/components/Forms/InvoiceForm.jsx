import { useEffect, useMemo, useState } from "react";
import { Paper, Box, Typography, IconButton } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import TextField from "../Inputs/TextField";
import Checkbox from "../Inputs/Checkbox";
import DatePicker from "../Inputs/DatePicker";
import FileUploadSingleImage from "../Inputs/FileUploadSingleImage";
import ReceiptIcon from "@mui/icons-material/Receipt";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { analyzeInvoiceImage } from "../../services/invoiceAnalysis";
import { useTranslation } from "react-i18next";

const initialForm = {
  document_type: "",
  recipient_code: "",
  mark: "",
  series: "",
  number: "",
  issuer_vat_number: "",
  issuer_name: "",
  recipient_vat_number: "",
  recipient_name: "",
  payment_method: "",
  value_before_discount: "",
  discount_amount: "",
  net_amount: "",
  vat_amount: "",
  withholding_amount: "",
  fees_or_stamps: "",
  total_amount: "",
  issuer_iban: "",
  is_paid: false,
  comments: "",
  file: null, // ✅ single image
  project: "",
  company: "",
  users: "",
  invoice_date: "",
};

// Fill these with your static options.
const PROJECT_OPTIONS = [
  "KIRKIS",
  "ALAMANAS",
  "ARMONIAS-RIVIERA PEARL",
  "AIOLOU",
  "APOLLONOS",
  "HERITAGE OT11",
  "HERITAGE OT23",
  "HERITAGE OT29",
  "HERITAGE OT36",
  "IOUSTINIANOU",
  "LAGONISI",
  "FALIROU2",
  "PORT OF KORINTHOS",
  "PALLINI",
  "CHLOIS 29 VOULA",
  "ERMA , LEOF ATHINWN 122 ATHENS",
  "LAZARAKI 57",
  "JULIA & CHRISTIAN KARAM_AFRODITIS",
  "REAL ESTATE",
  "HOSPITALITY",
];
const COMPANY_OPTIONS = [
  "THE OLON DEVELOPMENTS ΜΟΝΟΠΡΟΣΩΠΗ IKE",
  "HERITAGE VENTURES IKE",
  "ALAMANAS ONE ΙΚΕ",
  "A15 Hotel Ventures ΜΟΝ IKE",
  "Ο ΛΥΡΑΣ ΞΕΝΟΔΟΧΕΙΑ & ΕΜΠΟΡΙΚΑΙ ΕΠΙΧΕΙΡΗΣΕΙΣ ΜΟΝ/ΠΗ ΑΕ",
  "AIOLOU HAB MON IKE",
  "LAGONISI VENTURES IKE",
  "HOT ΜΟΝΟΠΡΟΣΩΠΗ ΙΚΕ ΤΕΧΝΙΚΗ ΕΤΑΙΡΙΑ & ΕΚΜ/ΣΗ ΑΚΙΝΗΤΩΝ",
  "THE OLON HOSPITALITY ΙΚΕ",
];
const USER_OPTIONS = [
  "Δαλιάνη Αικατερίνη",
  "Αρχοντάκης Παπαδάκης Ιωάννης",
  "Νικολάτου Κωνσταντίνα",
  "Στάθης Σπυρίδων",
  "Γιώργος Μπερσεντές",
  "Κόκκαλης Χαράλαμπος",
  "Abuyousef Kamel",
  "Mamiseishvili Lasha",
  "Χαραλαμποπούλου Φωτεινή",
  "Τσόκα Έλενα",
  "Πάλιος Κωνσταντίνος",
  "Λίμνιαλης Γεωργιος",
  "Χριστίνα Καλομηνίδου",
  "Σπυρος Σιδέρης",
  "Γεώργιος Σωτηρχόπουλος",
];

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
      recipient_code: true,
      document_type: true,
      series: true,
      number: true,
      issuer_vat_number: true,
      issuer_name: true,
      recipient_vat_number: true,
      recipient_name: true,
      payment_method: true,
      value_before_discount: true,
      discount_amount: true,
      net_amount: true,
      vat_amount: true,
      withholding_amount: true,
      fees_or_stamps: true,
      total_amount: true,
      issuer_iban: true,
      is_paid: true,
      comments: true,
      project: true,
      company: true,
      users: true,
      invoice_date: true,
    });

  const errors = useMemo(() => {
    const e = {};
    // Required text fields
    if (isEmpty(formData.project)) e.project = t("validation.required");
    if (isEmpty(formData.company)) e.company = t("validation.required");
    if (isEmpty(formData.users)) e.users = t("validation.required");
    // Comments are optional
    if (isEmpty(formData.issuer_name)) e.issuer_name = t("validation.required");
    // Required numeric-ish fields
    if (isEmpty(formData.issuer_vat_number))
      e.issuer_vat_number = t("validation.required");
    else if (!isNumeric(formData.issuer_vat_number))
      e.issuer_vat_number = t("validation.numbersOnly");
    else if (String(formData.issuer_vat_number).trim().length !== 9)
      e.issuer_vat_number = t("validation.afmLength");
    // Date required
    if (isEmpty(formData.invoice_date))
      e.invoice_date = t("validation.required");
    // Checkbox required (since you said all fields required)
    if (formData.is_paid !== true && formData.is_paid !== false)
      e.is_paid = t("validation.checkbox");
    // If you literally mean user must explicitly choose: force true/false is already explicit.
    // If you mean "must be checked", uncomment:
    // if (!formData.is_paid) e.is_paid = "Πρέπει να επιλεγεί.";
    // Total price required + valid money
    if (isEmpty(formData.total_amount))
      e.total_amount = t("validation.required");
    else if (!isMoney(formData.total_amount))
      e.total_amount = t("validation.money");
    // File required
    // if (!formData.file) e.file = t("validation.uploadReceipt");
    return e;
  }, [formData, t]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const hasContent = useMemo(
    () =>
      Boolean(
        formData.file ||
        formData.is_paid ||
        Object.entries(formData).some(([key, value]) => {
          if (key === "file" || key === "is_paid") return false;
          return String(value ?? "").trim().length > 0;
        }),
      ),
    [formData],
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
          <Typography
            variant="caption"
            color="text.secondary"
            className="invoice-card__hint"
          >
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
          label={t("fields.document_type")}
          value={formData.document_type}
          onChange={(e) => setField("document_type", e.target.value)}
          onBlur={() => markTouched("document_type")}
          error={showError("document_type") && !!errors.document_type}
          helperText={showError("document_type") ? errors.document_type : ""}
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
          label={t("fields.issuer_vat_number")}
          value={formData.issuer_vat_number}
          onChange={(e) => setField("issuer_vat_number", e.target.value)}
          onBlur={() => markTouched("issuer_vat_number")}
          error={showError("issuer_vat_number") && !!errors.issuer_vat_number}
          helperText={
            showError("issuer_vat_number") ? errors.issuer_vat_number : ""
          }
          inputMode="numeric"
          size="small"
        />
        <TextField
          label={t("fields.issuer_name")}
          value={formData.issuer_name}
          onChange={(e) => setField("issuer_name", e.target.value)}
          onBlur={() => markTouched("issuer_name")}
          error={showError("issuer_name") && !!errors.issuer_name}
          helperText={showError("issuer_name") ? errors.issuer_name : ""}
          size="small"
        />
        <TextField
          label={t("fields.recipient_vat_number")}
          value={formData.recipient_vat_number}
          onChange={(e) => setField("recipient_vat_number", e.target.value)}
          onBlur={() => markTouched("recipient_vat_number")}
          error={
            showError("recipient_vat_number") && !!errors.recipient_vat_number
          }
          helperText={
            showError("recipient_vat_number") ? errors.recipient_vat_number : ""
          }
          size="small"
        />
        <TextField
          label={t("fields.recipient_name")}
          value={formData.recipient_name}
          onChange={(e) => setField("recipient_name", e.target.value)}
          onBlur={() => markTouched("recipient_name")}
          error={showError("recipient_name") && !!errors.recipient_name}
          helperText={showError("recipient_name") ? errors.recipient_name : ""}
          size="small"
        />
        <TextField
          label={t("fields.recipient_code")}
          value={formData.recipient_code}
          onChange={(e) => setField("recipient_code", e.target.value)}
          onBlur={() => markTouched("recipient_code")}
          error={showError("recipient_code") && !!errors.recipient_code}
          helperText={showError("recipient_code") ? errors.recipient_code : ""}
          size="small"
        />
        <TextField
          label={t("fields.project")}
          value={formData.project}
          onChange={(e) => setField("project", e.target.value)}
          onBlur={() => markTouched("project")}
          error={showError("project") && !!errors.project}
          helperText={showError("project") ? errors.project : ""}
          select
          size="small"
        >
          <MenuItem value="">
            <em>-</em>
          </MenuItem>
          {PROJECT_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t("fields.payment_method")}
          value={formData.payment_method}
          onChange={(e) => setField("payment_method", e.target.value)}
          onBlur={() => markTouched("payment_method")}
          error={showError("payment_method") && !!errors.payment_method}
          helperText={showError("payment_method") ? errors.payment_method : ""}
          size="small"
        />
        <TextField
          label={t("fields.value_before_discount")}
          value={formData.value_before_discount}
          onChange={(e) => setField("value_before_discount", e.target.value)}
          onBlur={() => markTouched("value_before_discount")}
          error={
            showError("value_before_discount") && !!errors.value_before_discount
          }
          helperText={
            showError("value_before_discount")
              ? errors.value_before_discount
              : ""
          }
          inputMode="decimal"
          size="small"
        />
        <TextField
          label={t("fields.discount_amount")}
          value={formData.discount_amount}
          onChange={(e) => setField("discount_amount", e.target.value)}
          onBlur={() => markTouched("discount_amount")}
          error={showError("discount_amount") && !!errors.discount_amount}
          helperText={
            showError("discount_amount") ? errors.discount_amount : ""
          }
          inputMode="decimal"
          size="small"
        />
        <TextField
          label={t("fields.net_amount")}
          value={formData.net_amount}
          onChange={(e) => setField("net_amount", e.target.value)}
          onBlur={() => markTouched("net_amount")}
          error={showError("net_amount") && !!errors.net_amount}
          helperText={showError("net_amount") ? errors.net_amount : ""}
          inputMode="decimal"
          size="small"
        />
        <TextField
          label={t("fields.vat_amount")}
          value={formData.vat_amount}
          onChange={(e) => setField("vat_amount", e.target.value)}
          onBlur={() => markTouched("vat_amount")}
          error={showError("vat_amount") && !!errors.vat_amount}
          helperText={showError("vat_amount") ? errors.vat_amount : ""}
          inputMode="decimal"
          size="small"
        />
        <TextField
          label={t("fields.withholding_amount")}
          value={formData.withholding_amount}
          onChange={(e) => setField("withholding_amount", e.target.value)}
          onBlur={() => markTouched("withholding_amount")}
          error={showError("withholding_amount") && !!errors.withholding_amount}
          helperText={
            showError("withholding_amount") ? errors.withholding_amount : ""
          }
          inputMode="decimal"
          size="small"
        />
        <TextField
          label={t("fields.fees_or_stamps")}
          value={formData.fees_or_stamps}
          onChange={(e) => setField("fees_or_stamps", e.target.value)}
          onBlur={() => markTouched("fees_or_stamps")}
          error={showError("fees_or_stamps") && !!errors.fees_or_stamps}
          helperText={showError("fees_or_stamps") ? errors.fees_or_stamps : ""}
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
        <TextField
          label={t("fields.issuer_iban")}
          value={formData.issuer_iban}
          onChange={(e) => setField("issuer_iban", e.target.value)}
          onBlur={() => markTouched("issuer_iban")}
          error={showError("issuer_iban") && !!errors.issuer_iban}
          helperText={showError("issuer_iban") ? errors.issuer_iban : ""}
          size="small"
        />
        <TextField
          label={t("fields.company")}
          value={formData.company}
          onChange={(e) => setField("company", e.target.value)}
          onBlur={() => markTouched("company")}
          error={showError("company") && !!errors.company}
          helperText={showError("company") ? errors.company : ""}
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
          label={t("fields.users")}
          value={formData.users}
          onChange={(e) => setField("users", e.target.value)}
          onBlur={() => markTouched("users")}
          error={showError("users") && !!errors.users}
          helperText={showError("users") ? errors.users : ""}
          select
          size="small"
        >
          <MenuItem value="">
            <em>-</em>
          </MenuItem>
          {USER_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <Box className="invoice-card__row-checkbox">
          <Checkbox
            label={t("fields.is_paid")}
            checked={formData.is_paid}
            onChange={(e) => setField("is_paid", e.target.checked)}
            onBlur={() => markTouched("is_paid")}
            size="small"
          />
          {showError("is_paid") && errors.is_paid ? (
            <Typography variant="caption" color="error">
              {errors.is_paid}
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
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
