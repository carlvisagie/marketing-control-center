import { integer, pgEnum, pgTable, text, timestamp, varchar, serial, boolean, json, date } from "drizzle-orm/pg-core";

/**
 * Schema matching the existing Just Talk PostgreSQL database.
 * ZERO MANUS DEPENDENCIES - Uses YOUR PostgreSQL database on Render.
 */

// Platform enum - must match existing enum in database
export const platformEnum = pgEnum("platform", ["facebook", "instagram", "linkedin", "tiktok"]);

// Post status enum
export const postStatusEnum = pgEnum("post_status", ["pending", "scheduled", "posted", "failed", "cancelled"]);

/**
 * Users table - matches existing Just Talk schema (snake_case columns)
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  birthdate: date("birthdate"),
  role: varchar("role", { length: 50 }),
  primaryGoal: text("primary_goal"),
  secondaryGoal: text("secondary_goal"),
  mainChallenges: text("main_challenges"),
  preferredFrequency: varchar("preferred_frequency", { length: 50 }),
  timezone: varchar("timezone", { length: 64 }),
  availability: text("availability"),
  communicationStyle: varchar("communication_style", { length: 50 }),
  triggers: text("triggers"),
  profileCompleteness: integer("profile_completeness").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Platform connections - matches existing Just Talk schema (camelCase columns)
 */
export const platformConnections = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  platform: platformEnum("platform").notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken"),
  pageId: varchar("pageId", { length: 255 }),
  pageName: varchar("pageName", { length: 255 }),
  metadata: json("metadata"),
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

/**
 * Activity log - tracks all actions in the system (matches existing Just Talk schema)
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
