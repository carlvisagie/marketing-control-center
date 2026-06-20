/**
 * TikTok Router - Content Generation & Send-to-Phone Workflow
 * 
 * Features:
 * - AI-powered TikTok content generation (captions, hashtags, hooks)
 * - Trend research and analysis
 * - One-click send-to-phone (SMS/WhatsApp) for easy posting
 * - Content scheduling reminders
 * 
 * Note: TikTok API doesn't allow automated posting, so we use
 * a "send to phone" workflow for manual posting with AI-generated content.
 */

import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM, completeJSON } from "../_core/openai";
import { notifyOwner, isTwilioConfigured } from "../_core/notification";
import { ENV } from "../_core/env";

// Helper to extract string content from LLM response
function extractContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textPart = content.find(p => p.type === "text" && p.text);
    return textPart?.text || "";
  }
  return "";
}

// TikTok content types
const contentTypes = [
  "educational",      // Tips, how-tos, explanations
  "storytelling",     // Personal stories, testimonials
  "trending_audio",   // Using trending sounds
  "duet_stitch",      // Responding to other content
  "behind_scenes",    // Day in the life, process
  "transformation",   // Before/after, progress
  "myth_busting",     // Debunking misconceptions
  "quick_tips",       // 3-second tips, hacks
] as const;

// Mental health topics for Just Talk
const mentalHealthTopics = [
  "anxiety management",
  "stress relief",
  "mindfulness",
  "self-care routines",
  "emotional regulation",
  "building resilience",
  "healthy boundaries",
  "overcoming negative thoughts",
  "sleep improvement",
  "work-life balance",
  "relationship health",
  "confidence building",
  "dealing with burnout",
  "finding purpose",
  "daily motivation",
] as const;

export const tiktokRouter = router({
  /**
   * Generate TikTok content with AI
   */
  generateContent: publicProcedure
    .input(z.object({
      topic: z.string().optional(),
      contentType: z.enum(contentTypes).optional(),
      targetAudience: z.string().optional(),
      tone: z.enum(["professional", "casual", "inspiring", "educational", "relatable"]).optional(),
      includeHook: z.boolean().default(true),
      includeCTA: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const {
        topic = mentalHealthTopics[Math.floor(Math.random() * mentalHealthTopics.length)],
        contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)],
        targetAudience = "adults 25-45 seeking mental wellness support",
        tone = "relatable",
        includeHook,
        includeCTA,
      } = input;

      const prompt = `You are a TikTok content strategist for "Just Talk" - a mental health AI coaching platform.

Create engaging TikTok content for the following:
- Topic: ${topic}
- Content Type: ${contentType}
- Target Audience: ${targetAudience}
- Tone: ${tone}
${includeHook ? "- Include a strong hook in the first 3 seconds" : ""}
${includeCTA ? "- Include a call-to-action" : ""}

Generate content in JSON format:
{
  "hook": "The attention-grabbing first line (3 seconds or less)",
  "script": "Full video script (30-60 seconds when spoken)",
  "caption": "TikTok caption (max 150 chars for visibility)",
  "hashtags": ["array", "of", "relevant", "hashtags"],
  "trendingHashtags": ["potential", "trending", "tags"],
  "postingTip": "Best time/day to post this type of content",
  "audioSuggestion": "Type of audio/sound that would work well",
  "visualTips": "Brief visual direction for filming",
  "estimatedDuration": "15s / 30s / 60s"
}

Focus on:
- Mental health awareness without being preachy
- Relatable content that drives engagement
- Subtle promotion of AI coaching as a solution
- Authentic, non-salesy approach`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a viral TikTok content creator specializing in mental health content. Respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
        });

        const content = extractContent(response.choices[0]?.message?.content || "");
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const generated = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            content: {
              ...generated,
              topic,
              contentType,
              generatedAt: new Date().toISOString(),
            },
          };
        }

        return {
          success: false,
          error: "Failed to parse AI response",
        };
      } catch (error) {
        console.error("[TikTok] Content generation error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Content generation failed",
        };
      }
    }),

  /**
   * Get trending topics and hashtags for mental health niche
   */
  getTrendingTopics: publicProcedure.query(async () => {
    const prompt = `As a TikTok trend analyst, identify current trending topics and hashtags in the mental health and wellness space.

Provide analysis in JSON format:
{
  "trendingTopics": [
    {
      "topic": "Topic name",
      "relevance": "high/medium/low",
      "description": "Why it's trending",
      "contentIdea": "How Just Talk could use this"
    }
  ],
  "trendingHashtags": [
    {
      "hashtag": "#example",
      "estimatedViews": "1M+",
      "relevance": "high/medium/low"
    }
  ],
  "trendingAudios": [
    {
      "description": "Audio type/name",
      "useCase": "How to use it for mental health content"
    }
  ],
  "weeklyFocus": "Recommended content theme for this week",
  "avoidTopics": ["Topics to avoid right now"]
}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a TikTok trend analyst. Respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      });

      const content = extractContent(response.choices[0]?.message?.content || "");
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return {
          success: true,
          trends: JSON.parse(jsonMatch[0]),
          analyzedAt: new Date().toISOString(),
        };
      }

      return {
        success: false,
        error: "Failed to analyze trends",
      };
    } catch (error) {
      console.error("[TikTok] Trend analysis error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Trend analysis failed",
      };
    }
  }),

  /**
   * Send content to phone via SMS/WhatsApp for easy posting
   */
  sendToPhone: publicProcedure
    .input(z.object({
      content: z.object({
        hook: z.string(),
        script: z.string(),
        caption: z.string(),
        hashtags: z.array(z.string()),
        postingTip: z.string().optional(),
        audioSuggestion: z.string().optional(),
      }),
      method: z.enum(["sms", "whatsapp", "both"]).default("both"),
      phoneNumber: z.string().optional(), // Optional: use owner's number if not provided
    }))
    .mutation(async ({ input }) => {
      const { content, method, phoneNumber } = input;

      if (!isTwilioConfigured()) {
        return {
          success: false,
          error: "Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and OWNER_PHONE_NUMBER to environment variables.",
        };
      }

      // Format message for easy copying
      const hashtagString = content.hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ");
      
      const message = `🎬 TIKTOK CONTENT READY

📢 HOOK:
${content.hook}

📝 SCRIPT:
${content.script}

✏️ CAPTION (copy this):
${content.caption}

#️⃣ HASHTAGS (copy these):
${hashtagString}

${content.postingTip ? `⏰ TIP: ${content.postingTip}` : ""}
${content.audioSuggestion ? `🎵 AUDIO: ${content.audioSuggestion}` : ""}

---
Sent from Just Talk Marketing Control Center`;

      try {
        const result = await notifyOwner({
          title: "TikTok Content Ready to Post",
          content: message,
        });

        return {
          success: result,
          message: result 
            ? "Content sent to your phone! Check SMS/WhatsApp." 
            : "Failed to send notification. Check Twilio configuration.",
          characterCount: message.length,
        };
      } catch (error) {
        console.error("[TikTok] Send to phone error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to send to phone",
        };
      }
    }),

  /**
   * Generate a week's worth of content ideas
   */
  generateWeeklyPlan: publicProcedure
    .input(z.object({
      focusArea: z.string().optional(),
      postsPerDay: z.number().min(1).max(5).default(2),
    }))
    .mutation(async ({ input }) => {
      const { focusArea = "general mental wellness", postsPerDay } = input;

      const prompt = `Create a 7-day TikTok content calendar for "Just Talk" mental health AI coaching platform.

Focus Area: ${focusArea}
Posts per day: ${postsPerDay}

Generate a weekly plan in JSON format:
{
  "weeklyTheme": "Overall theme for the week",
  "days": [
    {
      "day": "Monday",
      "posts": [
        {
          "time": "9:00 AM",
          "contentType": "educational/storytelling/etc",
          "topic": "Specific topic",
          "hook": "Attention-grabbing first line",
          "briefDescription": "What the video covers",
          "hashtags": ["relevant", "hashtags"],
          "expectedEngagement": "high/medium/low"
        }
      ]
    }
  ],
  "weeklyGoals": {
    "followers": "Target follower growth",
    "engagement": "Target engagement rate",
    "websiteClicks": "Target clicks to Just Talk"
  },
  "contentMix": {
    "educational": "30%",
    "entertaining": "40%",
    "promotional": "30%"
  }
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a TikTok content strategist. Respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
        });

        const content = extractContent(response.choices[0]?.message?.content || "");
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          return {
            success: true,
            plan: JSON.parse(jsonMatch[0]),
            generatedAt: new Date().toISOString(),
          };
        }

        return {
          success: false,
          error: "Failed to generate weekly plan",
        };
      } catch (error) {
        console.error("[TikTok] Weekly plan error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Weekly plan generation failed",
        };
      }
    }),

  /**
   * Analyze a competitor or trending account
   */
  analyzeAccount: publicProcedure
    .input(z.object({
      accountName: z.string(),
      analysisType: z.enum(["content_style", "posting_frequency", "engagement_tactics", "full"]).default("full"),
    }))
    .mutation(async ({ input }) => {
      const { accountName, analysisType } = input;

      const prompt = `Analyze the TikTok account "@${accountName}" from a mental health/wellness content perspective.

Analysis Type: ${analysisType}

Provide analysis in JSON format:
{
  "accountOverview": {
    "niche": "Their content niche",
    "estimatedFollowers": "Follower range estimate",
    "contentStyle": "Description of their style",
    "postingFrequency": "How often they post"
  },
  "contentAnalysis": {
    "topPerformingTypes": ["Types of content that work for them"],
    "commonHooks": ["Hook styles they use"],
    "hashtagStrategy": "How they use hashtags",
    "audioUsage": "How they use trending audio"
  },
  "engagementTactics": {
    "callToActions": ["CTAs they use"],
    "communityBuilding": "How they engage with audience",
    "collaborations": "Partnership approach"
  },
  "lessonsForJustTalk": [
    {
      "lesson": "What we can learn",
      "implementation": "How to apply it"
    }
  ],
  "differentiators": "How Just Talk can stand out from this account"
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a social media analyst specializing in TikTok. Respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
        });

        const content = extractContent(response.choices[0]?.message?.content || "");
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          return {
            success: true,
            analysis: JSON.parse(jsonMatch[0]),
            analyzedAt: new Date().toISOString(),
          };
        }

        return {
          success: false,
          error: "Failed to analyze account",
        };
      } catch (error) {
        console.error("[TikTok] Account analysis error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Account analysis failed",
        };
      }
    }),

  /**
   * Get optimal posting times
   */
  getOptimalPostingTimes: publicProcedure.query(async () => {
    const prompt = `Provide optimal TikTok posting times for a mental health/wellness account targeting adults 25-45.

Return in JSON format:
{
  "bestTimes": [
    {
      "day": "Monday",
      "times": ["9:00 AM", "12:00 PM", "7:00 PM"],
      "bestTime": "7:00 PM",
      "reason": "Why this time works"
    }
  ],
  "worstTimes": ["Times to avoid"],
  "generalTips": [
    "Posting strategy tips"
  ],
  "timezone": "Recommended timezone to target",
  "frequencyRecommendation": "How many posts per day/week"
}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a TikTok algorithm expert. Respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      });

      const content = extractContent(response.choices[0]?.message?.content || "");
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return {
          success: true,
          schedule: JSON.parse(jsonMatch[0]),
        };
      }

      return {
        success: false,
        error: "Failed to get posting times",
      };
    } catch (error) {
      console.error("[TikTok] Posting times error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get posting times",
      };
    }
  }),

  /**
   * Check notification configuration status
   */
  getNotificationStatus: publicProcedure.query(() => {
    return {
      configured: isTwilioConfigured(),
      twilioAccountSid: Boolean(ENV.twilioAccountSid),
      twilioAuthToken: Boolean(ENV.twilioAuthToken),
      twilioPhoneNumber: Boolean(ENV.twilioPhoneNumber),
      twilioWhatsappNumber: Boolean(ENV.twilioWhatsappNumber),
      ownerPhoneNumber: Boolean(ENV.ownerPhoneNumber),
      message: isTwilioConfigured()
        ? "Twilio is configured. You can send content to your phone."
        : "Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and OWNER_PHONE_NUMBER to enable send-to-phone.",
    };
  }),
});
