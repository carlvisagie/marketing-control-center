/**
 * Simple Auth Router - ZERO MANUS DEPENDENCIES
 * 
 * Provides login/logout endpoints using simple JWT authentication.
 * No external OAuth provider required.
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  login,
  setAuthCookie,
  clearAuthCookie,
  isSimpleAuthConfigured,
  generatePasswordHash,
} from "../_core/simpleAuth";

export const simpleAuthRouter = router({
  /**
   * Login with username and password
   */
  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await login(input.username, input.password);
      
      if (result.success && result.token) {
        setAuthCookie(ctx.res, result.token);
        return { success: true };
      }
      
      return { success: false, error: result.error || "Login failed" };
    }),

  /**
   * Logout - clear session cookie
   */
  logout: protectedProcedure.mutation(({ ctx }) => {
    clearAuthCookie(ctx.res);
    return { success: true };
  }),

  /**
   * Get current user
   */
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user || null;
  }),

  /**
   * Check if auth is configured
   */
  status: publicProcedure.query(() => {
    return {
      configured: isSimpleAuthConfigured(),
      message: isSimpleAuthConfigured()
        ? "Authentication is configured"
        : "Authentication not configured. Set ADMIN_PASSWORD_HASH environment variable.",
    };
  }),

  /**
   * Generate password hash (for initial setup only)
   * This should be called once to generate the hash, then disabled
   */
  generateHash: publicProcedure
    .input(z.object({
      password: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(({ input }) => {
      // Only allow in development or if not configured
      if (process.env.NODE_ENV === "production" && isSimpleAuthConfigured()) {
        return { 
          success: false, 
          error: "Cannot generate hash in production when already configured" 
        };
      }
      
      const hash = generatePasswordHash(input.password);
      return {
        success: true,
        hash,
        instructions: "Add ADMIN_PASSWORD_HASH to your environment variables",
      };
    }),
});
