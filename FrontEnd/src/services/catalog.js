import { apiClient } from "./apiClient";

export const PERSONAL_COMPANY = "PERSONAL";
export const SELF_APPROVER_VALUE = "__self__";

export const fetchCompanies = async () => {
  const response = await apiClient.get("/api/companies");
  return Array.isArray(response.data) ? response.data : [];
};

export const fetchAdminCompanies = async () => {
  const response = await apiClient.get("/api/companies/admin");
  return Array.isArray(response.data) ? response.data : [];
};

export const getCompanyLabel = (company) =>
  String(company?.company_display_name ?? "").trim();

export const getCompanyByLabel = (companies, label) =>
  companies.find((company) => getCompanyLabel(company) === label) ?? null;

export const getProjectOptionsForCompany = (companies, companyLabel) => {
  const company = getCompanyByLabel(companies, companyLabel);
  if (!company) return [];

  if (company.is_self_project) return [getCompanyLabel(company)];
  return (company.projects ?? []).map((project) => project.name);
};

export const getDefaultProjectForCompany = (
  companies,
  companyLabel,
  personalProjectName = "",
) => {
  const company = getCompanyByLabel(companies, companyLabel);
  if (!company) return "";
  if (getCompanyLabel(company) === PERSONAL_COMPANY) return personalProjectName;
  if (company.is_self_project) return getCompanyLabel(company);
  return "";
};

export const isSelfProjectCompany = (companies, companyLabel) => {
  const company = getCompanyByLabel(companies, companyLabel);
  return Boolean(company?.is_self_project);
};

export const isAutoSelfApproveCompany = (companies, companyLabel) => {
  const company = getCompanyByLabel(companies, companyLabel);
  return Boolean(company?.auto_self_approve);
};
