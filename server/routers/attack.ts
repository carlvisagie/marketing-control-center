/**
 * 24/7 Attack Router
 * 
 * Controls the autonomous marketing automation system
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { systemSettings, scheduledPosts, activityLog } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { 
  generateContent, 
  generateDailyContentQueue, 
  getAttackStatus,
  validateContent,
  ATTACK_SCHEDULE,
  type ContentCategory 
} from "../automation/attackEngine";
import { getSchedulerStats, triggerSchedulerRun } from "../automation/scheduler";

export const attackRouter = router({
  // Get current attack status
  getStatus: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // Get system settings
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "attack_mode"))
      .limit(1);
    
    const isActive = settings[0]?.value === "active";
    const status = getAttackStatus();
    
    return {
      ...status,
      isActive,
    };
  }),

  // Toggle attack mode on/off
  toggleAttack: publicProcedure
    .input(z.object({ active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Upsert the attack_mode setting
      const existing = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "attack_mode"))
        .limit(1);
      
      if (existing.length > 0) {
        await db
          .update(systemSettings)
          .set({ 
            value: input.active ? "active" : "standby",
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.key, "attack_mode"));
      } else {
        await db.insert(systemSettings).values({
          key: "attack_mode",
          value: input.active ? "active" : "standby",
        });
      }

      // Log the activity
      await db.insert(activityLog).values({
        action: input.active ? "attack_launched" : "attack_stopped",
        details: `24/7 Attack mode ${input.active ? "activated" : "deactivated"}`,
      });

      return { 
        success: true, 
        isActive: input.active,
        message: input.active 
          ? "24/7 Attack launched! Autonomous marketing is now active."
          : "24/7 Attack stopped. System is now in standby mode."
      };
    }),

  // Generate content for a specific platform
  generateContent: publicProcedure
    .input(z.object({
      platform: z.enum(["tiktok", "instagram", "facebook", "linkedin", "twitter"]),
      category: z.enum(["educational", "testimonial", "behind_scenes", "promotional", "engagement", "trending"]),
      customTheme: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const content = await generateContent(
        input.platform,
        input.category as ContentCategory,
        input.customTheme
      );
      
      // Validate the content
      const validation = validateContent(content);
      
      return {
        content,
        validation,
      };
    }),

  // Generate a full day's content queue
  generateDailyQueue: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const queue = await generateDailyContentQueue();
    
    // Note: We'd need to get userId from context in a real implementation
    // For now, we'll just return the generated content without saving

    // Log activity
    await db.insert(activityLog).values({
      action: "daily_queue_generated",
      details: `Generated ${queue.length} posts for daily queue`,
    });

    return {
      success: true,
      count: queue.length,
      queue,
    };
  }),

  // Get scheduled posts
  getScheduledPosts: publicProcedure
    .input(z.object({
      status: z.enum(["pending", "scheduled", "posted", "failed", "cancelled"]).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let posts;
      
      if (input.status) {
        posts = await db
          .select()
          .from(scheduledPosts)
          .where(eq(scheduledPosts.status, input.status))
          .limit(input.limit);
      } else {
        posts = await db
          .select()
          .from(scheduledPosts)
          .limit(input.limit);
      }
      
      return posts;
    }),

  // Approve a scheduled post (change from pending to scheduled)
  approvePost: publicProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(scheduledPosts)
        .set({ 
          status: "scheduled",
          updatedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, input.postId));

      return { success: true };
    }),

  // Reject a scheduled post (cancel it)
  rejectPost: publicProcedure
    .input(z.object({ 
      postId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(scheduledPosts)
        .set({ 
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(scheduledPosts.id, input.postId));

      return { success: true };
    }),

  // Get attack schedule
  getSchedule: publicProcedure.query(() => {
    return ATTACK_SCHEDULE;
  }),

  // Update attack schedule for a platform
  updateSchedule: publicProcedure
    .input(z.object({
      platform: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if setting exists
      const existing = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, `schedule_${input.platform}`))
        .limit(1);
      
      if (existing.length > 0) {
        await db
          .update(systemSettings)
          .set({ 
            value: input.enabled ? "enabled" : "disabled",
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.key, `schedule_${input.platform}`));
      } else {
        await db.insert(systemSettings).values({
          key: `schedule_${input.platform}`,
          value: input.enabled ? "enabled" : "disabled",
        });
      }

      return { success: true };
    }),

  // Get scheduler status
  getSchedulerStatus: publicProcedure.query(() => {
    return getSchedulerStats();
  }),

  // Manually trigger scheduler run
  triggerScheduler: publicProcedure.mutation(async () => {
    await triggerSchedulerRun();
    return { 
      success: true, 
      message: "Scheduler run triggered",
      stats: getSchedulerStats(),
    };
  }),
});
