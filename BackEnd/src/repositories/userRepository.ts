import { dbClient } from "../lib/prisma";

export const userRepository = {
  async findByUserName(user_name: string) {
    return dbClient.user.findUnique({ where: { user_name } });
  },

  async findApproverById(id: string) {
    return dbClient.user.findFirst({
      where: { id, is_approver: true },
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
      },
    });
  },

  async findApprovers() {
    return dbClient.user.findMany({
      where: { is_approver: true },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }, { user_name: "asc" }],
      select: {
        id: true,
        user_name: true,
        first_name: true,
        last_name: true,
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
};
