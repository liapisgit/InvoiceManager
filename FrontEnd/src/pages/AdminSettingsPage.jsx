import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingUsers, setEditingUsers] = useState({});
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: null,
    id: "",
    name: "",
  });

  const isBusy = isLoading || isSaving;

  const activeCompanies = useMemo(
    () => companies.filter((company) => company.is_active),
    [companies],
  );

  const selectedProjectCompany = useMemo(
    () => companies.find((company) => company.id === projectForm.company_id),
    [companies, projectForm.company_id],
  );

  const editableProjects = useMemo(
    () =>
      (selectedProjectCompany?.projects ?? []).filter(
        (project) => !project.derived_from_company && !project.derived_from_user,
      ),
    [selectedProjectCompany],
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId],
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

  const handleCompanySelection = (companyId) => {
    const company = companies.find((currentCompany) => currentCompany.id === companyId);
    if (!company) {
      resetCompanyForm();
      return;
    }

    handleEditCompany(company);
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

  const openDeleteCompanyDialog = () => {
    if (!editingCompanyId) return;
    setDeleteDialog({
      open: true,
      type: "company",
      id: editingCompanyId,
      name: companyForm.company_display_name.trim() || companyForm.company_name.trim(),
    });
  };

  const openDeleteProjectDialog = () => {
    if (!editingProjectId) return;
    setDeleteDialog({
      open: true,
      type: "project",
      id: editingProjectId,
      name: projectForm.name.trim(),
    });
  };

  const closeDeleteDialog = () => {
    if (isSaving) return;
    setDeleteDialog({
      open: false,
      type: null,
      id: "",
      name: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return;

    setIsSaving(true);
    try {
      if (deleteDialog.type === "company") {
        await apiClient.delete(`/api/companies/${deleteDialog.id}`);
        resetCompanyForm();
      } else {
        await apiClient.delete(`/api/companies/projects/${deleteDialog.id}`);
        setEditingProjectId("");
        setProjectForm((current) => ({ ...current, name: "" }));
      }
      setDeleteDialog({
        open: false,
        type: null,
        id: "",
        name: "",
      });
      await loadData();
    } catch (error) {
      console.error(`Error deleting ${deleteDialog.type}:`, error);
      setErrorMessage(t("admin.saveError", { defaultValue: "Could not save changes." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProject = async () => {
    if (!projectForm.company_id || !projectForm.name.trim()) return;
    setIsSaving(true);
    try {
      if (editingProjectId) {
        await apiClient.patch(`/api/companies/projects/${editingProjectId}`, {
          name: projectForm.name.trim(),
        });
      } else {
        await apiClient.post("/api/companies/projects", {
          company_id: projectForm.company_id,
          name: projectForm.name.trim(),
        });
      }
      setProjectForm(emptyProjectForm);
      setEditingProjectId("");
      await loadData();
    } catch (error) {
      console.error("Error saving project:", error);
      setErrorMessage(t("admin.saveError", { defaultValue: "Could not save changes." }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleProjectCompanySelection = (companyId) => {
    setProjectForm({
      ...emptyProjectForm,
      company_id: companyId,
    });
    setEditingProjectId("");
  };

  const handleProjectSelection = (projectId) => {
    const project = editableProjects.find((currentProject) => currentProject.id === projectId);
    if (!project) {
      setEditingProjectId("");
      setProjectForm((current) => ({ ...current, name: "" }));
      return;
    }

    setEditingProjectId(project.id);
    setProjectForm((current) => ({ ...current, name: project.name ?? "" }));
  };

  const resetProjectForm = () => {
    setProjectForm(emptyProjectForm);
    setEditingProjectId("");
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

  const selectedEditingUser = selectedUser ? (editingUsers[selectedUser.id] ?? {}) : {};

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
                <TextField
                  label={t("admin.companyToEdit", { defaultValue: "Company to edit" })}
                  value={editingCompanyId}
                  onChange={(event) => handleCompanySelection(event.target.value)}
                  select
                  size="small"
                  fullWidth
                  helperText={t("admin.companyEditHint", {
                    defaultValue: "Leave empty to add a new company.",
                  })}
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">
                    {t("admin.addNewCompany", { defaultValue: "Add new company" })}
                  </MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.company_display_name}
                      {company.is_active
                        ? ""
                        : ` (${t("admin.inactive", { defaultValue: "inactive" })})`}
                    </MenuItem>
                  ))}
                </TextField>
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
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveCompany}
                    disabled={isBusy || !companyForm.company_display_name.trim()}
                  >
                    {editingCompanyId
                      ? t("admin.updateCompany", { defaultValue: "Update company" })
                      : t("admin.addCompany", { defaultValue: "Add company" })}
                  </Button>
                  {editingCompanyId ? (
                    <Button onClick={resetCompanyForm} disabled={isBusy}>
                      {t("existingInvoice.cancel")}
                    </Button>
                  ) : null}
                  {editingCompanyId ? (
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={openDeleteCompanyDialog}
                      disabled={isBusy}
                    >
                      {t("admin.delete")}
                    </Button>
                  ) : null}
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
                    onChange={(event) => handleProjectCompanySelection(event.target.value)}
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
                    label={t("admin.projectToEdit", { defaultValue: "Project to edit" })}
                    value={editingProjectId}
                    onChange={(event) => handleProjectSelection(event.target.value)}
                    select
                    size="small"
                    disabled={!canManageProjects}
                    helperText={t("admin.projectEditHint", {
                      defaultValue: "Leave empty to add a new project.",
                    })}
                  >
                    <MenuItem value="">
                      {t("admin.addNewProject", { defaultValue: "Add new project" })}
                    </MenuItem>
                    {editableProjects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                        {project.is_active
                          ? ""
                          : ` (${t("admin.inactive", { defaultValue: "inactive" })})`}
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
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveProject}
                    disabled={isBusy || !canManageProjects || !projectForm.name.trim()}
                  >
                    {editingProjectId
                      ? t("admin.updateProject", { defaultValue: "Update project" })
                      : t("admin.addProject", { defaultValue: "Add project" })}
                  </Button>
                  {editingProjectId ? (
                    <Button onClick={resetProjectForm} disabled={isBusy}>
                      {t("existingInvoice.cancel")}
                    </Button>
                  ) : null}
                  {editingProjectId ? (
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={openDeleteProjectDialog}
                      disabled={isBusy}
                    >
                      {t("admin.delete")}
                    </Button>
                  ) : null}
                </Box>
                {selectedProjectCompany &&
                !canManageProjects &&
                selectedProjectCompany.company_display_name !== PERSONAL_COMPANY ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t("admin.selfProjectManagedByCompany", {
                      defaultValue: "Self-project companies use the company name as the project.",
                    })}
                  </Typography>
                ) : null}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {t("admin.people", { defaultValue: "People" })}
                </Typography>
                <TextField
                  label={t("admin.userToEdit", { defaultValue: "User to edit" })}
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  select
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">-</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {getUserLabel(user)} ({user.user_name})
                    </MenuItem>
                  ))}
                </TextField>
                {selectedUser ? (
                  <Paper
                    elevation={0}
                    sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb" }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      {getUserLabel(selectedUser)} ({selectedUser.user_name})
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
                        value={selectedEditingUser.first_name ?? ""}
                        onChange={(event) =>
                          setUserField(selectedUser.id, "first_name", event.target.value)
                        }
                        size="small"
                      />
                      <TextField
                        label={t("admin.lastName", { defaultValue: "Last name" })}
                        value={selectedEditingUser.last_name ?? ""}
                        onChange={(event) =>
                          setUserField(selectedUser.id, "last_name", event.target.value)
                        }
                        size="small"
                      />
                      <TextField
                        label={t("admin.phone", { defaultValue: "Phone" })}
                        value={selectedEditingUser.phone ?? ""}
                        onChange={(event) =>
                          setUserField(selectedUser.id, "phone", event.target.value)
                        }
                        size="small"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(selectedEditingUser.is_approver)}
                            onChange={(event) =>
                              setUserField(
                                selectedUser.id,
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
                        onClick={() => handleSaveUser(selectedUser.id)}
                        disabled={isBusy}
                      >
                        {t("invoiceEdit.submit")}
                      </Button>
                    </Box>
                  </Paper>
                ) : null}
              </Box>
            </Box>
          )}
        </Paper>

        <Dialog
          open={deleteDialog.open}
          onClose={closeDeleteDialog}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>
            {deleteDialog.type === "company"
              ? t("admin.deleteCompanyTitle")
              : t("admin.deleteProjectTitle")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {deleteDialog.type === "company"
                ? t("admin.confirmDeleteCompany", { name: deleteDialog.name })
                : t("admin.confirmDeleteProject", { name: deleteDialog.name })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog} disabled={isSaving}>
              {t("admin.cancel")}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              startIcon={
                isSaving ? (
                  <CircularProgress color="inherit" size={16} />
                ) : (
                  <DeleteOutlineIcon />
                )
              }
              disabled={isSaving}
            >
              {t("admin.delete")}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
