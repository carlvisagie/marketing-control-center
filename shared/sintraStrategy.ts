/**
 * Sintra Marketing Strategy Configuration
 * 
 * This file contains the complete advertising strategy from the Sintra system.
 * Used across the Marketing Control Center for content generation, scheduling,
 * A/B testing, and compliance checking.
 */

// ============================================================================
// CORE POSITIONING
// ============================================================================

export const CORE_POSITIONING = {
  oneSentence: "Just Talk is a private, always-available conversation line for people who want a supportive voice right now—without scheduling, without judgment, and without the cost of traditional options.",
  
  complianceRule: "Do not say or imply the viewer is lonely/depressed/anxious. Use general language: 'For anyone who wants someone to talk to.'",
};

// ============================================================================
// OFFER STACK
// ============================================================================

export const OFFER_STACK = {
  primary: {
    name: "Monthly Subscription",
    price: 29,
    period: "month",
    tagline: "Someone to listen. 24/7. $29/month.",
  },
  annual: {
    name: "Annual Plan (Best Deal)",
    price: 290,
    period: "year",
    savings: "2 months free",
    defaultSelection: true,
  },
  trial: {
    name: "7-Day Trial",
    price: 7,
    period: "7 days",
    autoConvert: true,
    convertTo: "monthly",
  },
  founderBundle: {
    name: "Founder Bundle (Limited)",
    price: 79,
    type: "one-time",
    includes: [
      "Favorite Persona pin (fast access)",
      "Conversation Starters Pack",
      "Night Mode Calm Pack",
    ],
  },
  b2bPilot: {
    name: "B2B Pilot",
    price: 49,
    period: "seat/month",
    minimumSeats: 25,
    positioning: "After-hours support companion (not mental health treatment)",
  },
};

// ============================================================================
// LANDING PAGE STRUCTURE
// ============================================================================

export const LANDING_PAGE = {
  hero: {
    headline: "It's 3 AM. Who can you call?",
    subhead: "A private, supportive conversation—available anytime.",
    disclaimer: "Not a substitute for professional care. If you're in immediate danger, call local emergency services.",
  },
  ctas: {
    primary: { text: "Start Now (Call)", action: "call" },
    secondary: { text: "Try 7 Days for $7", action: "trial" },
  },
  trustRow: [
    "Private by design",
    "Always available",
    "Cancel anytime",
    "No scheduling",
  ],
  faq: [
    {
      question: "Is this therapy?",
      answer: "No. It's supportive conversation and guidance tools; not diagnosis or treatment.",
    },
    {
      question: "What about crises?",
      answer: "We provide crisis resources and encourage contacting local emergency services.",
    },
  ],
};

// ============================================================================
// PAID ACQUISITION CAMPAIGNS
// ============================================================================

export const META_CAMPAIGNS = {
  campaignA: {
    name: "Cold Prospecting",
    objective: "Conversions",
    adSets: [
      {
        name: "A1: Broad",
        targeting: "25-55, English, US/CA/UK/AU",
      },
      {
        name: "A2: Interests",
        targeting: "productivity, entrepreneurship, working parents, caregiving, remote work",
      },
      {
        name: "A3: Lookalike",
        targeting: "Lookalike (once you have 500+ converters)",
        requirement: "500+ converters",
      },
    ],
  },
  campaignB: {
    name: "Retargeting",
    objective: "Conversions",
    audiences: ["7-day site visitors", "14-day site visitors", "30-day site visitors"],
    offers: ["7 days for $7", "Annual saves 2 months"],
    creative: "social proof + clarity",
  },
};

export const CREATIVE_ANGLES = [
  { id: "3am", name: "3 AM Problem/Solution", description: "Your current best" },
  { id: "no-schedule", name: "No Schedule", description: "Speed/convenience" },
  { id: "private", name: "Private", description: "Trust/confidentiality" },
  { id: "value", name: "Cheaper than alternatives", description: "Value (avoid mentioning therapy as comparator)" },
];

// ============================================================================
// TIKTOK STRATEGY
// ============================================================================

export const TIKTOK_STRATEGY = {
  approach: "Organic-first, then paid",
  contentPillars: [
    {
      type: "POV skits",
      example: "When you want to talk but don't want to worry anyone",
    },
    {
      type: "Mini-scripts",
      example: "What to say when your chest feels tight (grounding prompts, not clinical claims)",
    },
    {
      type: "Product demo",
      example: "tap-to-call, privacy promise, cancel anytime",
    },
    {
      type: "Founder story",
      example: "why it exists, the mission (trust-building)",
    },
  ],
  postingCadence: "1 TikTok/day for 30 days",
};

// ============================================================================
// SINTRA EMPLOYEE ROLES
// ============================================================================

export const SINTRA_ROLES = {
  soshie: {
    name: "Soshie",
    role: "Social Media",
    weeklyTasks: [
      "Publish: 1 TikTok/day, 1 IG Reel/day, 3 IG Stories/day, 3 FB posts/week, 2 LinkedIn posts/week",
      "Manage creator outreach: 20 DMs/day to micro-creators for UGC",
    ],
  },
  penn: {
    name: "Penn",
    role: "Copywriting",
    weeklyTasks: [
      "10 hooks",
      "5 ad scripts (15-25s)",
      "5 long-form captions",
      "3 landing page variants (hero + CTA + FAQ)",
    ],
  },
  emmie: {
    name: "Emmie",
    role: "Email",
    flows: [
      { name: "Welcome", day: 0 },
      { name: "Activation", days: "1-3" },
      { name: "Habit loop", days: "4-10" },
      { name: "Trial conversion", days: "6-7" },
      { name: "Winback", days: "21/30" },
    ],
  },
  dexter: {
    name: "Dexter",
    role: "Data",
    dailyDashboard: ["spend", "CAC", "trial start rate", "trial→paid", "churn D7/D30", "LTV proxy"],
    creativeScoring: ["thumbstop rate", "hold rate", "CTR", "CVR"],
  },
  commet: {
    name: "Commet",
    role: "Web Builder",
    weeklyTasks: [
      "Implement landing improvements + A/B tests weekly",
      "Speed + mobile-first call CTA",
    ],
  },
  buddy: {
    name: "Buddy",
    role: "Biz Dev",
    dailyTasks: [
      "LinkedIn: 30 outreach/day to HR/People Ops for 25-seat pilot",
    ],
  },
};

// ============================================================================
// PRODUCTION-READY AD SCRIPTS
// ============================================================================

export const AD_SCRIPTS = {
  video15s: {
    name: "15s Video Script",
    onScreen: [
      "It's late. You don't want to wake anyone.",
      "Tap. Talk. Feel lighter.",
    ],
    voiceover: "Just Talk is a private, supportive conversation line—available 24/7.",
    cta: "Try 7 days for $7.",
  },
  static: {
    name: "Static Ad",
    headline: "A supportive conversation, anytime.",
    body: "No scheduling. Private by design. Cancel anytime.",
    cta: "Start now",
  },
  retarget: {
    name: "Retarget Ad",
    headline: "Keep it simple: $29/month, anytime access.",
    body: "Unlimited supportive chats + fast start.",
    cta: "Subscribe",
  },
};

// ============================================================================
// EXECUTION PHASES
// ============================================================================

export const EXECUTION_PHASES = {
  day0: {
    name: "Day 0: Launch Checklist",
    tasks: [
      "Add Annual Plan + 7-day $7 trial to checkout",
      "Update landing hero + disclaimer + FAQ (as above)",
      "Install tracking: Meta Pixel + CAPI, TikTok Pixel, Google Analytics events",
    ],
    trackingEvents: ["ViewContent", "StartTrial", "SubscribeMonthly", "SubscribeAnnual", "CallTap"],
  },
  days1to7: {
    name: "Days 1-7: Proof Week",
    tasks: [
      "Publish daily TikTok + IG Reels (same cut, platform-native captions)",
      "Run Meta Campaign A (cold) + B (retarget)",
      "Collect 10 UGC videos from creators (pay small flat fee; secure usage rights)",
    ],
  },
  days8to30: {
    name: "Days 8-30: Scale Week",
    tasks: [
      "Kill losers fast: anything under target CTR/CVR after spend threshold",
      "Expand to lookalikes",
      "Launch LinkedIn outbound for B2B pilot",
    ],
  },
};

// ============================================================================
// KPI TARGETS
// ============================================================================

export const KPI_TARGETS = {
  landingPageCVR: { target: 5, unit: "%", description: "visitor → trial" },
  trialToPaid: { target: 35, unit: "%", description: "trial → paid subscriber" },
  blendedCAC: { target: 45, unit: "$", description: "≤ 1.5 months revenue" },
  d30Retention: { target: 55, unit: "%", description: "30-day retention rate" },
  annualAttachRate: { target: 20, unit: "%", description: "% of new subs choosing annual" },
};

// ============================================================================
// A/B TESTS (One per week)
// ============================================================================

export const WEEKLY_AB_TESTS = [
  {
    week: 1,
    name: "CTA Wording",
    variantA: "Start Now",
    variantB: "Talk Now",
  },
  {
    week: 2,
    name: "Trial Pricing",
    variantA: "7-day $7",
    variantB: "3-day $3",
  },
  {
    week: 3,
    name: "Hero Headline",
    variantA: "3 AM",
    variantB: "No schedule",
  },
  {
    week: 4,
    name: "Trust Row Order",
    variantA: "Privacy first",
    variantB: "Availability first",
  },
];

// ============================================================================
// COMPLIANCE: BANNED PHRASES
// ============================================================================

export const COMPLIANCE = {
  bannedPhrases: [
    "If you're lonely",
    "For your depression",
    "If you're depressed",
    "If you're anxious",
    "Mental health treatment",
    "Therapy replacement",
    "Cure your",
    "Fix your",
    "We know you're struggling",
  ],
  safePhrases: [
    "For anyone who wants someone to talk to",
    "A supportive conversation",
    "Available anytime",
    "Private by design",
    "No scheduling needed",
    "Cancel anytime",
    "Real conversations",
    "Someone who listens",
  ],
  platformRules: {
    meta: "No personal-attribute targeting language. No implying knowledge of viewer's health status.",
    tiktok: "Keep content safe. Avoid claims that could be considered medical/treatment. Stricter rules around sensitive categories.",
    appStore: "Avoid medical treatment claims. Clearly disclose limitations.",
  },
};
