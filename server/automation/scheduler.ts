/**
 * Background Scheduler for 24/7 Marketing Attack
 * 
 * This module runs on a timer and:
 * 1. Processes scheduled posts (posts them to social platforms)
 * 2. Auto-generates new content when Attack mode is active
 * 3. Maintains a steady stream of organic content
 */

import { getDb } from "../db";
import { scheduledPosts, activityLog, platformConnections, systemSettings } from "../../drizzle/schema";
import { eq, lte, and, gte, sql } from "drizzle-orm";
import * as metaApi from "../integrations/meta";
import * as linkedInApi from "../integrations/linkedin";
import { invokeLLM, isOpenAIConfigured } from "../_core/openai";

// Scheduler configuration
const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_POSTS_PER_RUN = 10;
const AUTO_GENERATE_INTERVAL_HOURS = 6; // Generate new content every 6 hours

// Just Talk product info
const JUST_TALK_INFO = {
  name: "Just Talk",
  tagline: "Someone to talk to. Anytime you need it.",
  price: "$29/month",
  url: "https://just-talk.onrender.com",
  features: [
    "24/7 availability",
    "Unlimited conversations", 
    "No judgment",
    "AI-powered emotional support",
    "Instant access - no appointments",
    "Complete privacy"
  ]
};

const CONTENT_TOPICS = [
  "late night emotional support",
  "work stress and burnout",
  "feeling overwhelmed and anxious",
  "needing someone to listen without judgment",
  "24/7 availability when you need it most",
  "affordable alternative to expensive therapy",
  "processing difficult emotions",
  "finding peace of mind",
  "mental wellness on your schedule",
  "someone to talk to at 3 AM"
];

interface SchedulerStats {
  lastRun: Date | null;
  postsProcessed: number;
  postsSucceeded: number;
  postsFailed: number;
  contentGenerated: number;
  isRunning: boolean;
}

let schedulerStats: SchedulerStats = {
  lastRun: null,
  postsProcessed: 0,
  postsSucceeded: 0,
  postsFailed: 0,
  contentGenerated: 0,
  isRunning: false,
};

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Generate marketing content using OpenAI
 */
async function generateMarketingContent(platform: string, topic: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI not configured");
  }

  const prompt = `You are a marketing expert for Just Talk, a 24/7 AI emotional support service.

Product: ${JUST_TALK_INFO.name}
Price: ${JUST_TALK_INFO.price}
URL: ${JUST_TALK_INFO.url}
Features: ${JUST_TALK_INFO.features.join(", ")}

Platform: ${platform}
Topic: ${topic}

Create a single, authentic social media post that:
1. Does NOT make medical claims (we're emotional support, NOT therapy)
2. Speaks to people who feel alone, overwhelmed, or need someone to listen
3. Has a soft, empathetic call-to-action
4. Includes the URL naturally
5. Feels human and genuine, not salesy
6. Is appropriate for ${platform}

${platform === "linkedin" ? "Keep it professional but warm. Focus on mental wellness." : ""}
${platform === "facebook" ? "Can be more personal and story-driven." : ""}

Return JSON with:
- content: The post text with URL included
- hashtags: Array of 3-5 relevant hashtags (without # symbol)`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You create authentic, compliant social media content." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "social_post",
        strict: true,
        schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } }
          },
          required: ["content", "hashtags"],
          additionalProperties: false
        }
      }
    }
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.content + "\n\n" + result.hashtags.map((h: string) => `#${h}`).join(" ");
}

/**
 * Get credentials for a specific platform
 */
async function getPlatformCredentials(platform: "facebook" | "instagram" | "linkedin" | "tiktok"): Promise<{
  accessToken: string;
  pageId?: string;
  instagramAccountId?: string;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const accounts = await db
    .select()
    .from(platformConnections)
    .where(eq(platformConnections.platform, platform))
    .limit(1);

  if (accounts.length === 0) return null;

  const account = accounts[0];
  
  if (account.expiresAt && new Date() > account.expiresAt) {
    console.warn(`[Scheduler] ${platform} token expired`);
    return null;
  }

  return {
    accessToken: account.accessToken,
    pageId: account.pageId || undefined,
    instagramAccountId: (account.metadata as any)?.instagramAccountId || undefined,
  };
}

/**
 * Post to Facebook
 */
async function postToFacebook(content: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const creds = await getPlatformCredentials("facebook");
  if (!creds || !creds.pageId) {
    return { success: false, error: "Facebook not connected or page ID missing" };
  }

  try {
    const result = await metaApi.postToFacebook(creds.accessToken, creds.pageId, content);
    if ("error" in result) {
      return { success: false, error: result.error };
    }
    return { success: true, postId: result.postId };
  } catch (error) {
    return { success: false, error: `Facebook post failed: ${error}` };
  }
}

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(content: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const creds = await getPlatformCredentials("linkedin");
  if (!creds) {
    return { success: false, error: "LinkedIn not connected" };
  }

  try {
    const profileResult = await linkedInApi.getProfile(creds.accessToken);
    if ("error" in profileResult) {
      return { success: false, error: profileResult.error };
    }

    const authorUrn = `urn:li:person:${profileResult.id}`;
    const result = await linkedInApi.postToLinkedIn(creds.accessToken, authorUrn, content);
    
    if ("error" in result) {
      return { success: false, error: result.error };
    }
    return { success: true, postId: result.postId };
  } catch (error) {
    return { success: false, error: `LinkedIn post failed: ${error}` };
  }
}

/**
 * Process a scheduled post
 */
async function processPost(post: any): Promise<{ success: boolean; error?: string }> {
  const platforms: string[] = post.platforms || [];
  const content = post.content;

  console.log(`[Scheduler] Processing post ${post.id} for: ${platforms.join(", ")}`);

  let anySuccess = false;
  const errors: string[] = [];

  for (const platform of platforms) {
    let result: { success: boolean; error?: string };
    
    switch (platform.toLowerCase()) {
      case "facebook":
        result = await postToFacebook(content);
        break;
      case "linkedin":
        result = await postToLinkedIn(content);
        break;
      default:
        result = { success: false, error: `Unknown platform: ${platform}` };
    }

    if (result.success) {
      anySuccess = true;
      console.log(`[Scheduler] ✅ Posted to ${platform}`);
    } else {
      errors.push(`${platform}: ${result.error}`);
      console.log(`[Scheduler] ❌ ${platform}: ${result.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: anySuccess,
    error: anySuccess ? undefined : errors.join("; "),
  };
}

/**
 * Check if Attack mode is active
 */
async function isAttackModeActive(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const settings = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "attack_mode"))
    .limit(1);

  return settings.length > 0 && settings[0].value === "active";
}

/**
 * Auto-generate content when Attack mode is active
 */
async function autoGenerateContent(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if we need to generate new content
  const lastGeneration = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.action, "auto_content_generated"))
    .orderBy(sql`${activityLog.createdAt} DESC`)
    .limit(1);

  const hoursAgo = AUTO_GENERATE_INTERVAL_HOURS;
  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  if (lastGeneration.length > 0 && lastGeneration[0].createdAt > cutoffTime) {
    console.log("[Scheduler] Content generated recently, skipping auto-generation");
    return;
  }

  // Check if OpenAI is configured
  if (!isOpenAIConfigured()) {
    console.log("[Scheduler] OpenAI not configured, skipping auto-generation");
    return;
  }

  console.log("[Scheduler] Auto-generating content...");

  try {
    // Generate for Facebook and LinkedIn
    const platforms = ["facebook", "linkedin"];
    const topic = CONTENT_TOPICS[Math.floor(Math.random() * CONTENT_TOPICS.length)];

    for (const platform of platforms) {
      try {
        const content = await generateMarketingContent(platform, topic);
        
        // Schedule for 2 hours from now
        const scheduledTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        await db.insert(scheduledPosts).values({
          userId: 1,
          content,
          platforms: [platform],
          status: "scheduled",
          scheduledTime,
        });

        schedulerStats.contentGenerated++;
        console.log(`[Scheduler] ✅ Generated ${platform} post for ${scheduledTime.toISOString()}`);
      } catch (error) {
        console.error(`[Scheduler] Failed to generate ${platform} content:`, error);
      }
    }

    await db.insert(activityLog).values({
      action: "auto_content_generated",
      details: `Auto-generated content for ${platforms.join(", ")}`,
    });

  } catch (error) {
    console.error("[Scheduler] Auto-generation error:", error);
  }
}

/**
 * Main scheduler run
 */
async function runScheduler(): Promise<void> {
  if (schedulerStats.isRunning) {
    console.log("[Scheduler] Already running, skipping");
    return;
  }

  schedulerStats.isRunning = true;
  schedulerStats.lastRun = new Date();

  console.log(`[Scheduler] Starting run at ${schedulerStats.lastRun.toISOString()}`);

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Scheduler] Database not available");
      return;
    }

    // Check if attack mode is active
    const attackActive = await isAttackModeActive();
    if (!attackActive) {
      console.log("[Scheduler] Attack mode not active, skipping");
      return;
    }

    console.log("[Scheduler] 🔥 Attack mode ACTIVE");

    // Step 1: Auto-generate content if needed
    await autoGenerateContent();

    // Step 2: Process scheduled posts that are due
    const now = new Date();
    const duePosts = await db
      .select()
      .from(scheduledPosts)
      .where(and(
        eq(scheduledPosts.status, "scheduled"),
        lte(scheduledPosts.scheduledTime, now)
      ))
      .limit(MAX_POSTS_PER_RUN);

    console.log(`[Scheduler] Found ${duePosts.length} posts to process`);

    for (const post of duePosts) {
      schedulerStats.postsProcessed++;

      const result = await processPost(post);

      if (result.success) {
        schedulerStats.postsSucceeded++;
        
        await db
          .update(scheduledPosts)
          .set({
            status: "posted",
            updatedAt: new Date(),
          })
          .where(eq(scheduledPosts.id, post.id));

        await db.insert(activityLog).values({
          action: "post_published",
          details: `Posted to ${(post.platforms as string[]).join(", ")}: "${post.content?.substring(0, 50)}..."`,
        });

      } else {
        schedulerStats.postsFailed++;

        await db
          .update(scheduledPosts)
          .set({
            status: "failed",
            updatedAt: new Date(),
          })
          .where(eq(scheduledPosts.id, post.id));

        await db.insert(activityLog).values({
          action: "post_failed",
          details: `Failed: ${result.error}`,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error("[Scheduler] Error:", error);
    
    const db = await getDb();
    if (db) {
      await db.insert(activityLog).values({
        action: "scheduler_error",
        details: `Error: ${error}`,
      });
    }
  } finally {
    schedulerStats.isRunning = false;
    console.log(`[Scheduler] Run complete. Processed: ${schedulerStats.postsProcessed}, Succeeded: ${schedulerStats.postsSucceeded}, Failed: ${schedulerStats.postsFailed}, Generated: ${schedulerStats.contentGenerated}`);
  }
}

/**
 * Start the background scheduler
 */
export function startScheduler(): void {
  if (schedulerInterval) {
    console.log("[Scheduler] Already started");
    return;
  }

  console.log(`[Scheduler] Starting with ${SCHEDULER_INTERVAL_MS / 1000}s interval`);
  
  // Run immediately
  runScheduler();

  // Then run on interval
  schedulerInterval = setInterval(runScheduler, SCHEDULER_INTERVAL_MS);

  console.log("[Scheduler] ✅ Background scheduler started");
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}

/**
 * Get scheduler stats
 */
export function getSchedulerStats(): SchedulerStats {
  return { ...schedulerStats };
}

/**
 * Manually trigger a run
 */
export async function triggerSchedulerRun(): Promise<void> {
  await runScheduler();
}

export const scheduler = {
  start: startScheduler,
  stop: stopScheduler,
  getStats: getSchedulerStats,
  trigger: triggerSchedulerRun,
};
