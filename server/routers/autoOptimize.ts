/**
 * Auto-Optimize Router - Autonomous Content Pause/Boost Logic
 * 
 * Automatically pauses underperforming content and boosts high performers
 * based on configurable performance thresholds.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

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

// Default performance thresholds
const DEFAULT_THRESHOLDS = {
  // Minimum metrics before taking action
  minImpressions: 100,
  minDays: 3,
  
  // Pause thresholds (underperforming)
  pauseClickRate: 0.5, // Below 0.5% CTR
  pauseConversionRate: 0.1, // Below 0.1% conversion rate
  pauseEngagementRate: 1.0, // Below 1% engagement
  
  // Boost thresholds (high performing)
  boostClickRate: 3.0, // Above 3% CTR
  boostConversionRate: 2.0, // Above 2% conversion rate
  boostEngagementRate: 5.0, // Above 5% engagement
  
  // Warning thresholds (needs attention)
  warnClickRate: 1.0, // Below 1% CTR
  warnConversionRate: 0.5, // Below 0.5% conversion
};

// Content status enum
const ContentStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  BOOSTED: "boosted",
  WARNING: "warning",
} as const;

// Action types
type OptimizationAction = {
  contentId: string;
  action: "pause" | "boost" | "warn" | "maintain";
  reason: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    clickRate: number;
    conversionRate: number;
  };
  confidence: "high" | "medium" | "low";
  autoExecute: boolean;
};

export const autoOptimizeRouter = router({
  /**
   * Get current optimization thresholds
   */
  getThresholds: protectedProcedure.query(() => {
    return DEFAULT_THRESHOLDS;
  }),

  /**
   * Update optimization thresholds
   */
  updateThresholds: protectedProcedure
    .input(z.object({
      minImpressions: z.number().min(50).optional(),
      minDays: z.number().min(1).optional(),
      pauseClickRate: z.number().min(0).max(10).optional(),
      pauseConversionRate: z.number().min(0).max(10).optional(),
      boostClickRate: z.number().min(0).max(20).optional(),
      boostConversionRate: z.number().min(0).max(20).optional(),
    }))
    .mutation(async ({ input }) => {
      // In production, save to database
      const updatedThresholds = {
        ...DEFAULT_THRESHOLDS,
        ...input,
      };
      return updatedThresholds;
    }),

  /**
   * Evaluate content performance and recommend actions
   */
  evaluateContent: protectedProcedure
    .input(z.object({
      content: z.array(z.object({
        id: z.string(),
        name: z.string(),
        platform: z.string(),
        status: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        conversions: z.number(),
        daysActive: z.number(),
        spend: z.number().optional(),
      })),
      thresholds: z.object({
        minImpressions: z.number(),
        minDays: z.number(),
        pauseClickRate: z.number(),
        pauseConversionRate: z.number(),
        boostClickRate: z.number(),
        boostConversionRate: z.number(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const thresholds = input.thresholds || DEFAULT_THRESHOLDS;
      const actions: OptimizationAction[] = [];

      for (const item of input.content) {
        // Skip if not enough data
        if (item.impressions < thresholds.minImpressions || item.daysActive < thresholds.minDays) {
          actions.push({
            contentId: item.id,
            action: "maintain",
            reason: `Insufficient data (${item.impressions} impressions, ${item.daysActive} days). Need ${thresholds.minImpressions} impressions and ${thresholds.minDays} days.`,
            metrics: {
              impressions: item.impressions,
              clicks: item.clicks,
              conversions: item.conversions,
              clickRate: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
              conversionRate: item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0,
            },
            confidence: "low",
            autoExecute: false,
          });
          continue;
        }

        const clickRate = (item.clicks / item.impressions) * 100;
        const conversionRate = item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0;

        // Determine action based on thresholds
        let action: "pause" | "boost" | "warn" | "maintain" = "maintain";
        let reason = "";
        let confidence: "high" | "medium" | "low" = "medium";
        let autoExecute = false;

        // Check for pause conditions
        if (clickRate < thresholds.pauseClickRate && item.impressions >= thresholds.minImpressions * 2) {
          action = "pause";
          reason = `Very low click rate (${clickRate.toFixed(2)}%) after ${item.impressions} impressions. Below ${thresholds.pauseClickRate}% threshold.`;
          confidence = "high";
          autoExecute = true;
        } else if (conversionRate < thresholds.pauseConversionRate && item.clicks >= 50) {
          action = "pause";
          reason = `Very low conversion rate (${conversionRate.toFixed(2)}%) after ${item.clicks} clicks. Below ${thresholds.pauseConversionRate}% threshold.`;
          confidence = "high";
          autoExecute = true;
        }
        // Check for boost conditions
        else if (clickRate >= thresholds.boostClickRate && conversionRate >= thresholds.boostConversionRate) {
          action = "boost";
          reason = `High performer! CTR: ${clickRate.toFixed(2)}%, Conv: ${conversionRate.toFixed(2)}%. Exceeds both boost thresholds.`;
          confidence = "high";
          autoExecute = true;
        } else if (clickRate >= thresholds.boostClickRate) {
          action = "boost";
          reason = `Strong click rate (${clickRate.toFixed(2)}%). Exceeds ${thresholds.boostClickRate}% threshold.`;
          confidence = "medium";
          autoExecute = false;
        }
        // Check for warning conditions
        else if (clickRate < DEFAULT_THRESHOLDS.warnClickRate) {
          action = "warn";
          reason = `Below average click rate (${clickRate.toFixed(2)}%). Monitor closely.`;
          confidence = "medium";
          autoExecute = false;
        } else if (conversionRate < DEFAULT_THRESHOLDS.warnConversionRate && item.clicks >= 20) {
          action = "warn";
          reason = `Below average conversion rate (${conversionRate.toFixed(2)}%). Consider optimization.`;
          confidence = "medium";
          autoExecute = false;
        }

        actions.push({
          contentId: item.id,
          action,
          reason,
          metrics: {
            impressions: item.impressions,
            clicks: item.clicks,
            conversions: item.conversions,
            clickRate: Math.round(clickRate * 100) / 100,
            conversionRate: Math.round(conversionRate * 100) / 100,
          },
          confidence,
          autoExecute,
        });
      }

      // Summary
      const summary = {
        total: actions.length,
        toPause: actions.filter(a => a.action === "pause").length,
        toBoost: actions.filter(a => a.action === "boost").length,
        warnings: actions.filter(a => a.action === "warn").length,
        autoExecutable: actions.filter(a => a.autoExecute).length,
      };

      return { actions, summary };
    }),

  /**
   * Execute optimization actions
   */
  executeActions: protectedProcedure
    .input(z.object({
      actions: z.array(z.object({
        contentId: z.string(),
        action: z.enum(["pause", "boost", "warn", "maintain"]),
      })),
      dryRun: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const results: Array<{
        contentId: string;
        action: string;
        success: boolean;
        message: string;
      }> = [];

      for (const action of input.actions) {
        if (input.dryRun) {
          results.push({
            contentId: action.contentId,
            action: action.action,
            success: true,
            message: `[DRY RUN] Would ${action.action} content ${action.contentId}`,
          });
        } else {
          // In production, integrate with ad platform APIs
          // For now, log the action
          results.push({
            contentId: action.contentId,
            action: action.action,
            success: true,
            message: `Successfully ${action.action}ed content ${action.contentId}`,
          });
        }
      }

      return {
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          dryRun: input.dryRun,
        },
      };
    }),

  /**
   * Get AI-powered optimization strategy
   */
  getOptimizationStrategy: protectedProcedure
    .input(z.object({
      contentPerformance: z.array(z.object({
        id: z.string(),
        name: z.string(),
        platform: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        conversions: z.number(),
        spend: z.number().optional(),
      })),
      budget: z.number().optional(),
      goal: z.enum(["awareness", "engagement", "conversions"]).default("conversions"),
    }))
    .mutation(async ({ input }) => {
      const { contentPerformance, budget, goal } = input;

      // Calculate metrics for each piece of content
      const contentWithMetrics = contentPerformance.map(c => ({
        ...c,
        clickRate: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
        conversionRate: c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0,
        costPerClick: c.spend && c.clicks > 0 ? c.spend / c.clicks : 0,
        costPerConversion: c.spend && c.conversions > 0 ? c.spend / c.conversions : 0,
      }));

      const prompt = `You are a marketing optimization expert for "Just Talk" mental health coaching platform.

Analyze this content performance and provide an optimization strategy:

${JSON.stringify(contentWithMetrics, null, 2)}

Campaign Goal: ${goal}
${budget ? `Budget: $${budget}` : "Budget: Not specified"}

Provide a strategy in JSON format:
{
  "strategy": {
    "summary": "One-line strategy summary",
    "budgetAllocation": [
      {
        "contentId": "id",
        "currentShare": "percentage of current spend",
        "recommendedShare": "recommended percentage",
        "reason": "why this allocation"
      }
    ],
    "immediateActions": [
      {
        "contentId": "id",
        "action": "pause|boost|modify|test",
        "priority": "high|medium|low",
        "reason": "why this action"
      }
    ],
    "optimizations": [
      "Specific optimization suggestions"
    ]
  },
  "projectedImpact": {
    "expectedImprovement": "percentage improvement expected",
    "timeframe": "when to expect results",
    "risks": ["potential risks"]
  }
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert marketing strategist. Respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
        });

        const content = extractContent(response.choices[0]?.message?.content || "");
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }

        return { error: "Could not parse AI response" };
      } catch (error) {
        console.error("[AutoOptimize] Strategy error:", error);
        return { error: "Failed to generate strategy", details: String(error) };
      }
    }),

  /**
   * Get optimization history/audit log
   */
  getOptimizationHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      // In production, fetch from database
      // For now, return mock data structure
      return {
        history: [],
        summary: {
          totalActions: 0,
          pauseActions: 0,
          boostActions: 0,
          lastOptimization: null,
        },
      };
    }),
});
