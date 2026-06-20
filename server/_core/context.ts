/**
 * tRPC Context — No authentication required.
 * Single-user private tool. Owner is always logged in.
 */

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { AuthUser } from "./simpleAuth";

// Extended user type for context
export type ContextUser = AuthUser & {
  openId?: string;
  email?: string;
  name?: string;
  loginMethod?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastSignedIn?: Date;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: ContextUser | null;
};

// Permanent owner — no login required
const OWNER_USER: ContextUser = {
  id: 1,
  username: "carl",
  role: "admin",
  openId: "local_1",
  email: "carl@justtalk.com",
  name: "Carl Visagie",
  loginMethod: "none",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
    user: OWNER_USER,
  };
}
