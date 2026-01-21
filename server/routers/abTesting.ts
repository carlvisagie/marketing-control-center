/**
 * A/B Testing Router - Autonomous Content Optimization
 * 
 * Manages A/B tests for marketing content with automatic winner detection
 * and optimization recommendations.
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, desc, and, sql as drizzleSql } from "drizzle-orm";

// A/B Test status enum
const TestStatus = {
  DRAFT: "draft",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
  WINNER_DECLARED: "winner_declared",
} as const;

// Statistical significance calculation
function calculateStatisticalSignificance(
  controlConversions: number,
  controlTotal: number,
  variantConversions: number,
  variantTotal: number
): { significant: boolean; confidence: number; pValue: number } {
  // Simple z-test for proportions
  if (controlTotal === 0 || variantTotal === 0) {
    return { significant: false, confidence: 0, pValue: 1 };
  }

  const p1 = controlConversions / controlTotal;
  const p2 = variantConversions / variantTotal;
  const pPooled = (controlConversions + variantConversions) / (controlTotal + variantTotal);
  
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1/controlTotal + 1/variantTotal));
  
  if (se === 0) {
    return { significant: false, confidence: 0, pValue: 1 };
  }
  
  const z = Math.abs(p1 - p2) / se;
  
  // Approximate p-value from z-score
  const pValue = 2 * (1 - normalCDF(z));
  const confidence = (1 - pValue) * 100;
  
  return {
    significant: pValue < 0.05,
    confidence: Math.round(confidence * 10) / 10,
    pValue: Math.round(pValue * 1000) / 1000,
  };
}

// Normal CDF approximation
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export const abTestingRouter = router({
  /**
   * Create a new A/B test
   */
  createTest: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      platform: z.enum(["facebook", "instagram", "linkedin", "tiktok", "all"]),
      controlContent: z.string(),
      variantContent: z.string(),
      targetMetric: z.enum(["clicks", "conversions", "engagement"]).default("conversions"),
      minSampleSize: z.number().min(100).default(500),
      maxDuration: z.number().min(1).max(30).default(7), // days
    }))
    .mutation(async ({ input }) => {
      // For now, store in memory (in production, use database)
      const test = {
        id: `test_${Date.now()}`,
        ...input,
        status: TestStatus.DRAFT,
        control: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
        },
        variant: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
        },
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        winner: null,
      };

      return test;
    }),

  /**
   * Record metrics for an A/B test variant
   */
  recordMetrics: protectedProcedure
    .input(z.object({
      testId: z.string(),
      variant: z.enum(["control", "variant"]),
      impressions: z.number().min(0),
      clicks: z.number().min(0),
      conversions: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      // In production, update database
      return {
        success: true,
        testId: input.testId,
        variant: input.variant,
        metrics: {
          impressions: input.impressions,
          clicks: input.clicks,
          conversions: input.conversions,
        },
      };
    }),

  /**
   * Analyze test results and determine winner
   */
  analyzeTest: protectedProcedure
    .input(z.object({
      testId: z.string(),
      control: z.object({
        impressions: z.number(),
        clicks: z.number(),
        conversions: z.number(),
      }),
      variant: z.object({
        impressions: z.number(),
        clicks: z.number(),
        conversions: z.number(),
      }),
      targetMetric: z.enum(["clicks", "conversions", "engagement"]).default("conversions"),
    }))
    .mutation(async ({ input }) => {
      const { control, variant, targetMetric } = input;

      // Calculate rates
      const controlClickRate = control.impressions > 0 
        ? (control.clicks / control.impressions) * 100 
        : 0;
      const variantClickRate = variant.impressions > 0 
        ? (variant.clicks / variant.impressions) * 100 
        : 0;
      
      const controlConvRate = control.clicks > 0 
        ? (control.conversions / control.clicks) * 100 
        : 0;
      const variantConvRate = variant.clicks > 0 
        ? (variant.conversions / variant.clicks) * 100 
        : 0;

      // Calculate statistical significance based on target metric
      let significance;
      let controlMetric, variantMetric, controlTotal, variantTotal;

      if (targetMetric === "clicks") {
        controlMetric = control.clicks;
        variantMetric = variant.clicks;
        controlTotal = control.impressions;
        variantTotal = variant.impressions;
      } else {
        controlMetric = control.conversions;
        variantMetric = variant.conversions;
        controlTotal = control.clicks;
        variantTotal = variant.clicks;
      }

      significance = calculateStatisticalSignificance(
        controlMetric,
        controlTotal,
        variantMetric,
        variantTotal
      );

      // Determine winner
      let winner: "control" | "variant" | "none" = "none";
      let improvement = 0;

      if (significance.significant) {
        if (targetMetric === "clicks") {
          if (variantClickRate > controlClickRate) {
            winner = "variant";
            improvement = ((variantClickRate - controlClickRate) / controlClickRate) * 100;
          } else {
            winner = "control";
            improvement = ((controlClickRate - variantClickRate) / variantClickRate) * 100;
          }
        } else {
          if (variantConvRate > controlConvRate) {
            winner = "variant";
            improvement = ((variantConvRate - controlConvRate) / controlConvRate) * 100;
          } else {
            winner = "control";
            improvement = ((controlConvRate - variantConvRate) / variantConvRate) * 100;
          }
        }
      }

      return {
        testId: input.testId,
        analysis: {
          control: {
            clickRate: Math.round(controlClickRate * 100) / 100,
            conversionRate: Math.round(controlConvRate * 100) / 100,
          },
          variant: {
            clickRate: Math.round(variantClickRate * 100) / 100,
            conversionRate: Math.round(variantConvRate * 100) / 100,
          },
          significance,
          winner,
          improvement: Math.round(improvement * 10) / 10,
          recommendation: winner === "none"
            ? "Continue test - not enough data for statistical significance"
            : `Declare ${winner} as winner (${Math.round(improvement)}% improvement)`,
        },
      };
    }),

  /**
   * Get auto-optimization recommendations
   */
  getOptimizationRecommendations: protectedProcedure
    .input(z.object({
      tests: z.array(z.object({
        id: z.string(),
        name: z.string(),
        status: z.string(),
        control: z.object({
          impressions: z.number(),
          clicks: z.number(),
          conversions: z.number(),
        }),
        variant: z.object({
          impressions: z.number(),
          clicks: z.number(),
          conversions: z.number(),
        }),
        daysRunning: z.number(),
      })),
    }))
    .query(async ({ input }) => {
      const recommendations: Array<{
        testId: string;
        testName: string;
        action: "continue" | "pause" | "declare_winner" | "increase_traffic";
        reason: string;
        urgency: "high" | "medium" | "low";
      }> = [];

      for (const test of input.tests) {
        const totalImpressions = test.control.impressions + test.variant.impressions;
        const totalConversions = test.control.conversions + test.variant.conversions;

        // Check if test has enough data
        if (totalImpressions < 200) {
          recommendations.push({
            testId: test.id,
            testName: test.name,
            action: "increase_traffic",
            reason: `Only ${totalImpressions} impressions - need at least 200 for meaningful results`,
            urgency: "medium",
          });
          continue;
        }

        // Analyze for statistical significance
        const significance = calculateStatisticalSignificance(
          test.control.conversions,
          test.control.clicks || test.control.impressions,
          test.variant.conversions,
          test.variant.clicks || test.variant.impressions
        );

        if (significance.significant && significance.confidence >= 95) {
          const controlRate = test.control.impressions > 0 
            ? test.control.conversions / test.control.impressions 
            : 0;
          const variantRate = test.variant.impressions > 0 
            ? test.variant.conversions / test.variant.impressions 
            : 0;
          
          const winner = variantRate > controlRate ? "variant" : "control";
          
          recommendations.push({
            testId: test.id,
            testName: test.name,
            action: "declare_winner",
            reason: `${significance.confidence}% confidence that ${winner} is better. Declare winner and roll out.`,
            urgency: "high",
          });
        } else if (test.daysRunning >= 14 && !significance.significant) {
          recommendations.push({
            testId: test.id,
            testName: test.name,
            action: "pause",
            reason: `Running for ${test.daysRunning} days without reaching significance. Consider pausing and trying a more different variant.`,
            urgency: "medium",
          });
        } else if (totalConversions < 10) {
          recommendations.push({
            testId: test.id,
            testName: test.name,
            action: "continue",
            reason: `Only ${totalConversions} conversions so far. Need more data for reliable results.`,
            urgency: "low",
          });
        } else {
          recommendations.push({
            testId: test.id,
            testName: test.name,
            action: "continue",
            reason: `Test progressing normally. Current confidence: ${significance.confidence}%`,
            urgency: "low",
          });
        }
      }

      return {
        recommendations,
        summary: {
          total: input.tests.length,
          needsAction: recommendations.filter(r => r.urgency === "high").length,
          readyToDecide: recommendations.filter(r => r.action === "declare_winner").length,
        },
      };
    }),
});
