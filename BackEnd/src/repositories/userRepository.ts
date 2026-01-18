import { dbClient } from "../lib/prisma";

export const userRepository = {
  async create(data: { name: string; email: string; password: string }) {
    return dbClient.user.create({ data });
  },
  async findByEmail(email: string) {
    return dbClient.user.findUnique({ where: { email } });
  },
};
