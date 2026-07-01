import type { JwtPayload } from "jsonwebtoken";

export type AuthPayload = JwtPayload & {
  user_id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  is_admin?: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {};
