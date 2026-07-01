import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import AppHeader from "../components/layout/AppHeader";
import { apiClient } from "../services/apiClient";
import { clearToken } from "../services/auth";
import { fetchAdminCompanies, PERSONAL_COMPANY } from "../services/catalog";
import "../App.css";

const emptyCompanyForm = {
  company_display_name: "",
  company_name: "",
  vat_number: "",
  is_issuer: false,
  is_self_project: false,
  auto_self_approve: false,
  is_active: true,
};

const emptyProjectForm = {
  company_id: "",
  name: "",
};

const normalizeCompanyPayload = (form) => ({
  company_display_name: form.company_display_name.trim(),
  company_name: form.company_name.trim() || form.company_display_name.trim(),
  vat_number: form.vat_number.trim() || null,
  is_issuer: Boolean(form.is_issuer),
  is_self_project: Boolean(form.is_self_project),
  auto_self_approve: Boolean(form.auto_self_approve),
  is_active: Boolean(form.is_active),
});

const getUserLabel = (user) =>
  `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.user_name;

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [editingCompanyId, setEditingCompanyId] = useState("");
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [editingUsers, setEditingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isBusy = isLoading || isSaving;

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.is_active),
    [companies],
  );

  const selectedProjectCompany = useMemo(
    () => companies.find((company) => company.id === projectForm.company_id),
    [companies, projectForm.company_id],
  );

  const canManageProjects =
    selectedProjectCompany &&
    !selectedProjectCompany.is_self_project &&
    selectedProjectCompany.company_display_name !== PERSONAL_COMPANY;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [companyData, userResponse] = await Promise.all([
        fetchAdminCompanies(),
        apiClient.get("/api/users"),
      ]);
      setCompanies(companyData);
      setUsers(Array.isArray(userResponse.data) ? userResponse.data : []);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      setErrorMessage(t("admin.fetchError", { defaultValue: "Could not load settings." }));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setEditingUsers(
      users.reduce((next, user) => {
        next[user.id] = {
          first_name: user.first_name ?? "",
          last_name: user.last_name ?? "",
          phone: user.phone ?? "",
          approver_number: user.approver_number ?? "",
          is_approver: Boolean(user.is_approver),
        };
        return next;
      }, {}),
    );
  }, [users]);

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const resetCompanyForm = () => {
    setCompanyForm(emptyCompanyForm);
    setEditingCompanyId("");
  };

  const handleEditCompany = (company) => {
    setEditingCompanyId(company.id);
    setCompanyForm({
      company_display_name: company.company_display_name ?? "",
      company_name: company.company_name ?? "",
      vat_number: company.vat_number ?? "",
      is_issuer: Boolean(company.is_issuer),
      is_self_project: Boolean(company.is_self_project),
      auto_self_approve: Boolean(company.auto_self_approve),
      is_active: Boolean(company.is_active),
    });
  };

  const handleSaveCompany = async () => {
    if (!companyForm.company_display_name.trim()) return;
    setIsSaving(true);
    try {
      const payload = normalizeCompanyPayload(companyForm);
      if (editingCompanyId) {
        await apiClient.patch(`/api/companies/${editingCompanyId}`, payload);
      } else {
        await apiClient.post("/api/companies", payload);
      }
      resetCompanyForm();
      await loadData();
    } catch (error) {
      console.error("Error saving company:", error);
      setErrorMessage(t("admin.saveError", { defaultValue: "Could not save changes." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateCompany = async (companyId) => {
    if (!window.confirm(t("admin.confirmRemove", { defaultValue: "Remove this item?" }))) {
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.delete(`/api/companies/${companyId}`);
      await loadData();
    } catch (error) {
      console.error("Error removing company:", error);
      setErrorMessage(t("admin.saveError", { defaultValue: "Could not save changes." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProject = async () => {
    if (!projectForm.company_id || !projectForm.name.trim()) return;
    setIsSaving(true);
    try {
      await apiClient.post("/api/companies/projects", {
        company_id: projectForm.company_id,
        name: projectForm.name.trim(),
      });
      setProjectForm(emptyProjectForm);
      await loadData();
    } catch (error) {
      console.error("Error saving project:", error);
      setErrorMessage(t("admin.saveError", { defaultValue: "Could not save changes." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateProject = async (projectId) => {
    if (!window.confirm(t("admin.confirmRemove", { defaultValue: "Remove this item?" }))) {
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.delete(`/api/companies/projects/${projectId}`);
      await loadData();
    } catch (error) {
      console.error("Error removing project:", error);
      setErrorMessage(t("admin.saveError", { defaultValue: "Could not save changes." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = async (userId) => {
    setIsSaving(true);
    try {
      await apiClient.patch(`/api/users/${userId}`, editingUsers[userId]);
      await loadData();
    } catch (error) {
      console.error("Error saving user:", error);
      setErrorMessage(t("admin.saveError", { defaultValue: "Could not save changes." }));
    } finally {
      setIsSaving(false);
    }
  };

  const setCompanyField = (field, value) => {
    setCompanyForm((current) => ({ ...current, [field]: value }));
  };

  const setUserField = (userId, field, value) => {
    setEditingUsers((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        [field]: value,
      },
    }));
  };

  return (
    <>
      <AppHeader
        disabled={isBusy}
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              disabled={isBusy}
              startIcon={<ArrowBackIcon />}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
            >
              {t("dashboard.backToDashboard")}
            </Button>
            <Button
              variant="outlined"
              onClick={loadData}
              disabled={isBusy}
              startIcon={<RefreshIcon />}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
            >
              {t("dashboard.refresh")}
            </Button>
            <Button
              variant="outlined"
              onClick={handleLogout}
              disabled={isBusy}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
            >
              {t("app.logout")}
            </Button>
          </>
        }
      />

      <Container maxWidth="lg" className="app-root">
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #d1d5db" }}>
          <Typography variant="h6">
            {t("admin.title", { defaultValue: "Settings" })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("admin.subtitle", {
              defaultValue: "Manage companies, cost centers, and approvers.",
            })}
          </Typography>

          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          ) : null}

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t("admin.companies", { defaultValue: "Companies" })}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <TextField
                    label={t("admin.displayName", { defaultValue: "Display name" })}
                    value={companyForm.company_display_name}
                    onChange={(event) =>
                      setCompanyField("company_display_name", event.target.value)
                    }
                    size="small"
                  />
                  <TextField
                    label={t("admin.legalName", { defaultValue: "Legal name" })}
                    value={companyForm.company_name}
                    onChange={(event) =>
                      setCompanyField("company_name", event.target.value)
                    }
                    size="small"
                  />
                  <TextField
                    label={t("admin.vatNumber", { defaultValue: "VAT number" })}
                    value={companyForm.vat_number}
                    onChange={(event) => setCompanyField("vat_number", event.target.value)}
                    size="small"
                    inputMode="numeric"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={companyForm.is_self_project}
                        onChange={(event) =>
                          setCompanyField("is_self_project", event.target.checked)
                        }
                      />
                    }
                    label={t("admin.selfProject", { defaultValue: "Self project" })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={companyForm.auto_self_approve}
                        onChange={(event) =>
                          setCompanyField("auto_self_approve", event.target.checked)
                        }
                      />
                    }
                    label={t("admin.autoSelfApprove", {
                      defaultValue: "Auto self-approve",
                    })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={companyForm.is_active}
                        onChange={(event) =>
                          setCompanyField("is_active", event.target.checked)
                        }
                      />
                    }
                    label={t("admin.active", { defaultValue: "Active" })}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Button variant="contained" onClick={handleSaveCompany} disabled={isBusy}>
                    {editingCompanyId
                      ? t("admin.updateCompany", { defaultValue: "Update company" })
                      : t("admin.addCompany", { defaultValue: "Add company" })}
                  </Button>
                  {editingCompanyId ? (
                    <Button onClick={resetCompanyForm} disabled={isBusy}>
                      {t("existingInvoice.cancel")}
                    </Button>
                  ) : null}
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {companies.map((company) => (
                    <Paper
                      key={company.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid #e5e7eb",
                        opacity: company.is_active ? 1 : 0.55,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                        <Box>
                          <Typography variant="subtitle2">
                            {company.company_display_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {company.company_name}
                            {company.vat_number ? ` · ${company.vat_number}` : ""}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Button size="small" onClick={() => handleEditCompany(company)}>
                            {t("dashboard.updateInvoice")}
                          </Button>
                          {company.is_active ? (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeactivateCompany(company.id)}
                            >
                              {t("duplicates.deleteRecord")}
                            </Button>
                          ) : null}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t("admin.projects", { defaultValue: "Projects" })}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <TextField
                    label={t("fields.company")}
                    value={projectForm.company_id}
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        company_id: event.target.value,
                      }))
                    }
                    select
                    size="small"
                  >
                    <MenuItem value="">-</MenuItem>
                    {activeCompanies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.company_display_name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label={t("fields.project")}
                    value={projectForm.name}
                    onChange={(event) =>
                      setProjectForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    disabled={!canManageProjects}
                    size="small"
                    helperText={
                      selectedProjectCompany &&
                      selectedProjectCompany.company_display_name === PERSONAL_COMPANY
                        ? t("admin.personalProjectsDerived", {
                            defaultValue: "PERSONAL projects come from users.",
                          })
                        : ""
                    }
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleSaveProject}
                  disabled={isBusy || !canManageProjects}
                >
                  {t("admin.addProject", { defaultValue: "Add project" })}
                </Button>

                {selectedProjectCompany ? (
                  <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                    {(selectedProjectCompany.projects ?? []).map((project) => (
                      <Paper
                        key={project.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid #e5e7eb",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography>{project.name}</Typography>
                        {project.is_active ? (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDeactivateProject(project.id)}
                          >
                            {t("duplicates.deleteRecord")}
                          </Button>
                        ) : null}
                      </Paper>
                    ))}
                  </Box>
                ) : null}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t("admin.people", { defaultValue: "People" })}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {users.map((user) => {
                    const editingUser = editingUsers[user.id] ?? {};
                    return (
                      <Paper
                        key={user.id}
                        elevation={0}
                        sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {getUserLabel(user)} ({user.user_name})
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 2,
                            alignItems: "center",
                          }}
                        >
                          <TextField
                            label={t("admin.firstName", { defaultValue: "First name" })}
                            value={editingUser.first_name ?? ""}
                            onChange={(event) =>
                              setUserField(user.id, "first_name", event.target.value)
                            }
                            size="small"
                          />
                          <TextField
                            label={t("admin.lastName", { defaultValue: "Last name" })}
                            value={editingUser.last_name ?? ""}
                            onChange={(event) =>
                              setUserField(user.id, "last_name", event.target.value)
                            }
                            size="small"
                          />
                          <TextField
                            label={t("admin.phone", { defaultValue: "Phone" })}
                            value={editingUser.phone ?? ""}
                            onChange={(event) =>
                              setUserField(user.id, "phone", event.target.value)
                            }
                            size="small"
                          />
                          <TextField
                            label={t("admin.approverNumber", {
                              defaultValue: "Approver number",
                            })}
                            value={editingUser.approver_number ?? ""}
                            onChange={(event) =>
                              setUserField(
                                user.id,
                                "approver_number",
                                event.target.value,
                              )
                            }
                            size="small"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={Boolean(editingUser.is_approver)}
                                onChange={(event) =>
                                  setUserField(
                                    user.id,
                                    "is_approver",
                                    event.target.checked,
                                  )
                                }
                              />
                            }
                            label={t("admin.approver", { defaultValue: "Approver" })}
                          />
                          <Button
                            variant="outlined"
                            onClick={() => handleSaveUser(user.id)}
                            disabled={isBusy}
                          >
                            {t("invoiceEdit.submit")}
                          </Button>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
}
