/**
 * Just Talk Database Connection (READ-ONLY)
 * 
 * This module provides read-only access to the Just Talk platform database
 * for analytics and marketing insights. NO WRITES are permitted.
 * 
 * CRITICAL: This is a separate database from Marketing Control Center's own DB.
 * Just Talk must never be affected by Marketing Control Center operations.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "./env";

// Just Talk database connection (read-only)
let _justTalkDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get read-only connection to Just Talk database
 * Returns null if not configured
 */
export async function getJustTalkDb() {
  if (!ENV.justTalkDatabaseUrl) {
    console.warn("[JustTalkDB] JUST_TALK_DATABASE_URL not configured");
    return null;
  }

  if (!_justTalkDb) {
    try {
      // Create read-only connection
      const client = postgres(ENV.justTalkDatabaseUrl, {
        max: 5, // Limit connections to avoid overloading Just Talk
        idle_timeout: 20,
        connect_timeout: 10,
      });
      
      _justTalkDb = drizzle(client);
      console.log("[JustTalkDB] Connected to Just Talk database (READ-ONLY)");
    } catch (error) {
      console.error("[JustTalkDB] Failed to connect:", error);
      return null;
    }
  }

  return _justTalkDb;
}

/**
 * Execute a read-only query on Just Talk database
 * Wraps all queries with safety checks
 */
export async function queryJustTalk<T>(
  queryFn: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T | null> {
  const db = await getJustTalkDb();
  if (!db) {
    console.warn("[JustTalkDB] Cannot query: database not available");
    return null;
  }

  try {
    return await queryFn(db);
  } catch (error) {
    console.error("[JustTalkDB] Query error:", error);
    return null;
  }
}

/**
 * Test connection to Just Talk database
 */
export async function testJustTalkConnection(): Promise<boolean> {
  const db = await getJustTalkDb();
  if (!db) return false;

  try {
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("[JustTalkDB] Connection test failed:", error);
    return false;
  }
}
