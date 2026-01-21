import { integer, pgEnum, pgTable, text, timestamp, varchar, serial, boolean, json } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
// Role enum for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin"]);

// Platform enum for social media connections
export const platformEnum = pgEnum("platform", ["facebook", "instagram", "linkedin", "tiktok"]);

// Post status enum
export const postStatusEnum = pgEnum("post_status", ["pending", "scheduled", "posted", "failed", "cancelled"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Platform connections - stores OAuth tokens for social media platforms
 */
export const platformConnections = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  platform: platformEnum("platform").notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  pageId: varchar("pageId", { length: 255 }),
  pageName: varchar("pageName", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PlatformConnection = typeof platformConnections.$inferSelect;
export type InsertPlatformConnection = typeof platformConnections.$inferInsert;

/**
 * Scheduled posts - queue of posts to be published
 */
export const scheduledPosts = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  content: text("content").notNull(),
  platforms: json("platforms").$type<string[]>().notNull(),
  mediaUrls: json("mediaUrls").$type<string[]>(),
  link: text("link"),
  scheduledTime: timestamp("scheduledTime"),
  status: postStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

/**
 * Post results - tracks the outcome of each post to each platform
 */
export const postResults = pgTable("post_results", {
  id: serial("id").primaryKey(),
  scheduledPostId: integer("scheduledPostId").notNull().references(() => scheduledPosts.id),
  platform: platformEnum("platform").notNull(),
  success: boolean("success").notNull(),
  postId: varchar("postId", { length: 255 }),
  error: text("error"),
  postedAt: timestamp("postedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostResult = typeof postResults.$inferSelect;
export type InsertPostResult = typeof postResults.$inferInsert;

/**
 * Activity log - tracks all actions in the system
 */
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type InsertActivityLogEntry = typeof activityLog.$inferInsert;

/**
 * System settings - stores configuration like 24/7 attack status
 */
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
