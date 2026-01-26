/**
 * Background Scheduler for 24/7 Marketing Attack
 * 
 * This module runs on a timer and processes scheduled posts,
 * posting them to the appropriate social platforms.
 */

import { getDb } from "../db";
import { scheduledPosts, activityLog, socialAccounts, systemSettings } from "../../drizzle/schema";
import { eq, lte, and } from "drizzle-orm";
import * as metaApi from "../integrations/meta";
import * as linkedInApi from "../integrations/linkedin";

// Scheduler configuration
const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_POSTS_PER_RUN = 10; // Prevent overwhelming APIs

interface SchedulerStats {
  lastRun: Date | null;
  postsProcessed: number;
  postsSucceeded: number;
  postsFailed: number;
  isRunning: boolean;
}

// Global scheduler state
let schedulerStats: SchedulerStats = {
  lastRun: null,
  postsProcessed: 0,
  postsSucceeded: 0,
  postsFailed: 0,
  isRunning: false,
};

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Get credentials for a specific platform from the database
 */
async function getPlatformCredentials(platform: string): Promise<{
  accessToken: string;
  pageId?: string;
  instagramAccountId?: string;
  organizationUrn?: string;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(and(
      eq(socialAccounts.platform, platform),
      eq(socialAccounts.isActive, true)
    ))
    .limit(1);

  if (accounts.length === 0) return null;

  const account = accounts[0];
  
  // Check if token is expired
  if (account.tokenExpiresAt && new Date() > account.tokenExpiresAt) {
    console.warn(`[Scheduler] ${platform} token expired, needs refresh`);
    return null;
  }

  return {
    accessToken: account.accessToken,
    pageId: account.platformUserId || undefined,
    instagramAccountId: account.metadata?.instagramAccountId || undefined,
    organizationUrn: account.metadata?.organizationUrn || undefined,
  };
}

/**
 * Post content to Facebook
 */
async function postToFacebook(content: string, mediaUrl?: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const creds = await getPlatformCredentials("facebook");
  if (!creds || !creds.pageId) {
    return { success: false, error: "Facebook not connected or page ID missing" };
  }

  try {
    if (mediaUrl) {
      const result = await metaApi.postToFacebookWithImage(
        creds.accessToken,
        creds.pageId,
        content,
        mediaUrl
      );
      if ("error" in result) {
        return { success: false, error: result.error };
      }
      return { success: true, postId: result.postId };
    } else {
      const result = await metaApi.postToFacebook(
        creds.accessToken,
        creds.pageId,
        content
      );
      if ("error" in result) {
        return { success: false, error: result.error };
      }
      return { success: true, postId: result.postId };
    }
  } catch (error) {
    return { success: false, error: `Facebook post failed: ${error}` };
  }
}

/**
 * Post content to Instagram
 */
async function postToInstagram(content: string, mediaUrl: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const creds = await getPlatformCredentials("instagram");
  if (!creds || !creds.instagramAccountId) {
    return { success: false, error: "Instagram not connected or account ID missing" };
  }

  try {
    const result = await metaApi.postToInstagram(
      creds.accessToken,
      creds.instagramAccountId,
      mediaUrl,
      content
    );
    if ("error" in result) {
      return { success: false, error: result.error };
    }
    return { success: true, postId: result.postId };
  } catch (error) {
    return { success: false, error: `Instagram post failed: ${error}` };
  }
}

/**
 * Post content to LinkedIn
 */
async function postToLinkedIn(content: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const creds = await getPlatformCredentials("linkedin");
  if (!creds) {
    return { success: false, error: "LinkedIn not connected" };
  }

  try {
    // Get user URN first
    const profileResult = await linkedInApi.getProfile(creds.accessToken);
    if ("error" in profileResult) {
      return { success: false, error: profileResult.error };
    }

    const authorUrn = creds.organizationUrn || `urn:li:person:${profileResult.sub}`;
    
    const result = await linkedInApi.createTextPost(
      creds.accessToken,
      authorUrn,
      content
    );
    
    if ("error" in result) {
      return { success: false, error: result.error };
    }
    return { success: true, postId: result.postUrn };
  } catch (error) {
    return { success: false, error: `LinkedIn post failed: ${error}` };
  }
}

/**
 * Process a single scheduled post (may have multiple platforms)
 */
async function processPost(post: any): Promise<{ success: boolean; error?: string; results?: any[] }> {
  const platforms: string[] = post.platforms || [];
  const content = post.content;
  const mediaUrls: string[] = post.mediaUrls || [];
  const mediaUrl = mediaUrls[0]; // Use first media URL if available

  console.log(`[Scheduler] Processing post ${post.id} for platforms: ${platforms.join(", ")}`);

  const results: { platform: string; success: boolean; error?: string }[] = [];
  let anySuccess = false;

  for (const platform of platforms) {
    let result: { success: boolean; error?: string };
    
    switch (platform.toLowerCase()) {
      case "facebook":
        result = await postToFacebook(content, mediaUrl);
        break;
      case "instagram":
        if (!mediaUrl) {
          result = { success: false, error: "Instagram requires media URL" };
        } else {
          result = await postToInstagram(content, mediaUrl);
        }
        break;
      case "linkedin":
        result = await postToLinkedIn(content);
        break;
      case "tiktok":
        // TikTok requires manual posting via phone
        result = { success: false, error: "TikTok requires manual posting - sent to phone" };
        break;
      default:
        result = { success: false, error: `Unknown platform: ${platform}` };
    }

    results.push({ platform, ...result });
    if (result.success) anySuccess = true;

    // Small delay between platforms
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    success: anySuccess,
    error: anySuccess ? undefined : results.map(r => `${r.platform}: ${r.error}`).join("; "),
    results,
  };
}

/**
 * Check if 24/7 Attack mode is active
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
 * Main scheduler run - processes all due posts
 */
async function runScheduler(): Promise<void> {
  if (schedulerStats.isRunning) {
    console.log("[Scheduler] Already running, skipping this cycle");
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

    // Get posts that are scheduled and due
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
        
        // Update post status to posted
        await db
          .update(scheduledPosts)
          .set({
            status: "posted",
            postedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(scheduledPosts.id, post.id));

        // Log success
        await db.insert(activityLog).values({
          action: "post_published",
          details: `Successfully posted to ${post.platform}: ${post.content?.substring(0, 50)}...`,
        });

        console.log(`[Scheduler] ✅ Post ${post.id} published to ${post.platform}`);
      } else {
        schedulerStats.postsFailed++;

        // Update post status to failed
        await db
          .update(scheduledPosts)
          .set({
            status: "failed",
            errorMessage: result.error,
            updatedAt: new Date(),
          })
          .where(eq(scheduledPosts.id, post.id));

        // Log failure
        await db.insert(activityLog).values({
          action: "post_failed",
          details: `Failed to post to ${post.platform}: ${result.error}`,
        });

        console.log(`[Scheduler] ❌ Post ${post.id} failed: ${result.error}`);
      }

      // Small delay between posts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error("[Scheduler] Error during run:", error);
    
    const db = await getDb();
    if (db) {
      await db.insert(activityLog).values({
        action: "scheduler_error",
        details: `Scheduler error: ${error}`,
      });
    }
  } finally {
    schedulerStats.isRunning = false;
    console.log(`[Scheduler] Run complete. Processed: ${schedulerStats.postsProcessed}, Succeeded: ${schedulerStats.postsSucceeded}, Failed: ${schedulerStats.postsFailed}`);
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
  
  // Run immediately on start
  runScheduler();

  // Then run on interval
  schedulerInterval = setInterval(runScheduler, SCHEDULER_INTERVAL_MS);

  console.log("[Scheduler] ✅ Background scheduler started");
}

/**
 * Stop the background scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}

/**
 * Get scheduler statistics
 */
export function getSchedulerStats(): SchedulerStats {
  return { ...schedulerStats };
}

/**
 * Manually trigger a scheduler run
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
