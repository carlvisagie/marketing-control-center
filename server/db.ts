/**
 * Database Module - PostgreSQL Connection
 * 
 * ZERO MANUS DEPENDENCIES - Connects to YOUR PostgreSQL database on Render.
 * Uses the existing Just Talk database schema.
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  // Use JUST_TALK_DATABASE_URL - YOUR PostgreSQL database on Render
  const connectionString = process.env.JUST_TALK_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!_db && connectionString) {
    try {
      _client = postgres(connectionString, {
        ssl: { rejectUnauthorized: false },
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      _db = drizzle(_client);
      console.log("[Database] Connected to PostgreSQL");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Get the owner user ID (Carl Visagie - ID 1 in Just Talk database).
 */
export async function getOwnerId(): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Carl's user ID in Just Talk is 1 (coach_carl_1765988940043)
    const owner = await db.select().from(users).where(eq(users.id, 1)).limit(1);
    if (owner.length > 0) {
      return owner[0].id;
    }
    
    // Fallback: get any coach user
    const anyCoach = await db.select().from(users).where(eq(users.role, "coach")).limit(1);
    if (anyCoach.length > 0) {
      return anyCoach[0].id;
    }
    
    return null;
  } catch (error) {
    console.error("[Database] Failed to get owner ID:", error);
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    
    if (existing.length > 0) {
      // Update existing user
      const updateSet: Partial<InsertUser> = {};
      
      if (user.name !== undefined) updateSet.name = user.name;
      if (user.email !== undefined) updateSet.email = user.email;
      if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
      if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) updateSet.role = user.role;
      
      updateSet.updatedAt = new Date();
      
      await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      const values: InsertUser = {
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? "user",
        lastSignedIn: user.lastSignedIn ?? new Date(),
      };
      
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
