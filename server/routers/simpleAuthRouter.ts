/**
 * Simple Auth Router - ZERO MANUS DEPENDENCIES
 * 
 * HARDENED FOR PRODUCTION:
 * - Rate limiting via client IP
 * - No info leakage in error messages
 * - Secure password hash generation
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  login,
  setAuthCookie,
  clearAuthCookie,
  isSimpleAuthConfigured,
  generatePasswordHash,
  getAuthStatus,
} from "../_core/simpleAuth";

/**
 * Get client IP from request, handling proxies
 */
function getClientIp(req: { headers: Record<string, string | string[] | undefined>; ip?: string }): string {
  // Check X-Forwarded-For header (set by proxies like Render, Cloudflare)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ip?.trim() || "unknown";
  }
  
  // Check X-Real-IP header
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  // Fall back to direct IP
  return req.ip || "unknown";
}

export const simpleAuthRouter = router({
  /**
   * Login with username and password
   * HARDENED: Rate limiting, no info leakage
   */
  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const clientIp = getClientIp(ctx.req);
      const result = await login(input.username, input.password, clientIp);
      
      if (result.success && result.token) {
        setAuthCookie(ctx.res, result.token);
        return { success: true };
      }
      
      return { success: false, error: result.error || "Login failed" };
    }),

  /**
   * Logout - clear session cookie
   */
  logout: publicProcedure.mutation(({ ctx }) => {
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
   * Check if auth is configured (for health checks)
   */
  status: publicProcedure.query(() => {
    const status = getAuthStatus();
    return {
      configured: status.configured,
      message: status.configured
        ? "Authentication is configured"
        : "Authentication not configured. Set JWT_SECRET (32+ chars) and ADMIN_PASSWORD_HASH environment variables.",
    };
  }),

  /**
   * Generate password hash (for initial setup only)
   * HARDENED: Disabled in production when already configured
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
