/**
 * Command Execution Router
 * 
 * REAL command execution - no fake delays, no simulations.
 * Actually generates content with OpenAI and posts to social media.
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { scheduledPosts, activityLog, platformConnections, systemSettings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM, isOpenAIConfigured } from "../_core/openai";
import * as metaApi from "../integrations/meta";
import * as linkedInApi from "../integrations/linkedin";

// Just Talk product info for content generation
const JUST_TALK_INFO = {
  name: "Just Talk",
  tagline: "Someone to talk to. Anytime you need it.",
  price: "$29/month",
  features: [
    "24/7 availability",
    "Unlimited conversations",
    "No judgment",
    "AI-powered emotional support",
    "Instant access - no appointments",
    "Complete privacy"
  ],
  url: "https://just-talk.onrender.com",
  targetAudience: "People who need someone to talk to at 3 AM, those who can't afford therapy, anyone feeling overwhelmed"
};

/**
 * Generate marketing content using OpenAI
 */
async function generateMarketingContent(
  platform: string,
  topic?: string
): Promise<{ content: string; hashtags: string[] }> {
  
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
  }

  const prompt = `You are a marketing expert for Just Talk, a 24/7 AI emotional support service.

Product: ${JUST_TALK_INFO.name}
Price: ${JUST_TALK_INFO.price}
URL: ${JUST_TALK_INFO.url}
Key Features: ${JUST_TALK_INFO.features.join(", ")}

Platform: ${platform}
${topic ? `Topic/Theme: ${topic}` : ""}

Create a single, authentic social media post that:
1. Does NOT make medical claims (we're emotional support, NOT therapy)
2. Speaks to people who feel alone, overwhelmed, or need someone to listen
3. Has a soft, empathetic call-to-action
4. Is appropriate for ${platform}
5. Feels human and genuine, not salesy

${platform === "linkedin" ? "Keep it professional but warm. Focus on mental wellness in the workplace." : ""}
${platform === "facebook" ? "Can be more personal and story-driven." : ""}

IMPORTANT: Do NOT use phrases like "mental health treatment" or "therapy replacement". We are emotional support and companionship.

Return JSON with:
- content: The post text (include the URL naturally)
- hashtags: Array of 3-5 relevant hashtags (without # symbol)`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You create authentic, compliant social media content for emotional wellness services." },
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
            content: { type: "string", description: "The post content" },
            hashtags: { 
              type: "array", 
              items: { type: "string" },
              description: "Relevant hashtags without # symbol"
            }
          },
          required: ["content", "hashtags"],
          additionalProperties: false
        }
      }
    }
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result;
}

/**
 * Post to Facebook immediately
 */
async function postToFacebookNow(content: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get Facebook credentials
  const fbAccounts = await db
    .select()
    .from(platformConnections)
    .where(eq(platformConnections.platform, "facebook"))
    .limit(1);

  if (fbAccounts.length === 0) {
    return { success: false, error: "Facebook not connected. Go to Settings to connect your Facebook page." };
  }

  const fb = fbAccounts[0];
  
  if (!fb.pageId) {
    return { success: false, error: "Facebook Page ID not set. Reconnect your Facebook page." };
  }

  // Check token expiry
  if (fb.expiresAt && new Date() > fb.expiresAt) {
    return { success: false, error: "Facebook token expired. Please reconnect your Facebook page." };
  }

  try {
    const result = await metaApi.postToFacebook(
      fb.accessToken,
      fb.pageId,
      content
    );

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    return { success: true, postId: result.postId };
  } catch (error) {
    return { success: false, error: `Facebook post failed: ${error}` };
  }
}

/**
 * Post to LinkedIn immediately
 */
async function postToLinkedInNow(content: string): Promise<{ success: boolean; postId?: string; error?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get LinkedIn credentials
  const liAccounts = await db
    .select()
    .from(platformConnections)
    .where(eq(platformConnections.platform, "linkedin"))
    .limit(1);

  if (liAccounts.length === 0) {
    return { success: false, error: "LinkedIn not connected. Go to Settings to connect your LinkedIn." };
  }

  const li = liAccounts[0];

  try {
    // Get user profile to get the URN
    const profileResult = await linkedInApi.getProfile(li.accessToken);
    if ("error" in profileResult) {
      return { success: false, error: profileResult.error };
    }

    const authorUrn = `urn:li:person:${profileResult.id}`;
    
    const result = await linkedInApi.postToLinkedIn(
      li.accessToken,
      authorUrn,
      content
    );

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    return { success: true, postId: result.postId };
  } catch (error) {
    return { success: false, error: `LinkedIn post failed: ${error}` };
  }
}

export const commandsRouter = router({
  // Execute a command
  execute: publicProcedure
    .input(z.object({
      command: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const commandLower = input.command.toLowerCase();
      let result: { success: boolean; message: string; details?: any };

      try {
        // Parse command intent
        if (commandLower.includes("generate") && commandLower.includes("post")) {
          // Generate content command
          const platform = commandLower.includes("linkedin") ? "linkedin" : 
                          commandLower.includes("facebook") ? "facebook" : "facebook";
          
          const topic = input.command.replace(/generate|post|marketing|content|for|on|about|a/gi, "").trim();
          
          const generated = await generateMarketingContent(platform, topic || undefined);
          
          // Save to scheduled posts for review
          const [savedPost] = await db.insert(scheduledPosts).values({
            userId: 1, // Default user
            content: generated.content + "\n\n" + generated.hashtags.map(h => `#${h}`).join(" "),
            platforms: [platform],
            status: "pending",
            scheduledTime: new Date(),
          }).returning();

          // Log activity
          await db.insert(activityLog).values({
            action: "content_generated",
            details: `Generated ${platform} post: "${generated.content.substring(0, 50)}..."`,
          });

          result = {
            success: true,
            message: `Generated ${platform} post. Added to approval queue.`,
            details: {
              postId: savedPost.id,
              content: generated.content,
              hashtags: generated.hashtags,
              platform
            }
          };
        }
        else if (commandLower.includes("post") && (commandLower.includes("facebook") || commandLower.includes("fb"))) {
          // Post to Facebook now
          const topic = input.command.replace(/post|to|facebook|fb|about|on/gi, "").trim();
          const generated = await generateMarketingContent("facebook", topic || undefined);
          const fullContent = generated.content + "\n\n" + generated.hashtags.map(h => `#${h}`).join(" ");
          
          const postResult = await postToFacebookNow(fullContent);
          
          if (postResult.success) {
            await db.insert(activityLog).values({
              action: "post_published",
              details: `Posted to Facebook: "${generated.content.substring(0, 50)}..."`,
              metadata: { postId: postResult.postId }
            });
          }

          result = {
            success: postResult.success,
            message: postResult.success 
              ? `✅ Posted to Facebook! Post ID: ${postResult.postId}`
              : `❌ Facebook post failed: ${postResult.error}`,
            details: postResult
          };
        }
        else if (commandLower.includes("post") && commandLower.includes("linkedin")) {
          // Post to LinkedIn now
          const topic = input.command.replace(/post|to|linkedin|about|on/gi, "").trim();
          const generated = await generateMarketingContent("linkedin", topic || undefined);
          const fullContent = generated.content + "\n\n" + generated.hashtags.map(h => `#${h}`).join(" ");
          
          const postResult = await postToLinkedInNow(fullContent);
          
          if (postResult.success) {
            await db.insert(activityLog).values({
              action: "post_published",
              details: `Posted to LinkedIn: "${generated.content.substring(0, 50)}..."`,
              metadata: { postId: postResult.postId }
            });
          }

          result = {
            success: postResult.success,
            message: postResult.success 
              ? `✅ Posted to LinkedIn! Post ID: ${postResult.postId}`
              : `❌ LinkedIn post failed: ${postResult.error}`,
            details: postResult
          };
        }
        else if (commandLower.includes("post") && commandLower.includes("all")) {
          // Post to all platforms
          const topic = input.command.replace(/post|to|all|platforms|about|on/gi, "").trim();
          
          const fbContent = await generateMarketingContent("facebook", topic || undefined);
          const liContent = await generateMarketingContent("linkedin", topic || undefined);
          
          const fbResult = await postToFacebookNow(fbContent.content + "\n\n" + fbContent.hashtags.map(h => `#${h}`).join(" "));
          const liResult = await postToLinkedInNow(liContent.content + "\n\n" + liContent.hashtags.map(h => `#${h}`).join(" "));

          const successes = [];
          const failures = [];
          
          if (fbResult.success) successes.push("Facebook");
          else failures.push(`Facebook: ${fbResult.error}`);
          
          if (liResult.success) successes.push("LinkedIn");
          else failures.push(`LinkedIn: ${liResult.error}`);

          await db.insert(activityLog).values({
            action: "multi_post",
            details: `Posted to ${successes.length} platforms. ${failures.length} failed.`,
            metadata: { facebook: fbResult, linkedin: liResult }
          });

          result = {
            success: successes.length > 0,
            message: successes.length > 0 
              ? `✅ Posted to: ${successes.join(", ")}${failures.length > 0 ? `. Failed: ${failures.join("; ")}` : ""}`
              : `❌ All posts failed: ${failures.join("; ")}`,
            details: { facebook: fbResult, linkedin: liResult }
          };
        }
        else if (commandLower.includes("status") || commandLower.includes("check")) {
          // Status check
          const openaiConfigured = isOpenAIConfigured();
          
          const fbAccounts = await db.select().from(platformConnections).where(eq(platformConnections.platform, "facebook"));
          const liAccounts = await db.select().from(platformConnections).where(eq(platformConnections.platform, "linkedin"));
          
          const attackSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, "attack_mode")).limit(1);
          const attackActive = attackSetting.length > 0 && attackSetting[0].value === "active";

          result = {
            success: true,
            message: `System Status:
• OpenAI: ${openaiConfigured ? "✅ Configured" : "❌ Not configured"}
• Facebook: ${fbAccounts.length > 0 ? `✅ Connected (${fbAccounts[0].pageName || "Page"})` : "❌ Not connected"}
• LinkedIn: ${liAccounts.length > 0 ? "✅ Connected" : "❌ Not connected"}
• 24/7 Attack: ${attackActive ? "🔥 ACTIVE" : "⏸️ Standby"}`,
            details: {
              openai: openaiConfigured,
              facebook: fbAccounts.length > 0,
              linkedin: liAccounts.length > 0,
              attackMode: attackActive
            }
          };
        }
        else {
          // Unknown command - try to be helpful
          result = {
            success: false,
            message: `I don't understand that command. Try:
• "Generate a post about stress relief"
• "Post to Facebook about 24/7 support"
• "Post to LinkedIn about work-life balance"
• "Post to all platforms"
• "Check status"`,
            details: null
          };
        }

        return result;

      } catch (error) {
        // Log the error
        await db.insert(activityLog).values({
          action: "command_error",
          details: `Command failed: ${input.command}. Error: ${error}`,
        });

        return {
          success: false,
          message: `Command failed: ${error}`,
          details: null
        };
      }
    }),

  // Generate content without posting (for preview/approval)
  generateContent: publicProcedure
    .input(z.object({
      platform: z.enum(["facebook", "linkedin", "instagram"]),
      topic: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const content = await generateMarketingContent(input.platform, input.topic);
      return {
        success: true,
        content: content.content,
        hashtags: content.hashtags,
        platform: input.platform
      };
    }),

  // Post immediately to a platform
  postNow: publicProcedure
    .input(z.object({
      platform: z.enum(["facebook", "linkedin"]),
      content: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let result;
      if (input.platform === "facebook") {
        result = await postToFacebookNow(input.content);
      } else {
        result = await postToLinkedInNow(input.content);
      }

      if (result.success) {
        await db.insert(activityLog).values({
          action: "post_published",
          details: `Posted to ${input.platform}: "${input.content.substring(0, 50)}..."`,
          metadata: { postId: result.postId }
        });
      }

      return result;
    }),

  // Auto-generate and schedule a batch of posts
  generateBatch: publicProcedure
    .input(z.object({
      count: z.number().min(1).max(10).default(5),
      platforms: z.array(z.enum(["facebook", "linkedin"])).default(["facebook", "linkedin"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const posts = [];
      const topics = [
        "late night emotional support",
        "work stress and burnout",
        "feeling overwhelmed",
        "needing someone to listen",
        "24/7 availability",
        "affordable mental wellness",
        "no judgment conversations",
        "instant access support",
        "processing difficult emotions",
        "finding peace of mind"
      ];

      for (let i = 0; i < input.count; i++) {
        const platform = input.platforms[i % input.platforms.length];
        const topic = topics[i % topics.length];
        
        try {
          const generated = await generateMarketingContent(platform, topic);
          const fullContent = generated.content + "\n\n" + generated.hashtags.map(h => `#${h}`).join(" ");
          
          // Schedule for future (spread throughout the day)
          const scheduledTime = new Date();
          scheduledTime.setHours(scheduledTime.getHours() + (i * 4)); // Every 4 hours
          
          const [savedPost] = await db.insert(scheduledPosts).values({
            userId: 1,
            content: fullContent,
            platforms: [platform],
            status: "scheduled",
            scheduledTime,
          }).returning();

          posts.push({
            id: savedPost.id,
            platform,
            topic,
            scheduledTime,
            preview: generated.content.substring(0, 100) + "..."
          });
        } catch (error) {
          console.error(`Failed to generate post ${i + 1}:`, error);
        }
      }

      await db.insert(activityLog).values({
        action: "batch_generated",
        details: `Generated ${posts.length} posts for scheduling`,
      });

      return {
        success: true,
        message: `Generated ${posts.length} posts scheduled over the next ${input.count * 4} hours`,
        posts
      };
    }),
});
