import { dbClient } from "../lib/prisma";

export const userRepository = {
  async findByUserName(user_name: string) {
    return dbClient.user.findUnique({ where: { user_name } });
  },

  async findById(id: string) {
    return dbClient.user.findUnique({ where: { id } });
  },

  async findAll() {
    return dbClient.user.findMany({
      where: { is_active: true },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }, { user_name: "asc" }],
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
        phone: true,
        approver_number: true,
        is_approver: true,
        is_admin: true,
        is_active: true,
        createdAt: true,
        lastUpdatedAt: true,
      },
    });
  },

  async update(
    id: string,
    data: {
      first_name?: string | null;
      last_name?: string | null;
      phone?: string | null;
      approver_number?: string | null;
      is_approver?: boolean;
      is_admin?: boolean;
    },
  ) {
    return dbClient.user.update({
      where: { id },
      data,
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
        phone: true,
        approver_number: true,
        is_approver: true,
        is_admin: true,
        is_active: true,
        user_gdrive_folder_id: true,
        createdAt: true,
        lastUpdatedAt: true,
      },
    });
  },

  async deactivate(id: string) {
    return dbClient.user.update({
      where: { id, is_active: true },
      data: {
        is_active: false,
        is_approver: false,
        is_admin: false,
      },
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
        phone: true,
        approver_number: true,
        is_approver: true,
        is_admin: true,
        is_active: true,
        user_gdrive_folder_id: true,
        createdAt: true,
        lastUpdatedAt: true,
      },
    });
  },

  async findApproverByPhone(phone: string) {
    return dbClient.user.findFirst({
      where: {
        phone,
        is_approver: true,
        is_active: true,
        AND: [
          { first_name: { not: null } },
          { first_name: { not: "" } },
          { last_name: { not: null } },
          { last_name: { not: "" } },
        ],
      },
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
        phone: true,
      },
    });
  },

  async findApprovers() {
    return dbClient.user.findMany({
      where: {
        is_approver: true,
        is_active: true,
        AND: [
          { first_name: { not: null } },
          { first_name: { not: "" } },
          { last_name: { not: null } },
          { last_name: { not: "" } },
          { phone: { not: null } },
          { phone: { not: "" } },
        ],
      },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }, { user_name: "asc" }],
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
        phone: true,
      },
    });
  },

  async findManyByIds(ids: string[]) {
    return dbClient.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
      },
    });
  },

  async findManyByPhones(phones: string[]) {
    return dbClient.user.findMany({
      where: { phone: { in: phones } },
      select: {
        phone: true,
        user_name: true,
        first_name: true,
        last_name: true,
      },
    });
  },
};
