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
      phone?: string;
      approver_number?: string | null;
      is_approver?: boolean;
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
        AND: [
          { first_name: { not: null } },
          { first_name: { not: "" } },
          { last_name: { not: null } },
          { last_name: { not: "" } },
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
