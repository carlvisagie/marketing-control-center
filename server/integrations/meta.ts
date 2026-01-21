/**
 * Meta Graph API Integration
 * Handles Facebook Pages and Instagram Business posting
 */

const GRAPH_API_VERSION = "v19.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface MetaConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  pageId?: string;
  instagramAccountId?: string;
}

interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
  platform: "facebook" | "instagram";
}

interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

/**
 * Get long-lived page access token from short-lived user token
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ accessToken: string; expiresIn: number } | { error: string }> {
  try {
    const url = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", shortLivedToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000, // ~60 days
    };
  } catch (error) {
    return { error: `Token exchange failed: ${error}` };
  }
}

/**
 * Get page access token from user access token
 */
export async function getPageAccessToken(
  userAccessToken: string,
  pageId: string
): Promise<{ accessToken: string } | { error: string }> {
  try {
    const url = `${GRAPH_API_BASE}/${pageId}?fields=access_token&access_token=${userAccessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    return { accessToken: data.access_token };
  } catch (error) {
    return { error: `Failed to get page token: ${error}` };
  }
}

/**
 * Get Instagram Business Account ID linked to a Facebook Page
 */
export async function getInstagramAccountId(
  pageAccessToken: string,
  pageId: string
): Promise<{ instagramAccountId: string } | { error: string }> {
  try {
    const url = `${GRAPH_API_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    if (!data.instagram_business_account) {
      return { error: "No Instagram Business Account linked to this page" };
    }

    return { instagramAccountId: data.instagram_business_account.id };
  } catch (error) {
    return { error: `Failed to get Instagram account: ${error}` };
  }
}

/**
 * Get list of Facebook Pages the user manages
 */
export async function getUserPages(
  userAccessToken: string
): Promise<{ pages: Array<{ id: string; name: string; accessToken: string }> } | { error: string }> {
  try {
    const url = `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    return {
      pages: data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
      })),
    };
  } catch (error) {
    return { error: `Failed to get pages: ${error}` };
  }
}

/**
 * Post to Facebook Page
 */
export async function postToFacebook(
  pageAccessToken: string,
  pageId: string,
  message: string,
  options?: {
    link?: string;
    imageUrl?: string;
    scheduledTime?: Date;
  }
): Promise<PostResult> {
  try {
    let endpoint = `${GRAPH_API_BASE}/${pageId}/feed`;
    const body: Record<string, string> = {
      message,
      access_token: pageAccessToken,
    };

    // If posting with image, use photos endpoint
    if (options?.imageUrl) {
      endpoint = `${GRAPH_API_BASE}/${pageId}/photos`;
      body.url = options.imageUrl;
      body.caption = message;
      delete body.message;
    }

    // Add link if provided
    if (options?.link && !options?.imageUrl) {
      body.link = options.link;
    }

    // Schedule for future if provided
    if (options?.scheduledTime) {
      body.published = "false";
      body.scheduled_publish_time = Math.floor(options.scheduledTime.getTime() / 1000).toString();
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body),
    });

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        platform: "facebook",
      };
    }

    return {
      success: true,
      postId: data.id || data.post_id,
      platform: "facebook",
    };
  } catch (error) {
    return {
      success: false,
      error: `Facebook post failed: ${error}`,
      platform: "facebook",
    };
  }
}

/**
 * Post to Instagram (requires container creation workflow)
 */
export async function postToInstagram(
  pageAccessToken: string,
  instagramAccountId: string,
  caption: string,
  imageUrl: string,
  options?: {
    scheduledTime?: Date;
  }
): Promise<PostResult> {
  try {
    // Step 1: Create media container
    const containerUrl = `${GRAPH_API_BASE}/${instagramAccountId}/media`;
    const containerBody = new URLSearchParams({
      image_url: imageUrl,
      caption,
      access_token: pageAccessToken,
    });

    const containerResponse = await fetch(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerBody,
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      return {
        success: false,
        error: containerData.error.message,
        platform: "instagram",
      };
    }

    const containerId = containerData.id;

    // Step 2: Wait for container to be ready (poll status)
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const statusUrl = `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${pageAccessToken}`;
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();
      
      if (statusData.status_code === "FINISHED") {
        ready = true;
      } else if (statusData.status_code === "ERROR") {
        return {
          success: false,
          error: "Media container creation failed",
          platform: "instagram",
        };
      }
      attempts++;
    }

    if (!ready) {
      return {
        success: false,
        error: "Media container not ready after timeout",
        platform: "instagram",
      };
    }

    // Step 3: Publish the container
    const publishUrl = `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`;
    const publishBody = new URLSearchParams({
      creation_id: containerId,
      access_token: pageAccessToken,
    });

    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishBody,
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      return {
        success: false,
        error: publishData.error.message,
        platform: "instagram",
      };
    }

    return {
      success: true,
      postId: publishData.id,
      platform: "instagram",
    };
  } catch (error) {
    return {
      success: false,
      error: `Instagram post failed: ${error}`,
      platform: "instagram",
    };
  }
}

/**
 * Post Instagram Reel (video)
 */
export async function postInstagramReel(
  pageAccessToken: string,
  instagramAccountId: string,
  caption: string,
  videoUrl: string
): Promise<PostResult> {
  try {
    // Step 1: Create video container
    const containerUrl = `${GRAPH_API_BASE}/${instagramAccountId}/media`;
    const containerBody = new URLSearchParams({
      video_url: videoUrl,
      caption,
      media_type: "REELS",
      access_token: pageAccessToken,
    });

    const containerResponse = await fetch(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: containerBody,
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      return {
        success: false,
        error: containerData.error.message,
        platform: "instagram",
      };
    }

    const containerId = containerData.id;

    // Step 2: Poll for video processing completion
    let ready = false;
    let attempts = 0;
    while (!ready && attempts < 30) { // Videos take longer
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      const statusUrl = `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${pageAccessToken}`;
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();
      
      if (statusData.status_code === "FINISHED") {
        ready = true;
      } else if (statusData.status_code === "ERROR") {
        return {
          success: false,
          error: "Video processing failed",
          platform: "instagram",
        };
      }
      attempts++;
    }

    if (!ready) {
      return {
        success: false,
        error: "Video processing timeout",
        platform: "instagram",
      };
    }

    // Step 3: Publish
    const publishUrl = `${GRAPH_API_BASE}/${instagramAccountId}/media_publish`;
    const publishBody = new URLSearchParams({
      creation_id: containerId,
      access_token: pageAccessToken,
    });

    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishBody,
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      return {
        success: false,
        error: publishData.error.message,
        platform: "instagram",
      };
    }

    return {
      success: true,
      postId: publishData.id,
      platform: "instagram",
    };
  } catch (error) {
    return {
      success: false,
      error: `Instagram Reel post failed: ${error}`,
      platform: "instagram",
    };
  }
}

/**
 * Get Facebook Page insights/analytics
 */
export async function getFacebookInsights(
  pageAccessToken: string,
  pageId: string,
  metrics: string[] = ["page_impressions", "page_engaged_users", "page_post_engagements"],
  period: "day" | "week" | "days_28" = "day"
): Promise<{ insights: Record<string, number> } | { error: string }> {
  try {
    const url = `${GRAPH_API_BASE}/${pageId}/insights?metric=${metrics.join(",")}&period=${period}&access_token=${pageAccessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    const insights: Record<string, number> = {};
    for (const metric of data.data || []) {
      const latestValue = metric.values?.[metric.values.length - 1]?.value || 0;
      insights[metric.name] = latestValue;
    }

    return { insights };
  } catch (error) {
    return { error: `Failed to get insights: ${error}` };
  }
}

/**
 * Get Instagram insights/analytics
 */
export async function getInstagramInsights(
  pageAccessToken: string,
  instagramAccountId: string,
  metrics: string[] = ["impressions", "reach", "profile_views"],
  period: "day" | "week" | "days_28" = "day"
): Promise<{ insights: Record<string, number> } | { error: string }> {
  try {
    const url = `${GRAPH_API_BASE}/${instagramAccountId}/insights?metric=${metrics.join(",")}&period=${period}&access_token=${pageAccessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    const insights: Record<string, number> = {};
    for (const metric of data.data || []) {
      const latestValue = metric.values?.[metric.values.length - 1]?.value || 0;
      insights[metric.name] = latestValue;
    }

    return { insights };
  } catch (error) {
    return { error: `Failed to get Instagram insights: ${error}` };
  }
}

/**
 * Verify webhook signature from Meta
 */
export function verifyWebhookSignature(
  signature: string,
  payload: string,
  appSecret: string
): boolean {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");
  return `sha256=${expectedSignature}` === signature;
}

export const metaApi = {
  exchangeForLongLivedToken,
  getPageAccessToken,
  getInstagramAccountId,
  getUserPages,
  postToFacebook,
  postToInstagram,
  postInstagramReel,
  getFacebookInsights,
  getInstagramInsights,
  verifyWebhookSignature,
};
