/**
 * Simple JWT Authentication - ZERO MANUS DEPENDENCIES
 * 
 * This module provides simple password-based authentication with JWT tokens.
 * No external OAuth provider required - fully self-contained.
 */

import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";
import crypto from "crypto";

// Environment variables for auth
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

// Cookie settings
const COOKIE_NAME = "mcc_session";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

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
 * Verify password against stored hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Create a JWT token for authenticated user
 */
export async function createToken(user: AuthUser): Promise<string> {
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
 */
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // For now, simple single-admin auth
  // In production, this would check against database
  
  if (username !== ADMIN_USERNAME) {
    return { success: false, error: "Invalid credentials" };
  }

  // If no password hash is set, use default (for initial setup)
  const expectedHash = ADMIN_PASSWORD_HASH || hashPassword("changeme123");
  
  if (!verifyPassword(password, expectedHash)) {
    return { success: false, error: "Invalid credentials" };
  }

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
 * Check if simple auth is configured
 */
export function isSimpleAuthConfigured(): boolean {
  return Boolean(ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_HASH.length > 0);
}

/**
 * Generate initial password hash for setup
 */
export function generatePasswordHash(password: string): string {
  const hash = hashPassword(password);
  console.log(`\n=== ADMIN PASSWORD SETUP ===`);
  console.log(`Add this to your environment variables:`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`============================\n`);
  return hash;
}
