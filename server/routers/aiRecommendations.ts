/**
 * AI Recommendations Router - Intelligent Marketing Analysis
 * 
 * Uses LLM to analyze content performance and provide actionable recommendations.
 * This is the "self-learning" component of the autonomous marketing engine.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/openai";
import { queryJustTalk } from "../_core/justTalkDb";
import { sql } from "drizzle-orm";

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

// Helper to parse JSON from LLM response
function parseJsonResponse(content: string): any {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
  return null;
}

export const aiRecommendationsRouter = router({
  /**
   * Analyze content performance and generate recommendations
   */
  analyzeContent: protectedProcedure
    .input(z.object({
      contentItems: z.array(z.object({
        id: z.string(),
        platform: z.string(),
        contentType: z.string(),
        content: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        conversions: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const { contentItems } = input;

      // Calculate engagement rates
      const itemsWithEngagement = contentItems.map(item => ({
        ...item,
        engagementRate: item.impressions > 0 
          ? ((item.clicks / item.impressions) * 100).toFixed(2)
          : "0.00",
        conversionRate: item.clicks > 0
          ? ((item.conversions / item.clicks) * 100).toFixed(2)
          : "0.00",
      }));

      // Use LLM to analyze and recommend
      const prompt = `You are an expert marketing analyst for a mental health coaching platform called "Just Talk".

Analyze the following content performance data and provide specific, actionable recommendations:

${JSON.stringify(itemsWithEngagement, null, 2)}

Based on this data, provide recommendations in the following JSON format:
{
  "recommendations": [
    {
      "type": "boost|pause|modify|test",
      "priority": "high|medium|low",
      "contentId": "id of the content item",
      "reason": "Why this recommendation",
      "suggestedAction": "Specific action to take",
      "expectedImpact": "Expected result"
    }
  ],
  "insights": {
    "topPerformer": "Which content performed best and why",
    "underperformer": "Which content needs attention",
    "patterns": ["List of patterns you noticed"],
    "opportunities": ["List of opportunities to explore"]
  },
  "nextSteps": ["Prioritized list of next actions"]
}

Focus on:
1. Content that should be boosted (high engagement)
2. Content that should be paused (low engagement, wasting resources)
3. Content that should be modified (potential but underperforming)
4. A/B test opportunities

Be specific and actionable. This is for a solo operator who needs clear guidance.`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert marketing analyst. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
        });

        const content = extractContent(response.choices[0]?.message?.content || "");
        const parsed = parseJsonResponse(content);
        
        if (parsed) {
          return parsed;
        }
        
        return { error: "Could not parse AI response", raw: content };
      } catch (error) {
        console.error("[AIRecommendations] Analysis error:", error);
        return { error: "Failed to analyze content", details: String(error) };
      }
    }),

  /**
   * Get AI-powered insights from Just Talk data
   */
  getDataInsights: protectedProcedure.query(async () => {
    // Get engagement patterns from Just Talk
    const chatPatterns = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as count
        FROM ai_chat_conversations
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY count DESC
      `);
    });

    const emotionPatterns = await queryJustTalk(async (db) => {
      return db.execute(sql`
        SELECT emotion_detected, COUNT(*) as count
        FROM ai_chat_messages
        WHERE emotion_detected IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY emotion_detected
        ORDER BY count DESC
        LIMIT 5
      `);
    });

    // Use LLM to generate insights
    const prompt = `You are a marketing strategist for "Just Talk", a mental health coaching platform.

Based on the following user engagement data, provide marketing insights:

Peak Usage Hours (last 30 days):
${JSON.stringify(chatPatterns || [], null, 2)}

Most Common Emotions Detected:
${JSON.stringify(emotionPatterns || [], null, 2)}

Provide insights in JSON format:
{
  "targetAudience": {
    "bestTimeToPost": ["List of optimal posting times"],
    "emotionalTriggers": ["Emotions to address in content"],
    "contentThemes": ["Themes that would resonate"]
  },
  "contentStrategy": {
    "highPriorityContent": ["Types of content to prioritize"],
    "messagingTone": "Recommended tone for content",
    "callToAction": "Most effective CTA approach"
  },
  "campaignIdeas": [
    {
      "name": "Campaign name",
      "description": "Brief description",
      "targetEmotion": "Primary emotion to address",
      "expectedOutcome": "What this should achieve"
    }
  ]
}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert marketing strategist. Always respond with valid JSON." },
          { role: "user", content: prompt },
        ],
      });

      const content = extractContent(response.choices[0]?.message?.content || "");
      const parsed = parseJsonResponse(content);
      
      if (parsed) {
        return {
          insights: parsed,
          rawData: {
            chatPatterns: chatPatterns || [],
            emotionPatterns: emotionPatterns || [],
          },
        };
      }

      return { error: "Could not parse AI response" };
    } catch (error) {
      console.error("[AIRecommendations] Insights error:", error);
      return { error: "Failed to generate insights", details: String(error) };
    }
  }),

  /**
   * Generate content suggestions based on performance data
   */
  generateContentSuggestions: protectedProcedure
    .input(z.object({
      platform: z.enum(["facebook", "instagram", "linkedin", "tiktok"]),
      contentType: z.enum(["emotional", "educational", "promotional", "testimonial"]),
      targetEmotion: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { platform, contentType, targetEmotion } = input;

      const platformGuidelines: Record<string, string> = {
        facebook: "Longer form content, storytelling, community engagement",
        instagram: "Visual-first, short captions, hashtags, reels",
        linkedin: "Professional tone, thought leadership, industry insights",
        tiktok: "Short, engaging, trend-aware, authentic",
      };

      const contentTypeGuidelines: Record<string, string> = {
        emotional: "Connect with feelings, validate struggles, offer hope",
        educational: "Provide value, teach coping strategies, share research",
        promotional: "Highlight benefits, clear CTA, urgency without pressure",
        testimonial: "Real stories, transformation, social proof",
      };

      const prompt = `You are a content creator for "Just Talk", a mental health coaching platform.

Create 3 content suggestions for ${platform} that are ${contentType} in nature.
${targetEmotion ? `Target emotion to address: ${targetEmotion}` : ""}

Platform guidelines: ${platformGuidelines[platform]}
Content type guidelines: ${contentTypeGuidelines[contentType]}

IMPORTANT: This is a mental health platform. Content must be:
- Empathetic and non-judgmental
- Hopeful without being dismissive
- Professional but warm
- Never making medical claims
- Always encouraging professional help when needed

Provide suggestions in JSON format:
{
  "suggestions": [
    {
      "headline": "Attention-grabbing first line",
      "body": "Full content text",
      "callToAction": "What action to take",
      "hashtags": ["relevant", "hashtags"],
      "bestTimeToPost": "Recommended posting time",
      "targetAudience": "Who this is for",
      "emotionalHook": "What emotion this addresses"
    }
  ],
  "tips": ["Platform-specific tips for this content"]
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert content creator for mental health platforms. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
        });

        const content = extractContent(response.choices[0]?.message?.content || "");
        const parsed = parseJsonResponse(content);
        
        if (parsed) {
          return parsed;
        }

        return { error: "Could not parse AI response" };
      } catch (error) {
        console.error("[AIRecommendations] Content generation error:", error);
        return { error: "Failed to generate content", details: String(error) };
      }
    }),

  /**
   * Analyze A/B test results and recommend winner
   */
  analyzeABTest: protectedProcedure
    .input(z.object({
      testName: z.string(),
      variantA: z.object({
        name: z.string(),
        content: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        conversions: z.number(),
      }),
      variantB: z.object({
        name: z.string(),
        content: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        conversions: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      const { testName, variantA, variantB } = input;

      // Calculate metrics
      const aClickRate = variantA.impressions > 0 ? (variantA.clicks / variantA.impressions) * 100 : 0;
      const bClickRate = variantB.impressions > 0 ? (variantB.clicks / variantB.impressions) * 100 : 0;
      const aConvRate = variantA.clicks > 0 ? (variantA.conversions / variantA.clicks) * 100 : 0;
      const bConvRate = variantB.clicks > 0 ? (variantB.conversions / variantB.clicks) * 100 : 0;

      const prompt = `You are a marketing analyst evaluating an A/B test for "Just Talk" mental health coaching platform.

Test: ${testName}

Variant A (${variantA.name}):
- Content: ${variantA.content}
- Impressions: ${variantA.impressions}
- Clicks: ${variantA.clicks} (${aClickRate.toFixed(2)}% CTR)
- Conversions: ${variantA.conversions} (${aConvRate.toFixed(2)}% conversion rate)

Variant B (${variantB.name}):
- Content: ${variantB.content}
- Impressions: ${variantB.impressions}
- Clicks: ${variantB.clicks} (${bClickRate.toFixed(2)}% CTR)
- Conversions: ${variantB.conversions} (${bConvRate.toFixed(2)}% conversion rate)

Analyze and provide recommendation in JSON format:
{
  "winner": "A or B",
  "confidence": "high|medium|low",
  "statisticalSignificance": "Explanation of statistical significance",
  "reasoning": "Why this variant won",
  "keyDifferences": ["What made the difference"],
  "recommendation": "What to do next",
  "learnings": ["What we learned from this test"],
  "nextTestSuggestion": "What to test next"
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert marketing analyst. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
        });

        const content = extractContent(response.choices[0]?.message?.content || "");
        const parsed = parseJsonResponse(content);
        
        if (parsed) {
          return {
            analysis: parsed,
            metrics: {
              variantA: { clickRate: aClickRate, conversionRate: aConvRate },
              variantB: { clickRate: bClickRate, conversionRate: bConvRate },
            },
          };
        }

        return { error: "Could not parse AI response" };
      } catch (error) {
        console.error("[AIRecommendations] A/B analysis error:", error);
        return { error: "Failed to analyze A/B test", details: String(error) };
      }
    }),
});
