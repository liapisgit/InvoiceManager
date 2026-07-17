import { dbClient } from "../lib/prisma";

type CompanyWriteData = {
  company_display_name?: string | null;
  company_name?: string;
  vat_number?: string | null;
  is_issuer?: boolean;
  is_self_project?: boolean;
  auto_self_approve?: boolean;
  is_active?: boolean;
};

type ProjectWriteData = {
  company_id?: string;
  name?: string;
  is_active?: boolean;
};

const PERSONAL_COMPANY = "PERSONAL";

const normalizeVatNumber = (vatNumber: string | null | undefined) => {
  const trimmed = String(vatNumber ?? "").trim();
  return trimmed || null;
};

const getUserProjectLabel = (user: {
  first_name: string | null;
  last_name: string | null;
  user_name: string;
}) =>
  (`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.user_name)
    .trim()
    .toUpperCase();

const getCompanyOrderBy = [
  { company_display_name: "asc" as const },
  { company_name: "asc" as const },
];

export const companyRepository = {
  async findCatalog() {
    const [companies, users] = await Promise.all([
      dbClient.companyVatRegistry.findMany({
        where: {
          is_active: true,
          company_display_name: { not: null },
        },
        orderBy: getCompanyOrderBy,
        include: {
          projects: {
            where: { is_active: true },
            orderBy: { name: "asc" },
          },
        },
      }),
      dbClient.user.findMany({
        where: {
          AND: [
            { first_name: { not: null } },
            { first_name: { not: "" } },
            { last_name: { not: null } },
            { last_name: { not: "" } },
          ],
        },
        orderBy: [{ first_name: "asc" }, { last_name: "asc" }, { user_name: "asc" }],
        select: {
          id: true,
          user_name: true,
          first_name: true,
          last_name: true,
        },
      }),
    ]);

    const personalProjects = users.map((user) => ({
      id: user.id,
      name: getUserProjectLabel(user),
      is_active: true,
      derived_from_user: true,
    }));

    return companies.map((company) => {
      const displayName = company.company_display_name ?? "";

      return {
        id: company.id,
        vat_number: company.vat_number,
        company_name: company.company_name,
        company_display_name: displayName,
        is_issuer: company.is_issuer,
        is_self_project: company.is_self_project,
        auto_self_approve: company.auto_self_approve,
        is_active: company.is_active,
        source: company.source,
        projects:
          displayName === PERSONAL_COMPANY
            ? personalProjects
            : company.is_self_project
              ? [
                  {
                    id: company.id,
                    name: displayName,
                    is_active: true,
                    derived_from_company: true,
                  },
                ]
              : company.projects.map((project) => ({
                  id: project.id,
                  name: project.name,
                  is_active: project.is_active,
                })),
      };
    });
  },

  async findAllOwned() {
    return dbClient.companyVatRegistry.findMany({
      where: {
        company_display_name: { not: null },
      },
      orderBy: getCompanyOrderBy,
      include: {
        projects: {
          orderBy: { name: "asc" },
        },
      },
    });
  },

  async create(data: CompanyWriteData) {
    const vatNumber = normalizeVatNumber(data.vat_number);
    const displayName = data.company_display_name ?? null;
    const companyData = {
      company_display_name: displayName,
      company_name: data.company_name || displayName || "",
      vat_number: vatNumber,
      is_issuer: data.is_issuer ?? false,
      is_self_project: data.is_self_project ?? false,
      auto_self_approve: data.auto_self_approve ?? false,
      is_active: data.is_active ?? true,
      source: "manual",
      updated_at: new Date(),
    };

    if (vatNumber) {
      return dbClient.companyVatRegistry.upsert({
        where: { vat_number: vatNumber },
        update: companyData,
        create: companyData,
      });
    }

    return dbClient.companyVatRegistry.create({ data: companyData });
  },

  async update(id: string, data: CompanyWriteData) {
    const updateData = {
      ...data,
      ...(Object.prototype.hasOwnProperty.call(data, "vat_number")
        ? { vat_number: normalizeVatNumber(data.vat_number) }
        : {}),
      updated_at: new Date(),
    };

    return dbClient.companyVatRegistry.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return dbClient.companyVatRegistry.delete({
      where: { id },
    });
  },
};

export const projectRepository = {
  async create(data: ProjectWriteData) {
    return dbClient.project.create({
      data: {
        company_id: data.company_id!,
        name: data.name!,
        is_active: data.is_active ?? true,
      },
    });
  },

  async update(id: string, data: ProjectWriteData) {
    return dbClient.project.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  },

  async delete(id: string) {
    return dbClient.project.delete({
      where: { id },
    });
  },
};
