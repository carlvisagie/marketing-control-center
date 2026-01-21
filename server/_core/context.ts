/**
 * tRPC Context - ZERO MANUS DEPENDENCIES
 * 
 * Uses simple JWT authentication instead of Manus OAuth SDK.
 */

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getUserFromRequest, type AuthUser } from "./simpleAuth";

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

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: ContextUser | null = null;

  try {
    const authUser = await getUserFromRequest(opts.req);
    if (authUser) {
      // Map simple auth user to context user format
      user = {
        ...authUser,
        openId: `local_${authUser.id}`,
        email: `${authUser.username}@local`,
        name: authUser.username,
        loginMethod: "simple",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
