/**
 * POD Organism State
 *
 * Adapted from the organism_core pattern used in KYC and Purposeful.
 *
 * Architecture:
 *   SignalCollectors → SignalBundle → Checks → derive_health → Snapshot
 *
 * The organism never lies. It reports what it actually knows.
 * Health is GREEN / AMBER / RED — derived from reconciliation checks, not vibes.
 *
 * Platform priority (derived from REAL signals as of 2026-06-15):
 *   PRIMARY:   Redbubble (4 organic sales), Etsy (8 sales, 5★, 2941 Pattern visits),
 *              Spring, Spreadshirt — unlimited uploads, no tier gate
 *   SECONDARY: Amazon Merch — Tier 10, 10/10 slots, 1 upload/day limit
 *
 * Etsy correction: Shop JetFighterClothing is LIVE — 8 total sales (historical), 5★ review, 1 active listing.
 * CRITICAL: Etsy marketplace traffic collapsed 93% YoY — only 2 visits in last 30 days.
 * Pattern standalone site: 2,941 visits (12mo) with 0 Pattern orders — conversion gap.
 * Root cause: Only 1 listing. More listings = more Etsy search surface = more organic traffic.
 * Etsy does NOT require Printful — direct listings work. Priority: expand listings immediately.
 */

import { router, publicProcedure } from "../_core/trpc";
import { designQueue, PLATFORM_CONFIG } from "./podUploadEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthState = "GREEN" | "AMBER" | "RED";
type Severity = "info" | "amber" | "red";

interface CheckResult {
  name: string;
  ok: boolean;
  severity: Severity;
  detail: string;
  evidence: Record<string, unknown>;
}

interface OrganismSnapshot {
  ok: boolean;
  organism: string;
  timestamp_utc: string;
  health_state: HealthState;
  current_bottleneck: string;
  next_recommended_action: string;
  checks: CheckResult[];
  signals: Record<string, unknown>;
  platform_priority: PlatformPriorityGroup[];
  design_gallery: DesignGalleryEntry[];
  amazon_queue: AmazonQueueState;
  metadata: Record<string, unknown>;
}

interface PlatformPriorityGroup {
  tier: "PRIMARY" | "SECONDARY" | "BLOCKED";
  platform: string;
  key: string;
  live_count: number;
  queued_count: number;
  total_capacity: string;
  constraint: string;
  health: HealthState;
  action: string;
  store_url?: string;
}

interface DesignGalleryEntry {
  id: string;
  name: string;
  aircraft: string;
  signal_weight: number;
  priority: string;
  has_listing: boolean;
  listing_confidence?: number;
  listing_title?: string;
  listing_tags?: string[];
  platform_status: {
    platform: string;
    platform_key: string;
    status: string;
    listing_url?: string;
    priority_tier: "PRIMARY" | "SECONDARY" | "BLOCKED";
  }[];
  organism_verdict: "WINNER" | "TESTING" | "NEEDS_LISTING" | "NEEDS_UPLOAD";
  next_action: string;
}

interface AmazonQueueState {
  tier: number;
  tier_target: number;
  slots_used: number;
  slots_total: number;
  slots_remaining: number;
  designs_awaiting_amazon: number;
  days_to_clear_queue: number;
  constraint: string;
  next_action: string;
}

// ─── Signal Collectors ────────────────────────────────────────────────────────

function collectDesignSignals() {
  const total = designQueue.length;
  const withListings = designQueue.filter(d => d.aiListing).length;
  const withoutListings = total - withListings;

  const platformCoverage: Record<string, { live: number; queued: number; listing_ready: number; failed: number }> = {};
  for (const platform of ["amazon_merch", "redbubble", "etsy", "spring", "spreadshirt"]) {
    platformCoverage[platform] = { live: 0, queued: 0, listing_ready: 0, failed: 0 };
  }

  for (const design of designQueue) {
    for (const p of design.platforms) {
      const cov = platformCoverage[p.platform];
      if (!cov) continue;
      if (p.status === "live") cov.live++;
      else if (p.status === "queued" || p.status === "generating_listing") cov.queued++;
      else if (p.status === "listing_ready") cov.listing_ready++;
      else if (p.status === "failed") cov.failed++;
    }
  }

  const totalPlatformSlots = total * 5;
  const totalLive = Object.values(platformCoverage).reduce((a, c) => a + c.live, 0);
  const coveragePercent = totalPlatformSlots > 0 ? Math.round((totalLive / totalPlatformSlots) * 100) : 0;

  return {
    total_designs: total,
    designs_with_listings: withListings,
    designs_without_listings: withoutListings,
    platform_coverage: platformCoverage,
    total_live_listings: totalLive,
    coverage_percent: coveragePercent,
    // Proven signal: F-15 sticker on Redbubble = 4 organic sales
    proven_sales: 4,
    proven_platform: "redbubble",
    proven_design: "F-15 Strike Eagle",
  };
}

function collectAmazonSignals() {
  const amazonTier = 10;
  const amazonTierTarget = 25;
  const amazonSlotsTotal = 10;
  const amazonSlotsUsed = designQueue.filter(d =>
    d.platforms.find(p => p.platform === "amazon_merch" && p.status === "live")
  ).length;
  const amazonSlotsRemaining = Math.max(0, amazonSlotsTotal - amazonSlotsUsed);

  // Designs that want to be on Amazon but can't yet (slot-gated)
  const designsAwaitingAmazon = designQueue.filter(d =>
    d.platforms.find(p => p.platform === "amazon_merch" && (p.status === "queued" || p.status === "listing_ready"))
  ).length;

  return {
    tier: amazonTier,
    tier_target: amazonTierTarget,
    slots_total: amazonSlotsTotal,
    slots_used: amazonSlotsUsed,
    slots_remaining: amazonSlotsRemaining,
    designs_awaiting: designsAwaitingAmazon,
    // At 1 upload/day, how many days to clear the queue once slots open
    days_to_clear: designsAwaitingAmazon, // 1 per day
    organic_sales: 0,
    tier_up_requires_sales: 10,
  };
}

function collectPlatformSignals() {
  const designSignals = collectDesignSignals();
  const cov = designSignals.platform_coverage;

  return {
    redbubble: {
      live: cov.redbubble?.live ?? 0,
      queued: cov.redbubble?.queued ?? 0,
      capacity: "unlimited",
      proven_sales: 4,
      store_url: "https://www.redbubble.com/people/Jetfighter1/shop",
      priority: "PRIMARY",
    },
    spring: {
      live: cov.spring?.live ?? 0,
      queued: cov.spring?.queued ?? 0,
      capacity: "unlimited",
      proven_sales: 0,
      store_url: "https://dashboard.teespring.com/overview",
      priority: "PRIMARY",
    },
    spreadshirt: {
      live: cov.spreadshirt?.live ?? 0,
      queued: cov.spreadshirt?.queued ?? 0,
      capacity: "unlimited",
      proven_sales: 0,
      store_url: "https://partner.spreadshirt.com/account/personal",
      priority: "PRIMARY",
    },
    amazon_merch: {
      live: cov.amazon_merch?.live ?? 0,
      queued: cov.amazon_merch?.queued ?? 0,
      capacity: "10 slots (Tier 10)",
      proven_sales: 0,
      store_url: "https://merch.amazon.com/dashboard",
      priority: "SECONDARY",
    },
    etsy: {
      live: cov.etsy?.live ?? 1, // 1 active listing confirmed
      queued: cov.etsy?.queued ?? 0,
      capacity: "unlimited",
      proven_sales: 8, // 8 confirmed sales, 5★ review
      pattern_visits: 2941, // Pattern site visits — 0 conversions = major opportunity
      store_url: "https://www.etsy.com/shop/JetFighterClothing",
      priority: "PRIMARY",
    },
  };
}

// ─── Checks ───────────────────────────────────────────────────────────────────

function checkPrimaryPlatformCoverage(designSignals: ReturnType<typeof collectDesignSignals>): CheckResult {
  const cov = designSignals.platform_coverage;
  const rbLive = cov.redbubble?.live ?? 0;
  const springLive = cov.spring?.live ?? 0;
  const spreadshirtLive = cov.spreadshirt?.live ?? 0;
  const primaryLive = rbLive + springLive + spreadshirtLive;
  const totalDesigns = designSignals.total_designs;

  // All designs should be live on all 3 primary platforms (unlimited, no tier gate)
  const maxPrimary = totalDesigns * 3;
  const coverageRatio = maxPrimary > 0 ? primaryLive / maxPrimary : 0;

  if (coverageRatio >= 0.8) {
    return {
      name: "primary_platform_coverage",
      ok: true,
      severity: "info",
      detail: `${primaryLive}/${maxPrimary} primary platform slots live (${Math.round(coverageRatio * 100)}%)`,
      evidence: { rb_live: rbLive, spring_live: springLive, spreadshirt_live: spreadshirtLive },
    };
  }

  if (coverageRatio >= 0.3) {
    return {
      name: "primary_platform_coverage",
      ok: false,
      severity: "amber",
      detail: `Only ${primaryLive}/${maxPrimary} primary slots live — Redbubble/Spring/Spreadshirt have no tier gate, upload now`,
      evidence: { rb_live: rbLive, spring_live: springLive, spreadshirt_live: spreadshirtLive },
    };
  }

  return {
    name: "primary_platform_coverage",
    ok: false,
    severity: "red",
    detail: `Critical: only ${primaryLive}/${maxPrimary} primary slots live — unlimited platforms are underutilised`,
    evidence: { rb_live: rbLive, spring_live: springLive, spreadshirt_live: spreadshirtLive },
  };
}

function checkListingReadiness(designSignals: ReturnType<typeof collectDesignSignals>): CheckResult {
  const { designs_without_listings, total_designs } = designSignals;
  const withListings = designSignals.designs_with_listings;

  if (designs_without_listings === 0) {
    return {
      name: "listing_readiness",
      ok: true,
      severity: "info",
      detail: `All ${total_designs} designs have AI listings generated`,
      evidence: { with_listings: withListings, without_listings: 0 },
    };
  }

  if (designs_without_listings <= 2) {
    return {
      name: "listing_readiness",
      ok: false,
      severity: "amber",
      detail: `${designs_without_listings} design(s) still need AI listings — click "Generate Listings" to unblock`,
      evidence: { with_listings: withListings, without_listings: designs_without_listings },
    };
  }

  return {
    name: "listing_readiness",
    ok: false,
    severity: "red",
    detail: `${designs_without_listings} designs have no AI listings — engine cannot upload without listings`,
    evidence: { with_listings: withListings, without_listings: designs_without_listings },
  };
}

function checkAmazonTierConstraint(amazonSignals: ReturnType<typeof collectAmazonSignals>): CheckResult {
  const { slots_remaining, tier, tier_target, designs_awaiting } = amazonSignals;

  if (slots_remaining > 0) {
    return {
      name: "amazon_tier_constraint",
      ok: true,
      severity: "info",
      detail: `Amazon Tier ${tier}: ${slots_remaining} slot(s) available`,
      evidence: { tier, slots_remaining, designs_awaiting },
    };
  }

  return {
    name: "amazon_tier_constraint",
    ok: false,
    severity: "amber",
    detail: `Amazon Tier ${tier}: 0 slots remaining — ${designs_awaiting} designs queued. Need 10 sales → Tier ${tier_target} (25 slots). Focus on primary platforms first.`,
    evidence: { tier, slots_remaining: 0, tier_target, designs_awaiting, sales_needed_for_tier_up: 10 },
  };
}

function checkRedbubbleProvenSignal(designSignals: ReturnType<typeof collectDesignSignals>): CheckResult {
  const rbLive = designSignals.platform_coverage.redbubble?.live ?? 0;
  const totalDesigns = designSignals.total_designs;

  if (rbLive >= totalDesigns) {
    return {
      name: "redbubble_proven_signal",
      ok: true,
      severity: "info",
      detail: `All ${totalDesigns} designs live on Redbubble — proven sales channel (4 organic sales confirmed)`,
      evidence: { rb_live: rbLive, proven_sales: 4 },
    };
  }

  const missing = totalDesigns - rbLive;
  return {
    name: "redbubble_proven_signal",
    ok: false,
    severity: "amber",
    detail: `${missing} design(s) not yet live on Redbubble — this is the PROVEN channel (4 organic sales). Upload these first.`,
    evidence: { rb_live: rbLive, missing, proven_sales: 4 },
  };
}

// ─── Health Derivation ────────────────────────────────────────────────────────

function deriveHealth(checks: CheckResult[]): { health: HealthState; bottleneck: string } {
  const redChecks = checks.filter(c => !c.ok && c.severity === "red");
  const amberChecks = checks.filter(c => !c.ok && c.severity === "amber");

  if (redChecks.length > 0) {
    return { health: "RED", bottleneck: redChecks[0].name };
  }
  if (amberChecks.length > 0) {
    return { health: "AMBER", bottleneck: amberChecks[0].name };
  }
  return { health: "GREEN", bottleneck: "none" };
}

// ─── Recommendation Registry ──────────────────────────────────────────────────

function getRecommendation(bottleneck: string, health: HealthState, signals: Record<string, unknown>): string {
  if (health === "GREEN") return "Organism healthy — run autonomous batch to expand coverage";

  const recs: Record<string, string> = {
    primary_platform_coverage: "Upload to Redbubble, Spring, and Spreadshirt first — unlimited capacity, no tier gate. Use 'Run Autonomous Batch'.",
    listing_readiness: "Generate AI listings for all designs — click 'Generate Listings' on each design card, or run the autonomous batch.",
    amazon_tier_constraint: "Amazon is full (Tier 10, 10/10 slots). Focus on Redbubble/Spring/Spreadshirt. Drive external traffic to Amazon to earn 10 sales → Tier 25.",
    redbubble_proven_signal: "Redbubble has proven organic sales (4 confirmed). Upload missing designs to Redbubble immediately.",
  };

  return recs[bottleneck] || "Review organism checks and resolve amber/red items.";
}

// ─── Design Gallery Builder ───────────────────────────────────────────────────

function buildDesignGallery(): DesignGalleryEntry[] {
  const PLATFORM_PRIORITY: Record<string, "PRIMARY" | "SECONDARY" | "BLOCKED"> = {
    redbubble: "PRIMARY",
    spring: "PRIMARY",
    spreadshirt: "PRIMARY",
    amazon_merch: "SECONDARY",
    etsy: "BLOCKED",
  };

  const PLATFORM_DISPLAY: Record<string, string> = {
    amazon_merch: "Amazon",
    redbubble: "Redbubble",
    etsy: "Etsy",
    spring: "Spring",
    spreadshirt: "Spreadshirt",
  };

  return designQueue.map(design => {
    const hasListing = !!design.aiListing;
    const allPrimaryLive = ["redbubble", "spring", "spreadshirt"].every(pk =>
      design.platforms.find(p => p.platform === pk)?.status === "live"
    );

    let verdict: DesignGalleryEntry["organism_verdict"];
    let nextAction: string;

    if (!hasListing) {
      verdict = "NEEDS_LISTING";
      nextAction = "Generate AI listings — click 'Generate Listings' or run autonomous batch";
    } else if (allPrimaryLive) {
      verdict = "WINNER";
      nextAction = "All primary platforms live — monitor sales signals";
    } else {
      const missingPrimary = ["redbubble", "spring", "spreadshirt"].filter(pk =>
        design.platforms.find(p => p.platform === pk)?.status !== "live"
      );
      verdict = "NEEDS_UPLOAD";
      nextAction = `Upload to: ${missingPrimary.map(p => PLATFORM_DISPLAY[p]).join(", ")}`;
    }

    return {
      id: design.id,
      name: design.name,
      aircraft: design.aircraft,
      signal_weight: design.signalWeight,
      priority: design.priority,
      has_listing: hasListing,
      listing_confidence: design.aiListing?.confidence,
      listing_title: design.aiListing?.title,
      listing_tags: design.aiListing?.tags?.slice(0, 8),
      platform_status: design.platforms.map(p => ({
        platform: PLATFORM_DISPLAY[p.platform] || p.platform,
        platform_key: p.platform,
        status: p.status,
        listing_url: p.listingUrl,
        priority_tier: PLATFORM_PRIORITY[p.platform] || "SECONDARY",
      })),
      organism_verdict: verdict,
      next_action: nextAction,
    };
  });
}

// ─── Platform Priority Groups ─────────────────────────────────────────────────

function buildPlatformPriorityGroups(
  platformSignals: ReturnType<typeof collectPlatformSignals>
): PlatformPriorityGroup[] {
  return [
    {
      tier: "PRIMARY",
      platform: "Redbubble",
      key: "redbubble",
      live_count: platformSignals.redbubble.live,
      queued_count: platformSignals.redbubble.queued,
      total_capacity: "Unlimited",
      constraint: "None — upload freely",
      health: platformSignals.redbubble.live > 0 ? "GREEN" : "AMBER",
      action: platformSignals.redbubble.live === 0 ? "Upload all designs — proven 4 organic sales" : "Expand — add more aircraft designs",
      store_url: platformSignals.redbubble.store_url,
    },
    {
      tier: "PRIMARY",
      platform: "Spring",
      key: "spring",
      live_count: platformSignals.spring.live,
      queued_count: platformSignals.spring.queued,
      total_capacity: "Unlimited",
      constraint: "None — upload freely",
      health: platformSignals.spring.live > 0 ? "GREEN" : "AMBER",
      action: platformSignals.spring.live === 0 ? "Activate — cross-post existing designs" : "Expand coverage",
      store_url: platformSignals.spring.store_url,
    },
    {
      tier: "PRIMARY",
      platform: "Spreadshirt",
      key: "spreadshirt",
      live_count: platformSignals.spreadshirt.live,
      queued_count: platformSignals.spreadshirt.queued,
      total_capacity: "Unlimited",
      constraint: "None — European market",
      health: platformSignals.spreadshirt.live > 0 ? "GREEN" : "AMBER",
      action: platformSignals.spreadshirt.live === 0 ? "Activate — European aviation fans" : "Expand coverage",
      store_url: platformSignals.spreadshirt.store_url,
    },
    {
      tier: "SECONDARY",
      platform: "Amazon Merch",
      key: "amazon_merch",
      live_count: platformSignals.amazon_merch.live,
      queued_count: platformSignals.amazon_merch.queued,
      total_capacity: "10 slots (Tier 10)",
      constraint: "Tier 10 — 10/10 slots used. Need 10 sales → Tier 25. 1 upload/day.",
      health: platformSignals.amazon_merch.live >= 10 ? "AMBER" : "GREEN",
      action: "Drive external traffic to existing listings → 10 sales → Tier 25 unlock",
      store_url: platformSignals.amazon_merch.store_url,
    },
    {
      tier: "PRIMARY",
      platform: "Etsy",
      key: "etsy",
      live_count: platformSignals.etsy.live,
      queued_count: platformSignals.etsy.queued,
      total_capacity: "Unlimited",
      constraint: "Traffic down 93% YoY (2 visits/30d). Root cause: only 1 listing. More listings = more Etsy search surface.",
      health: "AMBER",
      action: "Add designs to Etsy NOW — 1 listing starves the algorithm. Each new listing = new search entry point.",
      store_url: platformSignals.etsy.store_url,
    },
  ];
}

// ─── Organism Snapshot Builder ────────────────────────────────────────────────

function buildOrganismSnapshot(): OrganismSnapshot {
  const designSignals = collectDesignSignals();
  const amazonSignals = collectAmazonSignals();
  const platformSignals = collectPlatformSignals();

  const checks: CheckResult[] = [
    checkPrimaryPlatformCoverage(designSignals),
    checkListingReadiness(designSignals),
    checkAmazonTierConstraint(amazonSignals),
    checkRedbubbleProvenSignal(designSignals),
  ];

  const { health, bottleneck } = deriveHealth(checks);
  const recommendation = getRecommendation(bottleneck, health, {});

  const amazonQueue: AmazonQueueState = {
    tier: amazonSignals.tier,
    tier_target: amazonSignals.tier_target,
    slots_used: amazonSignals.slots_used,
    slots_total: amazonSignals.slots_total,
    slots_remaining: Math.max(0, amazonSignals.slots_total - amazonSignals.slots_used),
    designs_awaiting_amazon: amazonSignals.designs_awaiting,
    days_to_clear_queue: amazonSignals.days_to_clear,
    constraint: "Tier 10 — 10 slots maximum. Need 10 organic sales to unlock Tier 25 (25 slots).",
    next_action: amazonSignals.slots_remaining > 0
      ? "Slot available — upload next design"
      : "Drive external traffic to existing Amazon listings to earn 10 sales → Tier 25",
  };

  return {
    ok: health !== "RED",
    organism: "jetfighter1_pod",
    timestamp_utc: new Date().toISOString(),
    health_state: health,
    current_bottleneck: bottleneck,
    next_recommended_action: recommendation,
    checks,
    signals: {
      designs: designSignals,
      amazon: amazonSignals,
      platforms: platformSignals,
    },
    platform_priority: buildPlatformPriorityGroups(platformSignals),
    design_gallery: buildDesignGallery(),
    amazon_queue: amazonQueue,
    metadata: {
      product: "Jetfighter1 POD Store",
      proven_revenue_signal: "F-15 sticker on Redbubble — 4 organic sales (AU, US, NZ)",
      strategy: "Primary platforms first (unlimited). Amazon secondary (tier-gated). Sticker-first product strategy.",
      organism_version: "1.0.0",
    },
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const podOrganismRouter = router({

  /**
   * GET /api/trpc/podOrganism.getState
   * Returns the full organism snapshot — health, checks, design gallery, platform priority
   */
  getState: publicProcedure.query(() => {
    return buildOrganismSnapshot();
  }),

  /**
   * Get just the health summary — lightweight poll for header indicators
   */
  getHealthSummary: publicProcedure.query(() => {
    const snapshot = buildOrganismSnapshot();
    return {
      health_state: snapshot.health_state,
      bottleneck: snapshot.current_bottleneck,
      next_action: snapshot.next_recommended_action,
      total_designs: (snapshot.signals.designs as any).total_designs,
      total_live: (snapshot.signals.designs as any).total_live_listings,
      coverage_percent: (snapshot.signals.designs as any).coverage_percent,
      amazon_slots_remaining: snapshot.amazon_queue.slots_remaining,
    };
  }),
});
