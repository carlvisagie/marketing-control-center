/**
 * Simple JWT Authentication - ZERO MANUS DEPENDENCIES
 * 
 * HARDENED FOR PRODUCTION:
 * - No default password fallback
 * - Rate limiting on login attempts
 * - Proper error messages (no info leakage)
 */

import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import crypto from "crypto";

// Environment variables for auth
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Cookie settings
const COOKIE_NAME = "mcc_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Rate limiting - track failed attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export interface AuthUser {
  id: number;
  username: string;
  role: "admin" | "user";
}

export interface JWTPayload {
  sub: string;
  username: string;
  role: "admin" | "user";
  iat: number;
  exp: number;
}

/**
 * Hash a password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password against stored hash using timing-safe comparison
 */
export function verifyPassword(password: string, hash: string): boolean {
  const inputHash = hashPassword(password);
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
  } catch {
    return false;
  }
}

/**
 * Check if IP is rate limited
 */
function isRateLimited(ip: string): { limited: boolean; remainingTime?: number } {
  const attempt = loginAttempts.get(ip);
  if (!attempt) return { limited: false };

  const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;
  
  // Reset if lockout period has passed
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return { limited: false };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000);
    return { limited: true, remainingTime };
  }

  return { limited: false };
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(ip: string): void {
  const attempt = loginAttempts.get(ip);
  if (attempt) {
    attempt.count++;
    attempt.lastAttempt = Date.now();
  } else {
    loginAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
  }
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Create a JWT token for authenticated user
 */
export async function createToken(user: AuthUser): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }
  
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT({
    sub: String(user.id),
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!JWT_SECRET) {
    return null;
  }
  
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Login with username and password
 * HARDENED: No default password, rate limiting, timing-safe comparison
 */
export async function login(
  username: string,
  password: string,
  clientIp: string = "unknown"
): Promise<{ success: boolean; token?: string; error?: string }> {
  // Check rate limiting first
  const rateLimitCheck = isRateLimited(clientIp);
  if (rateLimitCheck.limited) {
    return { 
      success: false, 
      error: `Too many failed attempts. Try again in ${rateLimitCheck.remainingTime} seconds.` 
    };
  }

  // Check if auth is properly configured
  if (!isSimpleAuthConfigured()) {
    return { success: false, error: "Authentication not configured" };
  }

  // Generic error message to prevent username enumeration
  const genericError = "Invalid credentials";

  // Verify username
  if (username !== ADMIN_USERNAME) {
    recordFailedAttempt(clientIp);
    return { success: false, error: genericError };
  }

  // Verify password
  if (!verifyPassword(password, ADMIN_PASSWORD_HASH!)) {
    recordFailedAttempt(clientIp);
    return { success: false, error: genericError };
  }

  // Success - clear failed attempts
  clearFailedAttempts(clientIp);

  const user: AuthUser = {
    id: 1,
    username: ADMIN_USERNAME,
    role: "admin",
  };

  const token = await createToken(user);
  return { success: true, token };
}

/**
 * Get user from request (via cookie or Authorization header)
 */
export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  // Try cookie first
  let token = req.cookies?.[COOKIE_NAME];
  
  // Try Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: parseInt(payload.sub, 10),
    username: payload.username,
    role: payload.role,
  };
}

/**
 * Set auth cookie on response
 */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Check if simple auth is properly configured
 * HARDENED: Requires both JWT_SECRET and ADMIN_PASSWORD_HASH
 */
export function isSimpleAuthConfigured(): boolean {
  return Boolean(
    JWT_SECRET && 
    JWT_SECRET.length >= 32 &&
    ADMIN_PASSWORD_HASH && 
    ADMIN_PASSWORD_HASH.length === 64 // SHA-256 produces 64 hex chars
  );
}

/**
 * Generate password hash for setup
 */
export function generatePasswordHash(password: string): string {
  return hashPassword(password);
}

/**
 * Get auth configuration status for health checks
 */
export function getAuthStatus(): { 
  configured: boolean; 
  jwtSecretSet: boolean; 
  passwordHashSet: boolean;
  jwtSecretLength: number;
} {
  return {
    configured: isSimpleAuthConfigured(),
    jwtSecretSet: Boolean(JWT_SECRET),
    passwordHashSet: Boolean(ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_HASH.length === 64),
    jwtSecretLength: JWT_SECRET?.length || 0,
  };
}
