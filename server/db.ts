/**
 * Database Module - PostgreSQL Connection to Just Talk Database
 * 
 * Connects to the Just Talk PostgreSQL database for unified data access.
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;
let _ownerEnsured = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  // Use JUST_TALK_DATABASE_URL first, fall back to DATABASE_URL
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
      
      // Auto-create owner user on first connection
      if (!_ownerEnsured) {
        await ensureOwnerUser(_db);
        _ownerEnsured = true;
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Ensure the owner user exists in the database.
 * This is called automatically on first database connection.
 */
async function ensureOwnerUser(db: ReturnType<typeof drizzle>) {
  try {
    // Check if owner exists
    const existing = await db.select().from(users).where(eq(users.openId, "owner")).limit(1);
    
    if (existing.length === 0) {
      // Create owner user
      await db.insert(users).values({
        openId: "owner",
        name: "Carl Visagie",
        email: "coachingpurposefulliving@gmail.com",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      console.log("[Database] Created owner user");
    } else {
      console.log("[Database] Owner user exists");
    }
  } catch (error) {
    console.error("[Database] Failed to ensure owner user:", error);
    // Don't throw - let the app continue even if this fails
  }
}

/**
 * Get the owner user ID. Creates owner if doesn't exist.
 */
export async function getOwnerId(): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const owner = await db.select().from(users).where(eq(users.openId, "owner")).limit(1);
    if (owner.length > 0) {
      return owner[0].id;
    }
    
    // Fallback: get any user
    const anyUser = await db.select().from(users).limit(1);
    if (anyUser.length > 0) {
      return anyUser[0].id;
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

// TODO: add feature queries here as your schema grows.
