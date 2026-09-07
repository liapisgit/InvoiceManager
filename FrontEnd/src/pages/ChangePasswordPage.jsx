import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import PasswordInput from "../components/PasswordInput";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";
import "../App.css";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    passwordsMatch &&
    !isSaving;

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await apiClient.patch("/api/users/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage(t("password.changeSuccess"));
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || t("password.changeError"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AppHeader
        disabled={isSaving}
        showPasswordAction={false}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              disabled={isSaving}
              startIcon={<ArrowBackIcon />}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
            >
              {t("dashboard.backToDashboard")}
            </Button>
            <Button
              variant="outlined"
              onClick={handleLogout}
              disabled={isSaving}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
            >
              {t("app.logout")}
            </Button>
          </>
        }
      />

      <Container maxWidth="sm" className="app-root">
        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={0}
          sx={{ p: 3, borderRadius: 4, border: "1px solid #d1d5db" }}
        >
          <Typography variant="h6">{t("password.changePassword")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("password.changeDescription")}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <PasswordInput
              label={t("password.currentPassword")}
              value={currentPassword}
              onChange={setCurrentPassword}
              disabled={isSaving}
              required
              autoComplete="current-password"
            />
            <PasswordInput
              label={t("password.newPassword")}
              value={newPassword}
              onChange={setNewPassword}
              onGenerate={setConfirmPassword}
              canGenerate
              disabled={isSaving}
              required
              helperText={t("password.minimumLength")}
            />
            <PasswordInput
              label={t("password.confirmPassword")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={isSaving}
              required
              error={confirmPassword.length > 0 && !passwordsMatch}
              helperText={
                confirmPassword.length > 0 && !passwordsMatch
                  ? t("password.passwordsDoNotMatch")
                  : ""
              }
            />

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {successMessage ? (
              <Alert severity="success">{successMessage}</Alert>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit}
              startIcon={
                isSaving ? (
                  <CircularProgress color="inherit" size={16} />
                ) : null
              }
            >
              {t("password.savePassword")}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
