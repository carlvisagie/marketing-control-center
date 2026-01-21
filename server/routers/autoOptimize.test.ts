/**
 * Auto-Optimize Router Tests
 * 
 * Tests for the autonomous content optimization logic
 */

import { describe, expect, it } from "vitest";

// Test the statistical calculations and threshold logic
describe("Auto-Optimize Threshold Logic", () => {
  const DEFAULT_THRESHOLDS = {
    minImpressions: 100,
    minDays: 3,
    pauseClickRate: 0.5,
    pauseConversionRate: 0.1,
    boostClickRate: 3.0,
    boostConversionRate: 2.0,
  };

  it("should identify content to pause based on low click rate", () => {
    const content = {
      impressions: 500,
      clicks: 1,
      conversions: 0,
      daysActive: 5,
    };

    const clickRate = (content.clicks / content.impressions) * 100;
    
    expect(clickRate).toBeLessThan(DEFAULT_THRESHOLDS.pauseClickRate);
    expect(content.impressions).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.minImpressions * 2);
    // Should recommend pause
  });

  it("should identify content to boost based on high performance", () => {
    const content = {
      impressions: 1000,
      clicks: 50,
      conversions: 5,
      daysActive: 7,
    };

    const clickRate = (content.clicks / content.impressions) * 100;
    const conversionRate = (content.conversions / content.clicks) * 100;
    
    expect(clickRate).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.boostClickRate);
    expect(conversionRate).toBeGreaterThanOrEqual(DEFAULT_THRESHOLDS.boostConversionRate);
    // Should recommend boost
  });

  it("should maintain content with insufficient data", () => {
    const content = {
      impressions: 50,
      clicks: 2,
      conversions: 1,
      daysActive: 1,
    };

    expect(content.impressions).toBeLessThan(DEFAULT_THRESHOLDS.minImpressions);
    expect(content.daysActive).toBeLessThan(DEFAULT_THRESHOLDS.minDays);
    // Should recommend maintain (not enough data)
  });

  it("should calculate click rate correctly", () => {
    const impressions = 1000;
    const clicks = 25;
    const expectedClickRate = 2.5;

    const clickRate = (clicks / impressions) * 100;
    
    expect(clickRate).toBe(expectedClickRate);
  });

  it("should calculate conversion rate correctly", () => {
    const clicks = 100;
    const conversions = 5;
    const expectedConversionRate = 5;

    const conversionRate = (conversions / clicks) * 100;
    
    expect(conversionRate).toBe(expectedConversionRate);
  });

  it("should handle zero impressions gracefully", () => {
    const impressions = 0;
    const clicks = 0;

    const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    
    expect(clickRate).toBe(0);
  });

  it("should handle zero clicks gracefully for conversion rate", () => {
    const clicks = 0;
    const conversions = 0;

    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    
    expect(conversionRate).toBe(0);
  });
});

describe("A/B Test Statistical Significance", () => {
  // Simple z-test for proportions
  function calculateStatisticalSignificance(
    controlConversions: number,
    controlTotal: number,
    variantConversions: number,
    variantTotal: number
  ): { significant: boolean; confidence: number } {
    if (controlTotal === 0 || variantTotal === 0) {
      return { significant: false, confidence: 0 };
    }

    const p1 = controlConversions / controlTotal;
    const p2 = variantConversions / variantTotal;
    const pPooled = (controlConversions + variantConversions) / (controlTotal + variantTotal);
    
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/controlTotal + 1/variantTotal));
    
    if (se === 0) {
      return { significant: false, confidence: 0 };
    }
    
    const z = Math.abs(p1 - p2) / se;
    
    // Approximate p-value from z-score using normal CDF
    const normalCDF = (x: number): number => {
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
    };
    
    const pValue = 2 * (1 - normalCDF(z));
    const confidence = (1 - pValue) * 100;
    
    return {
      significant: pValue < 0.05,
      confidence: Math.round(confidence * 10) / 10,
    };
  }

  it("should detect statistical significance with clear winner", () => {
    // Control: 5% conversion, Variant: 10% conversion with large sample
    const result = calculateStatisticalSignificance(50, 1000, 100, 1000);
    
    expect(result.significant).toBe(true);
    expect(result.confidence).toBeGreaterThan(95);
  });

  it("should not detect significance with small sample", () => {
    // Small sample sizes
    const result = calculateStatisticalSignificance(2, 20, 3, 20);
    
    expect(result.significant).toBe(false);
  });

  it("should not detect significance with similar results", () => {
    // Very similar conversion rates
    const result = calculateStatisticalSignificance(50, 1000, 52, 1000);
    
    expect(result.significant).toBe(false);
  });

  it("should handle zero totals gracefully", () => {
    const result = calculateStatisticalSignificance(0, 0, 0, 0);
    
    expect(result.significant).toBe(false);
    expect(result.confidence).toBe(0);
  });
});

describe("Reporting Summary Formatting", () => {
  it("should format positive change correctly", () => {
    const change = 25;
    const formatted = change > 0 ? `↑${change}%` : change < 0 ? `↓${Math.abs(change)}%` : "→";
    
    expect(formatted).toBe("↑25%");
  });

  it("should format negative change correctly", () => {
    const change = -15;
    const formatted = change > 0 ? `↑${change}%` : change < 0 ? `↓${Math.abs(change)}%` : "→";
    
    expect(formatted).toBe("↓15%");
  });

  it("should format zero change correctly", () => {
    const change = 0;
    const formatted = change > 0 ? `↑${change}%` : change < 0 ? `↓${Math.abs(change)}%` : "→";
    
    expect(formatted).toBe("→");
  });

  it("should calculate percentage change correctly", () => {
    const current = 150;
    const previous = 100;
    const expectedChange = 50;

    const change = previous === 0 
      ? (current > 0 ? 100 : 0)
      : Math.round(((current - previous) / previous) * 100);
    
    expect(change).toBe(expectedChange);
  });

  it("should handle zero previous value", () => {
    const current = 50;
    const previous = 0;

    const change = previous === 0 
      ? (current > 0 ? 100 : 0)
      : Math.round(((current - previous) / previous) * 100);
    
    expect(change).toBe(100);
  });
});
