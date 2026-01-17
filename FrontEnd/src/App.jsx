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
} from "@mui/material";
import InvoiceForm from "./components/Forms/InvoiceForm";
import "./App.css";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";

function App() {
  const [forms, setForms] = useState([{}]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { t, i18n } = useTranslation();

  const handleAddNew = () => {
    setForms((prev) => [...prev, {}]);
  };

  const handleFormChange = useCallback((index, formData) => {
    setForms((prev) => {
      const next = [...prev];
      next[index] = formData;
      return next;
    });
  }, []);

  const allValid = useMemo(() => {
    if (!forms.length) return false;
    return forms.every((f) => f?.isValid === true);
  }, [forms]);

  const handleComplete = () => {
    setSubmitAttempted(true);

    if (!allValid) {
      console.log("Validation failed", forms);
      return;
    }

    console.log("All forms data:", forms);
    setShowSuccess(true);
  };

  const handleCloseSuccess = () => setShowSuccess(false);

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", language);
    }
  };

  return (
    <Container maxWidth="md" className="app-root">
      <Box className="app-header">
        <Box>
          <Typography variant="h4" component="h1" className="app-title">
            {t("app.title")}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t("app.subtitle")}
          </Typography>
        </Box>
        <Box className="lang-panel">
          <Typography variant="caption" color="text.secondary">
            {t("app.language")}
          </Typography>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={i18n.language}
            exclusive
            onChange={(_, value) => value && handleLanguageChange(value)}
          >
            <ToggleButton value="el">Ελληνικά</ToggleButton>
            <ToggleButton value="en">English</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

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
              key={index}
              formIndex={index}
              onFormChange={handleFormChange}
              submitAttempted={submitAttempted}
            />
          ))}
        </Box>

        <Box className="forms-group__footer">
          <Button variant="outlined" onClick={handleAddNew} startIcon={<AddIcon />}>
            {t("app.addInvoice")}
          </Button>
        </Box>
      </Paper>

      <Box className="app-actions">
        <Button variant="contained" onClick={handleComplete} disabled={!allValid}>
          {t("app.completeReview")}
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: "100%" }}>
          {t("app.success")}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
