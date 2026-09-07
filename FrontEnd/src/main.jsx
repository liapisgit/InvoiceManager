import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import "./index.css";
import "./i18n";
import theme from "./theme";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MyInvoicesPage from "./pages/MyInvoicesPage";
import InvoiceFormPage from "./pages/InvoiceFormPage";
import ProjectTotalsDashboardPage from "./pages/ProjectTotalsDashboardPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdminRoute from "./components/auth/AdminRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import DuplicateInvoiceNotifier from "./components/DuplicateInvoiceNotifier";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <BrowserRouter>
          <DuplicateInvoiceNotifier />
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-invoices"
              element={
                <ProtectedRoute>
                  <MyInvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/new"
              element={
                <ProtectedRoute>
                  <InvoiceFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:invoiceId/edit"
              element={
                <ProtectedRoute>
                  <InvoiceFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/project-totals"
              element={
                <ProtectedRoute>
                  <ProjectTotalsDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminSettingsPage />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>,
);
