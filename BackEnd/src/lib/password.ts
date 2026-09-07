import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$/;

export const hashPassword = (password: string) =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = (password: string, storedPassword: string) =>
  BCRYPT_HASH_PATTERN.test(storedPassword)
    ? bcrypt.compare(password, storedPassword)
    : Promise.resolve(password === storedPassword);

export const isHashedPassword = (password: string) =>
  BCRYPT_HASH_PATTERN.test(password);
