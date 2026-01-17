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

  const handleRemoveForm = useCallback((index) => {
    setForms((prev) => prev.filter((_, i) => i !== index));
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
    <>
      <Box
        sx={{
          height: 56,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#fff",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary", letterSpacing: 0 }}>
          Invoice Manager
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={i18n.language}
          exclusive
          onChange={(_, value) => value && handleLanguageChange(value)}
          sx={{
            "& .MuiToggleButton-root": {
              fontSize: 13,
              color: "text.secondary",
              minWidth: 34,
              px: 1,
              py: 0.25,
            },
            "& .MuiToggleButtonGroup-grouped": {
              borderColor: "divider",
            },
          }}
        >
          <ToggleButton value="el">EL</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 600, color: "text.primary", lineHeight: 1.2 }}>
          Invoices
        </Typography>
        <Typography sx={{ fontSize: 14, color: "text.secondary", mt: 0.5 }}>
          Upload and review invoices
        </Typography>
      </Box>

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
              key={index}
              formIndex={index}
              onFormChange={handleFormChange}
              onRemove={handleRemoveForm}
              canRemove={forms.length > 1}
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
    </>
  );
}

export default App;
