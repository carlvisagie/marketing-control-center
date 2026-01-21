/**
 * Unified Social Posting Engine
 * Routes posts to all connected platforms with scheduling and queue management
 */

import { metaApi } from "./meta";
import { linkedInApi } from "./linkedin";

export type Platform = "facebook" | "instagram" | "linkedin" | "tiktok";

export interface PlatformCredentials {
  platform: Platform;
  accessToken: string;
  pageId?: string; // Facebook page ID
  instagramAccountId?: string; // Instagram business account ID
  personUrn?: string; // LinkedIn person URN
  organizationUrn?: string; // LinkedIn organization URN
  expiresAt?: Date;
}

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: Platform[];
  mediaUrls?: string[];
  scheduledTime?: Date;
  status: "pending" | "scheduled" | "posted" | "failed" | "cancelled";
  results?: PostResult[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PostResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  error?: string;
  postedAt?: Date;
}

export interface PostRequest {
  content: string;
  platforms: Platform[];
  mediaUrls?: string[];
  scheduledTime?: Date;
  link?: string;
}

/**
 * Post to multiple platforms simultaneously
 */
export async function postToAllPlatforms(
  request: PostRequest,
  credentials: PlatformCredentials[]
): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const platform of request.platforms) {
    const creds = credentials.find((c) => c.platform === platform);
    
    if (!creds) {
      results.push({
        platform,
        success: false,
        error: `No credentials found for ${platform}`,
      });
      continue;
    }

    try {
      let result: PostResult;

      switch (platform) {
        case "facebook":
          if (!creds.pageId) {
            result = { platform, success: false, error: "No Facebook page ID configured" };
          } else {
            const fbResult = await metaApi.postToFacebook(
              creds.accessToken,
              creds.pageId,
              request.content,
              {
                imageUrl: request.mediaUrls?.[0],
                link: request.link,
                scheduledTime: request.scheduledTime,
              }
            );
            result = {
              platform,
              success: fbResult.success,
              postId: fbResult.postId,
              error: fbResult.error,
              postedAt: fbResult.success ? new Date() : undefined,
            };
          }
          break;

        case "instagram":
          if (!creds.instagramAccountId) {
            result = { platform, success: false, error: "No Instagram account ID configured" };
          } else if (!request.mediaUrls?.[0]) {
            result = { platform, success: false, error: "Instagram requires an image" };
          } else {
            const igResult = await metaApi.postToInstagram(
              creds.accessToken,
              creds.instagramAccountId,
              request.content,
              request.mediaUrls[0]
            );
            result = {
              platform,
              success: igResult.success,
              postId: igResult.postId,
              error: igResult.error,
              postedAt: igResult.success ? new Date() : undefined,
            };
          }
          break;

        case "linkedin":
          const authorUrn = creds.organizationUrn || creds.personUrn;
          if (!authorUrn) {
            result = { platform, success: false, error: "No LinkedIn author URN configured" };
          } else {
            const liResult = await linkedInApi.postToLinkedIn(
              creds.accessToken,
              authorUrn,
              request.content,
              {
                imageUrl: request.mediaUrls?.[0],
                articleUrl: request.link,
              }
            );
            result = {
              platform,
              success: liResult.success,
              postId: liResult.postId,
              error: liResult.error,
              postedAt: liResult.success ? new Date() : undefined,
            };
          }
          break;

        case "tiktok":
          // TikTok requires manual posting via send-to-phone
          result = {
            platform,
            success: false,
            error: "TikTok requires manual posting. Use send-to-phone feature.",
          };
          break;

        default:
          result = { platform, success: false, error: `Unknown platform: ${platform}` };
      }

      results.push(result);
    } catch (error) {
      results.push({
        platform,
        success: false,
        error: `Unexpected error: ${error}`,
      });
    }
  }

  return results;
}

/**
 * Get analytics from all connected platforms
 */
export async function getAggregatedAnalytics(
  credentials: PlatformCredentials[]
): Promise<Record<Platform, Record<string, number>>> {
  const analytics: Record<Platform, Record<string, number>> = {
    facebook: {},
    instagram: {},
    linkedin: {},
    tiktok: {},
  };

  for (const creds of credentials) {
    try {
      switch (creds.platform) {
        case "facebook":
          if (creds.pageId) {
            const fbInsights = await metaApi.getFacebookInsights(
              creds.accessToken,
              creds.pageId
            );
            if ("insights" in fbInsights) {
              analytics.facebook = fbInsights.insights;
            }
          }
          break;

        case "instagram":
          if (creds.instagramAccountId) {
            const igInsights = await metaApi.getInstagramInsights(
              creds.accessToken,
              creds.instagramAccountId
            );
            if ("insights" in igInsights) {
              analytics.instagram = igInsights.insights;
            }
          }
          break;

        case "linkedin":
          if (creds.organizationUrn) {
            const liFollowers = await linkedInApi.getOrganizationFollowers(
              creds.accessToken,
              creds.organizationUrn
            );
            if ("followers" in liFollowers) {
              analytics.linkedin = { followers: liFollowers.followers };
            }
          }
          break;

        case "tiktok":
          // TikTok analytics would require separate API integration
          analytics.tiktok = { note: 0 }; // Placeholder
          break;
      }
    } catch (error) {
      console.error(`Failed to get analytics for ${creds.platform}:`, error);
    }
  }

  return analytics;
}

/**
 * Check if credentials are still valid
 */
export function areCredentialsValid(creds: PlatformCredentials): boolean {
  if (!creds.expiresAt) return true; // No expiry set
  return new Date() < creds.expiresAt;
}

/**
 * Get platforms that need token refresh
 */
export function getPlatformsNeedingRefresh(
  credentials: PlatformCredentials[],
  daysBeforeExpiry: number = 7
): Platform[] {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysBeforeExpiry);

  return credentials
    .filter((c) => c.expiresAt && c.expiresAt < threshold)
    .map((c) => c.platform);
}

/**
 * Generate content variations for different platforms
 */
export function adaptContentForPlatform(
  content: string,
  platform: Platform,
  hashtags?: string[]
): string {
  const hashtagString = hashtags?.length ? `\n\n${hashtags.map((h) => `#${h}`).join(" ")}` : "";

  switch (platform) {
    case "facebook":
      // Facebook: Longer form, conversational
      return content + hashtagString;

    case "instagram":
      // Instagram: Visual focus, more hashtags (up to 30)
      const igHashtags = hashtags?.slice(0, 30) || [];
      return content + (igHashtags.length ? `\n\n${igHashtags.map((h) => `#${h}`).join(" ")}` : "");

    case "linkedin":
      // LinkedIn: Professional tone, fewer hashtags (3-5)
      const liHashtags = hashtags?.slice(0, 5) || [];
      return content + (liHashtags.length ? `\n\n${liHashtags.map((h) => `#${h}`).join(" ")}` : "");

    case "tiktok":
      // TikTok: Short, punchy, trending hashtags
      const ttHashtags = hashtags?.slice(0, 10) || [];
      return content + (ttHashtags.length ? ` ${ttHashtags.map((h) => `#${h}`).join(" ")}` : "");

    default:
      return content + hashtagString;
  }
}

/**
 * Calculate optimal posting times for each platform
 */
export function getOptimalPostingTimes(platform: Platform): { hour: number; day: string }[] {
  // Based on general social media best practices
  const times: Record<Platform, { hour: number; day: string }[]> = {
    facebook: [
      { hour: 9, day: "Wednesday" },
      { hour: 13, day: "Thursday" },
      { hour: 11, day: "Friday" },
    ],
    instagram: [
      { hour: 11, day: "Wednesday" },
      { hour: 10, day: "Friday" },
      { hour: 10, day: "Tuesday" },
    ],
    linkedin: [
      { hour: 10, day: "Tuesday" },
      { hour: 10, day: "Wednesday" },
      { hour: 12, day: "Thursday" },
    ],
    tiktok: [
      { hour: 19, day: "Tuesday" },
      { hour: 12, day: "Thursday" },
      { hour: 17, day: "Friday" },
    ],
  };

  return times[platform] || [];
}

export const socialEngine = {
  postToAllPlatforms,
  getAggregatedAnalytics,
  areCredentialsValid,
  getPlatformsNeedingRefresh,
  adaptContentForPlatform,
  getOptimalPostingTimes,
};
