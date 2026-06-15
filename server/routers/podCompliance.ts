/**
 * POD Compliance Engine
 *
 * Enforces every platform's content, trademark, formatting, and listing rules
 * BEFORE any listing is generated or dispatched. Zero tolerance for violations
 * that could cause rejections or account suspension.
 *
 * Platform rules researched from official sources:
 * - Amazon Merch: https://merch.amazon.com/resource/201858630
 * - Redbubble: https://help.redbubble.com/hc/en-us/articles/202270929
 * - Etsy: https://www.etsy.com/legal/sellers/ + Creativity Standards
 * - Spring (Teespring): https://teespring.com/policies/acceptable-use
 * - Spreadshirt: https://help.spreadshirt.com/hc/en-us/articles/206779259
 */

import { router, publicProcedure as procedure } from "../_core/trpc";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE RULE DATABASES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Amazon Merch — Known trigger words that cause automatic rejection.
 * Sourced from community-verified lists + official content policy.
 * These are words Amazon's algorithm flags regardless of context.
 */
const AMAZON_TRIGGER_WORDS = [
  // Olympics / Sports organisations (trademarked)
  "olympic", "olympics", "paralympic", "paralympics", "superbowl", "super bowl",
  "nfl", "nba", "mlb", "nhl", "fifa", "uefa", "espn",
  // Premium product descriptors (Amazon rejects these in listing text)
  "premium", "best quality", "highest quality", "top quality", "superior quality",
  "luxury", "exclusive", "limited edition", "authentic", "genuine", "official",
  "licensed", "authorized", "certified", "endorsed",
  // Misleading claims
  "guaranteed", "100% satisfaction", "money back", "free shipping",
  "on sale", "discount", "clearance", "buy one get one",
  // Review solicitation
  "leave a review", "please review", "5 star", "five star",
  // Charity / donation claims
  "proceeds go to", "donate", "charity", "non-profit",
  // Competitor references
  "redbubble", "teespring", "spreadshirt", "zazzle", "cafepress",
  // Profanity / adult content triggers
  "fuck", "shit", "ass", "bitch", "cunt", "dick", "cock", "pussy",
  "porn", "sex", "nude", "naked", "xxx",
  // Violence / hate
  "kill", "murder", "terrorist", "isis", "nazi", "kkk", "white power",
  "white supremacy", "genocide",
  // Human tragedy exploitation
  "9/11", "september 11", "hurricane katrina", "covid", "pandemic",
  // Misleading product descriptors
  "handmade", "hand-crafted", "hand crafted", "artisan", "custom made",
  "made to order", "personalized" // these require actual personalization
];

/**
 * Amazon Merch — Words that are SAFE for military aviation niche.
 * These are explicitly NOT trademarked for apparel use.
 */
const AMAZON_SAFE_MILITARY_TERMS = [
  "f-15", "f15", "f-16", "f16", "f-22", "f22", "f-35", "f35",
  "a-10", "a10", "sr-71", "sr71", "b-52", "b52", "p-51", "p51",
  "strike eagle", "warthog", "viper", "raptor", "blackbird", "lightning",
  "stratofortress", "mustang",
  "military aviation", "aviation art", "fighter jet", "fighter pilot",
  "air force", "usaf", "navy pilot", "marine corps aviation",
  "combat aircraft", "warbird", "jet aircraft", "military aircraft",
  "veteran", "veteran gift", "pilot gift", "aviation gift",
  "airshow", "flight suit", "cockpit", "afterburner", "supersonic",
  "mach", "altitude", "squadron", "wingman", "sortie"
];

/**
 * Trademark risk terms for military aviation — require careful use.
 * These are aircraft designations that may have trademark claims
 * in specific contexts (e.g., as brand names for toys/models).
 */
const AVIATION_TRADEMARK_CAUTION = [
  // Lockheed Martin trademarks (aircraft names used as brand names)
  // NOTE: Using aircraft designations (F-35) is generally safe.
  // Using "Lockheed Martin" as if endorsed is NOT safe.
  "lockheed martin", "boeing defense", "northrop grumman", "general dynamics",
  "raytheon", "pratt & whitney", "ge aviation",
  // Military unit names that could imply endorsement
  "thunderbirds", "blue angels", "red arrows", "frecce tricolori",
  // These are trademarked display team names — use with caution
];

/**
 * Amazon Merch — Title formatting rules
 */
const AMAZON_TITLE_RULES = {
  maxLength: 60,
  minLength: 10,
  // Forbidden characters in titles
  forbiddenChars: ["!", "?", "*", "@", "#", "$", "%", "^", "&", "(", ")", "+", "=", "{", "}", "[", "]", "|", "\\", "<", ">", "/"],
  // Cannot start with these
  forbiddenStartWords: ["the", "a", "an", "buy", "shop", "get", "order"],
  // Cannot repeat keywords more than twice
  maxKeywordRepeat: 2,
  // Must not be all caps
  noAllCaps: true,
};

/**
 * Amazon Merch — Bullet point rules
 */
const AMAZON_BULLET_RULES = {
  maxLength: 256,
  maxBullets: 5,
  minBullets: 2,
  // Cannot contain URLs
  noUrls: true,
  // Cannot contain HTML
  noHtml: true,
};

/**
 * Amazon Merch — Description rules
 */
const AMAZON_DESCRIPTION_RULES = {
  maxLength: 2000,
  noUrls: true,
  noHtml: true,
  noContactInfo: true,
};

/**
 * Redbubble — Content rules
 */
const REDBUBBLE_RULES = {
  maxTags: 15,
  maxTitleLength: 60,
  maxDescriptionLength: 1000,
  // Must mark mature content if applicable
  matureContentTriggers: ["blood", "gore", "violence", "gun", "weapon", "nude", "sex", "adult"],
  // Prohibited content
  prohibited: ["pornography", "child exploitation", "racism", "hate speech", "defamation"],
  // Bots/fake accounts prohibited — our engine must not simulate human behavior
  noFakeEngagement: true,
};

/**
 * Etsy — POD-specific rules (2026)
 */
const ETSY_RULES = {
  maxTags: 13,
  maxTitleLength: 140,
  maxDescriptionLength: 10000,
  // REQUIRED: Production partner must be disclosed
  requiresProductionPartnerDisclosure: true,
  // REQUIRED: Design must be original (not purchased templates, stock art)
  requiresOriginalDesign: true,
  // FORBIDDEN: Claiming handmade when using POD
  forbiddenClaims: ["handmade", "hand made", "hand-made", "made by hand", "crafted by me", "i made this"],
  // FORBIDDEN: Claiming official/licensed
  forbiddenEndorsementClaims: ["official", "licensed", "authorized", "endorsed by", "approved by"],
  // Tags must be specific long-tail phrases, not single generic words
  minTagLength: 3,
  // All 13 tags must be used
  requireAllTags: true,
};

/**
 * Spring (Teespring) — Content rules
 */
const SPRING_RULES = {
  maxTitleLength: 60,
  maxDescriptionLength: 500,
  // Prohibited
  prohibited: ["violence", "hate speech", "self-harm", "harassment", "terrorism"],
  // Adult content must be flagged
  adultContentTriggers: ["nude", "sex", "adult", "explicit"],
};

/**
 * Spreadshirt — Content rules
 */
const SPREADSHIRT_RULES = {
  maxTitleLength: 60,
  maxDescriptionLength: 500,
  // Explicitly prohibited categories
  prohibited: [
    "unofficial merchandise",
    "musical artists names or logos",
    "sports teams logos",
    "cartoon characters",
    "video game characters",
    "movie characters",
    "tv show characters",
    "celebrity photos",
    "company trademarks",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE CHECKER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

interface ComplianceViolation {
  severity: "BLOCK" | "WARN" | "INFO";
  rule: string;
  field: string;
  detail: string;
  fix: string;
}

interface ComplianceResult {
  platform: string;
  passed: boolean;
  score: number; // 0-100
  violations: ComplianceViolation[];
  warnings: ComplianceViolation[];
  suggestions: string[];
  safeToUpload: boolean;
}

function checkAmazonCompliance(listing: {
  title: string;
  bullets: string[];
  description: string;
  brand?: string;
}): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceViolation[] = [];
  const suggestions: string[] = [];

  const fullText = `${listing.title} ${listing.bullets.join(" ")} ${listing.description} ${listing.brand || ""}`.toLowerCase();

  // 1. Check trigger words
  for (const word of AMAZON_TRIGGER_WORDS) {
    if (fullText.includes(word.toLowerCase())) {
      violations.push({
        severity: "BLOCK",
        rule: "Amazon Content Policy — Trigger Word",
        field: "listing_text",
        detail: `Trigger word detected: "${word}"`,
        fix: `Remove "${word}" from all listing fields. Amazon's algorithm will auto-reject.`,
      });
    }
  }

  // 2. Check trademark caution terms
  for (const term of AVIATION_TRADEMARK_CAUTION) {
    if (fullText.includes(term.toLowerCase())) {
      warnings.push({
        severity: "WARN",
        rule: "Trademark Caution",
        field: "listing_text",
        detail: `Trademark-sensitive term: "${term}"`,
        fix: `Review usage of "${term}". Do not imply official endorsement. Use descriptively only.`,
      });
    }
  }

  // 3. Title length
  if (listing.title.length > AMAZON_TITLE_RULES.maxLength) {
    violations.push({
      severity: "BLOCK",
      rule: "Amazon Title Length",
      field: "title",
      detail: `Title is ${listing.title.length} chars (max ${AMAZON_TITLE_RULES.maxLength})`,
      fix: `Shorten title to ${AMAZON_TITLE_RULES.maxLength} characters or fewer.`,
    });
  }

  if (listing.title.length < AMAZON_TITLE_RULES.minLength) {
    violations.push({
      severity: "BLOCK",
      rule: "Amazon Title Too Short",
      field: "title",
      detail: `Title is only ${listing.title.length} chars (min ${AMAZON_TITLE_RULES.minLength})`,
      fix: "Add more descriptive keywords to the title.",
    });
  }

  // 4. Forbidden characters in title
  for (const char of AMAZON_TITLE_RULES.forbiddenChars) {
    if (listing.title.includes(char)) {
      violations.push({
        severity: "BLOCK",
        rule: "Amazon Title Forbidden Character",
        field: "title",
        detail: `Forbidden character "${char}" in title`,
        fix: `Remove "${char}" from title.`,
      });
    }
  }

  // 5. All caps check
  const titleWords = listing.title.split(" ");
  const allCapsWords = titleWords.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (allCapsWords.length > 2) {
    warnings.push({
      severity: "WARN",
      rule: "Amazon Title Formatting",
      field: "title",
      detail: `Too many ALL CAPS words: ${allCapsWords.join(", ")}`,
      fix: "Use Title Case, not ALL CAPS. Amazon may suppress all-caps listings.",
    });
  }

  // 6. Keyword repetition check
  const words = listing.title.toLowerCase().split(/\s+/);
  const wordCount: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }
  for (const [word, count] of Object.entries(wordCount)) {
    if (count > AMAZON_TITLE_RULES.maxKeywordRepeat) {
      warnings.push({
        severity: "WARN",
        rule: "Amazon Keyword Stuffing",
        field: "title",
        detail: `"${word}" appears ${count} times in title (max ${AMAZON_TITLE_RULES.maxKeywordRepeat})`,
        fix: `Reduce "${word}" to appear at most twice in the title.`,
      });
    }
  }

  // 7. Bullet count
  if (listing.bullets.length < AMAZON_BULLET_RULES.minBullets) {
    warnings.push({
      severity: "WARN",
      rule: "Amazon Bullet Count",
      field: "bullets",
      detail: `Only ${listing.bullets.length} bullets (recommended min ${AMAZON_BULLET_RULES.minBullets})`,
      fix: "Add more bullet points to improve listing quality score.",
    });
  }

  // 8. Bullet length
  for (let i = 0; i < listing.bullets.length; i++) {
    if (listing.bullets[i].length > AMAZON_BULLET_RULES.maxLength) {
      violations.push({
        severity: "BLOCK",
        rule: "Amazon Bullet Length",
        field: `bullet_${i + 1}`,
        detail: `Bullet ${i + 1} is ${listing.bullets[i].length} chars (max ${AMAZON_BULLET_RULES.maxLength})`,
        fix: `Shorten bullet ${i + 1} to ${AMAZON_BULLET_RULES.maxLength} characters.`,
      });
    }
  }

  // 9. URL check
  const urlPattern = /https?:\/\/|www\./i;
  if (urlPattern.test(fullText)) {
    violations.push({
      severity: "BLOCK",
      rule: "Amazon No External URLs",
      field: "listing_text",
      detail: "External URL detected in listing",
      fix: "Remove all URLs from title, bullets, and description.",
    });
  }

  // 10. Contact info check
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (emailPattern.test(fullText)) {
    violations.push({
      severity: "BLOCK",
      rule: "Amazon No Contact Info",
      field: "listing_text",
      detail: "Email address detected in listing",
      fix: "Remove all contact information from listing.",
    });
  }

  // Suggestions for aviation niche
  const hasGiftKeyword = fullText.includes("gift");
  const hasVeteranKeyword = fullText.includes("veteran");
  const hasPilotKeyword = fullText.includes("pilot");
  if (!hasGiftKeyword) suggestions.push("Add 'gift' to title or bullets — aviation gifts are high-converting search terms.");
  if (!hasVeteranKeyword && !hasPilotKeyword) suggestions.push("Add 'veteran' or 'pilot' to target the most active aviation buyers.");

  const blockCount = violations.filter(v => v.severity === "BLOCK").length;
  const warnCount = warnings.length;
  const score = Math.max(0, 100 - (blockCount * 25) - (warnCount * 5));

  return {
    platform: "amazon_merch",
    passed: blockCount === 0,
    score,
    violations,
    warnings,
    suggestions,
    safeToUpload: blockCount === 0,
  };
}

function checkRedbubbleCompliance(listing: {
  title: string;
  tags: string[];
  description: string;
}): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceViolation[] = [];
  const suggestions: string[] = [];

  // 1. Tag count
  if (listing.tags.length > REDBUBBLE_RULES.maxTags) {
    violations.push({
      severity: "BLOCK",
      rule: "Redbubble Tag Limit",
      field: "tags",
      detail: `${listing.tags.length} tags (max ${REDBUBBLE_RULES.maxTags})`,
      fix: `Reduce tags to ${REDBUBBLE_RULES.maxTags} or fewer. Prioritise most specific tags.`,
    });
  }

  // 2. Title length
  if (listing.title.length > REDBUBBLE_RULES.maxTitleLength) {
    violations.push({
      severity: "BLOCK",
      rule: "Redbubble Title Length",
      field: "title",
      detail: `Title is ${listing.title.length} chars (max ${REDBUBBLE_RULES.maxTitleLength})`,
      fix: `Shorten title to ${REDBUBBLE_RULES.maxTitleLength} characters.`,
    });
  }

  // 3. Mature content check
  const fullText = `${listing.title} ${listing.tags.join(" ")} ${listing.description}`.toLowerCase();
  for (const trigger of REDBUBBLE_RULES.matureContentTriggers) {
    if (fullText.includes(trigger)) {
      warnings.push({
        severity: "WARN",
        rule: "Redbubble Mature Content",
        field: "listing_text",
        detail: `Mature content trigger: "${trigger}"`,
        fix: `Mark this work as Mature Content during upload if it contains ${trigger}.`,
      });
    }
  }

  // 4. Copyright check — aviation niche specific
  const copyrightTerms = ["top gun", "maverick", "call of duty", "battlefield", "ace combat"];
  for (const term of copyrightTerms) {
    if (fullText.includes(term)) {
      violations.push({
        severity: "BLOCK",
        rule: "Redbubble Copyright Violation",
        field: "listing_text",
        detail: `Copyrighted term: "${term}"`,
        fix: `Remove "${term}" — this is a registered trademark/copyright.`,
      });
    }
  }

  // 5. Duplicate tags
  const uniqueTags = new Set(listing.tags.map(t => t.toLowerCase()));
  if (uniqueTags.size < listing.tags.length) {
    warnings.push({
      severity: "WARN",
      rule: "Redbubble Duplicate Tags",
      field: "tags",
      detail: "Duplicate tags detected",
      fix: "Remove duplicate tags. Each tag should be unique.",
    });
  }

  // Suggestions
  if (listing.tags.length < 10) suggestions.push("Use all 15 tags for maximum discoverability on Redbubble.");
  if (!fullText.includes("sticker")) suggestions.push("Add 'sticker' as a tag — your sticker sales prove this is a winning product type.");

  const blockCount = violations.filter(v => v.severity === "BLOCK").length;
  const score = Math.max(0, 100 - (blockCount * 25) - (warnings.length * 5));

  return {
    platform: "redbubble",
    passed: blockCount === 0,
    score,
    violations,
    warnings,
    suggestions,
    safeToUpload: blockCount === 0,
  };
}

function checkEtsyCompliance(listing: {
  title: string;
  tags: string[];
  description: string;
  hasProductionPartnerDisclosed: boolean;
}): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceViolation[] = [];
  const suggestions: string[] = [];

  const fullText = `${listing.title} ${listing.tags.join(" ")} ${listing.description}`.toLowerCase();

  // 1. CRITICAL: Production partner disclosure
  if (!listing.hasProductionPartnerDisclosed) {
    violations.push({
      severity: "BLOCK",
      rule: "Etsy Production Partner Disclosure — REQUIRED",
      field: "shop_settings",
      detail: "POD provider not disclosed as production partner",
      fix: "Go to Etsy Shop Manager → Settings → Production Partners and add your POD provider (e.g., Printful, Printify). This is MANDATORY for all POD listings.",
    });
  }

  // 2. Tag count
  if (listing.tags.length > ETSY_RULES.maxTags) {
    violations.push({
      severity: "BLOCK",
      rule: "Etsy Tag Limit",
      field: "tags",
      detail: `${listing.tags.length} tags (max ${ETSY_RULES.maxTags})`,
      fix: `Reduce tags to exactly ${ETSY_RULES.maxTags}.`,
    });
  }

  if (listing.tags.length < ETSY_RULES.maxTags) {
    warnings.push({
      severity: "WARN",
      rule: "Etsy Tags Not Maximised",
      field: "tags",
      detail: `Only ${listing.tags.length}/${ETSY_RULES.maxTags} tags used`,
      fix: `Use all ${ETSY_RULES.maxTags} tags. Each unused tag is a missed search opportunity.`,
    });
  }

  // 3. Forbidden claims (handmade, etc.)
  for (const claim of ETSY_RULES.forbiddenClaims) {
    if (fullText.includes(claim)) {
      violations.push({
        severity: "BLOCK",
        rule: "Etsy Handmade Claim Violation",
        field: "listing_text",
        detail: `Forbidden claim for POD: "${claim}"`,
        fix: `Remove "${claim}" — POD items cannot claim to be handmade. Use "designed by" instead.`,
      });
    }
  }

  // 4. Endorsement claims
  for (const claim of ETSY_RULES.forbiddenEndorsementClaims) {
    if (fullText.includes(claim)) {
      violations.push({
        severity: "BLOCK",
        rule: "Etsy False Endorsement",
        field: "listing_text",
        detail: `Endorsement claim: "${claim}"`,
        fix: `Remove "${claim}" — cannot imply official endorsement.`,
      });
    }
  }

  // 5. Title length
  if (listing.title.length > ETSY_RULES.maxTitleLength) {
    violations.push({
      severity: "BLOCK",
      rule: "Etsy Title Length",
      field: "title",
      detail: `Title is ${listing.title.length} chars (max ${ETSY_RULES.maxTitleLength})`,
      fix: `Shorten title to ${ETSY_RULES.maxTitleLength} characters.`,
    });
  }

  // 6. Tag quality check
  const shortTags = listing.tags.filter(t => t.length < ETSY_RULES.minTagLength);
  if (shortTags.length > 0) {
    warnings.push({
      severity: "WARN",
      rule: "Etsy Tag Quality",
      field: "tags",
      detail: `Short/generic tags: ${shortTags.join(", ")}`,
      fix: "Use long-tail phrases as tags (e.g., 'fighter pilot gift' not just 'pilot').",
    });
  }

  // Suggestions
  if (!fullText.includes("gift")) suggestions.push("Add gift-focused tags like 'fighter pilot gift', 'aviation lover gift' — these drive Etsy sales.");
  if (!fullText.includes("wall art") && !fullText.includes("poster")) suggestions.push("Consider listing as wall art/poster too — aviation art sells well on Etsy.");

  const blockCount = violations.filter(v => v.severity === "BLOCK").length;
  const score = Math.max(0, 100 - (blockCount * 25) - (warnings.length * 5));

  return {
    platform: "etsy",
    passed: blockCount === 0,
    score,
    violations,
    warnings,
    suggestions,
    safeToUpload: blockCount === 0,
  };
}

function checkSpringCompliance(listing: {
  title: string;
  description: string;
}): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceViolation[] = [];
  const suggestions: string[] = [];

  const fullText = `${listing.title} ${listing.description}`.toLowerCase();

  // Check prohibited content
  for (const term of SPRING_RULES.prohibited) {
    if (fullText.includes(term)) {
      violations.push({
        severity: "BLOCK",
        rule: "Spring Acceptable Use Policy",
        field: "listing_text",
        detail: `Prohibited content: "${term}"`,
        fix: `Remove "${term}" from listing.`,
      });
    }
  }

  // Title length
  if (listing.title.length > SPRING_RULES.maxTitleLength) {
    violations.push({
      severity: "BLOCK",
      rule: "Spring Title Length",
      field: "title",
      detail: `Title is ${listing.title.length} chars (max ${SPRING_RULES.maxTitleLength})`,
      fix: `Shorten title to ${SPRING_RULES.maxTitleLength} characters.`,
    });
  }

  const blockCount = violations.filter(v => v.severity === "BLOCK").length;
  const score = Math.max(0, 100 - (blockCount * 25) - (warnings.length * 5));

  return {
    platform: "spring",
    passed: blockCount === 0,
    score,
    violations,
    warnings,
    suggestions,
    safeToUpload: blockCount === 0,
  };
}

function checkSpreadshirtCompliance(listing: {
  title: string;
  description: string;
}): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceViolation[] = [];
  const suggestions: string[] = [];

  const fullText = `${listing.title} ${listing.description}`.toLowerCase();

  // Check prohibited categories
  const prohibitedPatterns = [
    { pattern: /\b(nfl|nba|mlb|nhl|fifa|premier league)\b/, term: "sports league trademark" },
    { pattern: /\b(disney|marvel|dc comics|star wars|pokemon)\b/, term: "entertainment IP" },
    { pattern: /\b(coca.?cola|pepsi|nike|adidas|apple|google)\b/, term: "company trademark" },
    { pattern: /\b(metallica|beatles|rolling stones|led zeppelin)\b/, term: "musical artist trademark" },
  ];

  for (const { pattern, term } of prohibitedPatterns) {
    if (pattern.test(fullText)) {
      violations.push({
        severity: "BLOCK",
        rule: "Spreadshirt Legal Guidelines",
        field: "listing_text",
        detail: `Prohibited: ${term} detected`,
        fix: `Remove ${term} references. Spreadshirt will not print unofficial merchandise.`,
      });
    }
  }

  // Title length
  if (listing.title.length > SPREADSHIRT_RULES.maxTitleLength) {
    violations.push({
      severity: "BLOCK",
      rule: "Spreadshirt Title Length",
      field: "title",
      detail: `Title is ${listing.title.length} chars (max ${SPREADSHIRT_RULES.maxTitleLength})`,
      fix: `Shorten title to ${SPREADSHIRT_RULES.maxTitleLength} characters.`,
    });
  }

  const blockCount = violations.filter(v => v.severity === "BLOCK").length;
  const score = Math.max(0, 100 - (blockCount * 25) - (warnings.length * 5));

  return {
    platform: "spreadshirt",
    passed: blockCount === 0,
    score,
    violations,
    warnings,
    suggestions,
    safeToUpload: blockCount === 0,
  };
}

/**
 * Master compliance check — runs all platform checks and returns full report
 */
function runFullComplianceCheck(listing: {
  title: string;
  bullets?: string[];
  tags?: string[];
  description: string;
  brand?: string;
  hasProductionPartnerDisclosed?: boolean;
  platforms: string[];
}): {
  overallPassed: boolean;
  overallScore: number;
  results: ComplianceResult[];
  summary: string;
  blockedPlatforms: string[];
  approvedPlatforms: string[];
} {
  const results: ComplianceResult[] = [];

  if (listing.platforms.includes("amazon_merch")) {
    results.push(checkAmazonCompliance({
      title: listing.title,
      bullets: listing.bullets || [],
      description: listing.description,
      brand: listing.brand,
    }));
  }

  if (listing.platforms.includes("redbubble")) {
    results.push(checkRedbubbleCompliance({
      title: listing.title,
      tags: listing.tags || [],
      description: listing.description,
    }));
  }

  if (listing.platforms.includes("etsy")) {
    results.push(checkEtsyCompliance({
      title: listing.title,
      tags: listing.tags || [],
      description: listing.description,
      hasProductionPartnerDisclosed: listing.hasProductionPartnerDisclosed ?? false,
    }));
  }

  if (listing.platforms.includes("spring")) {
    results.push(checkSpringCompliance({
      title: listing.title,
      description: listing.description,
    }));
  }

  if (listing.platforms.includes("spreadshirt")) {
    results.push(checkSpreadshirtCompliance({
      title: listing.title,
      description: listing.description,
    }));
  }

  const blockedPlatforms = results.filter(r => !r.passed).map(r => r.platform);
  const approvedPlatforms = results.filter(r => r.passed).map(r => r.platform);
  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;
  const overallPassed = blockedPlatforms.length === 0;

  const summary = overallPassed
    ? `✅ Listing passed compliance for all ${approvedPlatforms.length} platforms. Safe to upload.`
    : `⛔ Listing blocked on ${blockedPlatforms.length} platform(s): ${blockedPlatforms.join(", ")}. Fix violations before uploading.`;

  return {
    overallPassed,
    overallScore,
    results,
    summary,
    blockedPlatforms,
    approvedPlatforms,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRPC ROUTER
// ─────────────────────────────────────────────────────────────────────────────

export const podComplianceRouter = router({
  /**
   * Check a listing against all platform compliance rules
   */
  checkListing: procedure
    .input(z.object({
      title: z.string(),
      bullets: z.array(z.string()).optional().default([]),
      tags: z.array(z.string()).optional().default([]),
      description: z.string(),
      brand: z.string().optional(),
      hasProductionPartnerDisclosed: z.boolean().optional().default(false),
      platforms: z.array(z.enum(["amazon_merch", "redbubble", "etsy", "spring", "spreadshirt"])),
    }))
    .query(({ input }) => {
      return runFullComplianceCheck(input);
    }),

  /**
   * Get the full compliance rulebook for all platforms
   */
  getRulebook: procedure.query(() => {
    return {
      amazon_merch: {
        name: "Amazon Merch on Demand",
        titleMaxLength: AMAZON_TITLE_RULES.maxLength,
        bulletMaxLength: AMAZON_BULLET_RULES.maxLength,
        maxBullets: AMAZON_BULLET_RULES.maxBullets,
        descriptionMaxLength: AMAZON_DESCRIPTION_RULES.maxLength,
        triggerWordCount: AMAZON_TRIGGER_WORDS.length,
        safeAviationTermCount: AMAZON_SAFE_MILITARY_TERMS.length,
        keyRules: [
          "No trademark-infringing text anywhere in listing",
          "Title max 60 characters",
          "No forbidden characters in title",
          "No keyword stuffing (max 2x per keyword in title)",
          "No URLs or contact info",
          "No claims of 'official', 'licensed', 'premium', 'authentic'",
          "No review solicitation",
          "No charity/donation claims",
          "No competitor platform names",
          "Submit ONE listing first, wait for 'Processing' status before bulk uploading same design",
        ],
        criticalWarning: "Amazon Tier 10 accounts are under higher scrutiny. One BLOCK violation can trigger account review. Zero tolerance.",
      },
      redbubble: {
        name: "Redbubble",
        maxTags: REDBUBBLE_RULES.maxTags,
        titleMaxLength: REDBUBBLE_RULES.maxTitleLength,
        keyRules: [
          "Max 15 tags",
          "Mark mature content appropriately",
          "No copyrighted characters, brands, or media",
          "No bots or fake engagement",
          "Original artwork only",
        ],
      },
      etsy: {
        name: "Etsy",
        maxTags: ETSY_RULES.maxTags,
        titleMaxLength: ETSY_RULES.maxTitleLength,
        keyRules: [
          "MANDATORY: Disclose POD provider as production partner in shop settings",
          "Max 13 tags — use ALL 13",
          "No 'handmade' claims for POD items",
          "No false endorsement claims",
          "Original designs only (no stock art, purchased templates)",
          "Tags must be long-tail phrases (min 3 chars)",
          "Check Policy Violations page regularly",
        ],
        criticalWarning: "Missing production partner disclosure is the #1 reason Etsy POD listings get removed.",
      },
      spring: {
        name: "Spring (Teespring)",
        titleMaxLength: SPRING_RULES.maxTitleLength,
        keyRules: [
          "No violence, hate speech, or self-harm content",
          "No harassment or terrorism content",
          "Flag adult content appropriately",
        ],
      },
      spreadshirt: {
        name: "Spreadshirt",
        titleMaxLength: SPREADSHIRT_RULES.maxTitleLength,
        keyRules: [
          "No unofficial merchandise (no sports teams, musical artists, companies)",
          "No cartoon, movie, TV, or video game characters",
          "No celebrity photos or likenesses",
          "Original designs only",
          "DMCA violations result in account closure",
        ],
      },
    };
  }),

  /**
   * Get the safe aviation terms list for reference
   */
  getSafeAviationTerms: procedure.query(() => {
    return {
      safeTerms: AMAZON_SAFE_MILITARY_TERMS,
      cautionTerms: AVIATION_TRADEMARK_CAUTION,
      triggerWords: AMAZON_TRIGGER_WORDS,
    };
  }),

  /**
   * Validate artwork file specifications against all 5 platform requirements.
   * Checks: dimensions, DPI, file format, file size, colour mode, transparency.
   * Sources:
   *   Amazon: https://merch.amazon.com/resource/201849250 (4500x5400px, 300dpi, PNG, 25MB, sRGB, transparent)
   *   Redbubble: min 2400x3200px recommended 4500x5400, 150dpi min, PNG/JPG/GIF, 300MB
   *   Etsy: 2000px min short side, 72dpi min (300 rec), PNG/JPG, 20MB
   *   Spring: 3720x4950px rec, 150dpi min, PNG/JPG/AI/EPS/PDF, 50MB
   *   Spreadshirt: 4000px long side, 200dpi min, PNG/JPG/BMP/GIF, 10MB
   */
  validateArtwork: procedure
    .input(z.object({
      filename: z.string(),
      format: z.string(),           // e.g. "PNG", "JPG", "SVG"
      widthPx: z.number(),
      heightPx: z.number(),
      dpi: z.number().optional(),   // may not always be readable client-side
      fileSizeMB: z.number(),
      hasTransparentBackground: z.boolean().optional(),
      colourMode: z.string().optional(), // "RGB", "CMYK", "sRGB"
      platforms: z.array(z.enum(["amazon", "redbubble", "etsy", "spring", "spreadshirt"])),
    }))
    .mutation(({ input }) => {
      const { filename, format, widthPx, heightPx, dpi, fileSizeMB, hasTransparentBackground, colourMode, platforms } = input;
      const fmt = format.toUpperCase().replace(".", "");

      type PlatformResult = {
        platform: string;
        status: "PASS" | "FAIL" | "WARNING";
        issues: string[];
        warnings: string[];
        recommendations: string[];
      };

      const results: PlatformResult[] = [];

      // ── AMAZON MERCH ──────────────────────────────────────────────────────────
      if (platforms.includes("amazon")) {
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        if (fmt !== "PNG") {
          issues.push(`File format is ${fmt} — Amazon Merch requires PNG only. Convert to PNG before uploading.`);
        }
        if (widthPx < 4500 || heightPx < 5400) {
          issues.push(`Dimensions are ${widthPx}×${heightPx}px — Amazon requires exactly 4500×5400px. Resize your canvas.`);
        }
        if (widthPx > 4500 || heightPx > 5400) {
          warnings.push(`Dimensions ${widthPx}×${heightPx}px exceed 4500×5400px. Amazon's new editor accepts larger files but 4500×5400 is the proven standard.`);
        }
        if (dpi !== undefined && dpi < 300) {
          issues.push(`DPI is ${dpi} — Amazon requires 300 DPI. Re-export at 300 DPI or your design will print blurry.`);
        }
        if (fileSizeMB > 25) {
          issues.push(`File size is ${fileSizeMB.toFixed(1)}MB — Amazon's 25MB limit exceeded. Use Photoshop 'Smallest File Size' PNG export option.`);
        }
        if (hasTransparentBackground === false) {
          issues.push(`Transparent background required for Amazon. A white background will print as a visible white rectangle on the shirt.`);
        }
        if (colourMode && colourMode.toUpperCase() === "CMYK") {
          issues.push(`Colour mode is CMYK — Amazon requires sRGB (RGB 8-bit). Convert to RGB before exporting.`);
        }
        if (fmt === "PNG" && widthPx === 4500 && heightPx === 5400 && fileSizeMB <= 25) {
          recommendations.push("Design meets Amazon's core requirements. Ensure transparent background and sRGB colour mode in your export settings.");
        }

        results.push({
          platform: "Amazon Merch",
          status: issues.length > 0 ? "FAIL" : warnings.length > 0 ? "WARNING" : "PASS",
          issues,
          warnings,
          recommendations,
        });
      }

      // ── REDBUBBLE ─────────────────────────────────────────────────────────────
      if (platforms.includes("redbubble")) {
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        const allowedFormats = ["PNG", "JPG", "JPEG", "GIF"];
        if (!allowedFormats.includes(fmt)) {
          issues.push(`File format ${fmt} not accepted by Redbubble. Use PNG, JPG, or GIF.`);
        }
        if (widthPx < 2400 || heightPx < 3200) {
          issues.push(`Dimensions ${widthPx}×${heightPx}px are below Redbubble's minimum of 2400×3200px. Designs will be rejected or print poorly.`);
        } else if (widthPx < 4500 || heightPx < 5400) {
          warnings.push(`Dimensions ${widthPx}×${heightPx}px meet the minimum but Redbubble recommends 4500×5400px for best print quality across all products.`);
        }
        if (dpi !== undefined && dpi < 150) {
          issues.push(`DPI ${dpi} is below Redbubble's 150 DPI minimum. Designs will print blurry.`);
        } else if (dpi !== undefined && dpi < 300) {
          warnings.push(`DPI ${dpi} meets minimum but 300 DPI is recommended for sharp prints on all Redbubble products.`);
        }
        if (fileSizeMB > 300) {
          issues.push(`File size ${fileSizeMB.toFixed(1)}MB exceeds Redbubble's 300MB limit.`);
        }
        if (fmt === "PNG") {
          recommendations.push("PNG with transparent background is ideal for Redbubble — designs look professional on all product colours.");
        }

        results.push({
          platform: "Redbubble",
          status: issues.length > 0 ? "FAIL" : warnings.length > 0 ? "WARNING" : "PASS",
          issues,
          warnings,
          recommendations,
        });
      }

      // ── ETSY ──────────────────────────────────────────────────────────────────
      if (platforms.includes("etsy")) {
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        const allowedFormats = ["PNG", "JPG", "JPEG"];
        if (!allowedFormats.includes(fmt)) {
          issues.push(`File format ${fmt} not accepted by Etsy. Use PNG or JPG.`);
        }
        const shortSide = Math.min(widthPx, heightPx);
        if (shortSide < 2000) {
          issues.push(`Shortest dimension is ${shortSide}px — Etsy requires at least 2000px on the shortest side for listing images.`);
        }
        if (fileSizeMB > 20) {
          issues.push(`File size ${fileSizeMB.toFixed(1)}MB exceeds Etsy's 20MB limit.`);
        }
        if (dpi !== undefined && dpi < 72) {
          warnings.push(`DPI ${dpi} is very low. Etsy recommends 300 DPI for print-quality listings.`);
        } else if (dpi !== undefined && dpi < 300) {
          warnings.push(`DPI ${dpi} is acceptable for Etsy listings but 300 DPI is recommended for professional presentation.`);
        }
        recommendations.push("For Etsy POD listings, ensure your shop settings declare your POD provider as a production partner — required by Etsy policy.");

        results.push({
          platform: "Etsy",
          status: issues.length > 0 ? "FAIL" : warnings.length > 0 ? "WARNING" : "PASS",
          issues,
          warnings,
          recommendations,
        });
      }

      // ── SPRING ────────────────────────────────────────────────────────────────
      if (platforms.includes("spring")) {
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        const allowedFormats = ["PNG", "JPG", "JPEG", "AI", "EPS", "PDF", "GIF"];
        if (!allowedFormats.includes(fmt)) {
          issues.push(`File format ${fmt} not accepted by Spring. Use PNG, JPG, AI, EPS, or PDF.`);
        }
        if (widthPx < 3720 || heightPx < 4950) {
          warnings.push(`Dimensions ${widthPx}×${heightPx}px are below Spring's recommended 3720×4950px. Design may print at reduced quality.`);
        }
        if (dpi !== undefined && dpi < 150) {
          issues.push(`DPI ${dpi} is below Spring's 150 DPI minimum.`);
        } else if (dpi !== undefined && dpi < 300) {
          warnings.push(`DPI ${dpi} meets Spring's minimum. 300 DPI recommended for best results.`);
        }
        if (fileSizeMB > 50) {
          issues.push(`File size ${fileSizeMB.toFixed(1)}MB exceeds Spring's 50MB limit.`);
        }
        recommendations.push("Spring accepts vector formats (AI, EPS) which scale perfectly to any size — consider using vectors for text-heavy designs.");

        results.push({
          platform: "Spring",
          status: issues.length > 0 ? "FAIL" : warnings.length > 0 ? "WARNING" : "PASS",
          issues,
          warnings,
          recommendations,
        });
      }

      // ── SPREADSHIRT ───────────────────────────────────────────────────────────
      if (platforms.includes("spreadshirt")) {
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        const allowedFormats = ["PNG", "JPG", "JPEG", "BMP", "GIF"];
        if (!allowedFormats.includes(fmt)) {
          issues.push(`File format ${fmt} not accepted by Spreadshirt. Use PNG, JPG, BMP, or GIF.`);
        }
        const longSide = Math.max(widthPx, heightPx);
        if (longSide < 4000) {
          issues.push(`Longest dimension is ${longSide}px — Spreadshirt requires at least 4000px on the longest side.`);
        }
        if (dpi !== undefined && dpi < 200) {
          issues.push(`DPI ${dpi} is below Spreadshirt's 200 DPI minimum for apparel (400 DPI required for non-apparel products).`);
        } else if (dpi !== undefined && dpi < 300) {
          warnings.push(`DPI ${dpi} meets Spreadshirt's apparel minimum. 300 DPI recommended for best quality.`);
        }
        if (fileSizeMB > 10) {
          issues.push(`File size ${fileSizeMB.toFixed(1)}MB exceeds Spreadshirt's 10MB limit — the strictest of all 5 platforms. Compress your PNG.`);
        }
        recommendations.push("Spreadshirt has the strictest file size limit (10MB). Use PNG compression tools like TinyPNG before uploading.");

        results.push({
          platform: "Spreadshirt",
          status: issues.length > 0 ? "FAIL" : warnings.length > 0 ? "WARNING" : "PASS",
          issues,
          warnings,
          recommendations,
        });
      }

      // ── OVERALL SUMMARY ───────────────────────────────────────────────────────
      const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
      const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
      const failedPlatforms = results.filter(r => r.status === "FAIL").map(r => r.platform);
      const passingPlatforms = results.filter(r => r.status === "PASS").map(r => r.platform);

      // Universal best-practice check
      const universalRecommendations: string[] = [];
      if (fmt !== "PNG") {
        universalRecommendations.push("PNG is the universal best format for POD — transparent background, lossless quality, accepted everywhere.");
      }
      if (dpi !== undefined && dpi < 300) {
        universalRecommendations.push("300 DPI is the print industry standard. Design at 300 DPI once and you never need to re-export for any platform.");
      }
      if (widthPx < 4500 || heightPx < 5400) {
        universalRecommendations.push("4500×5400px at 300 DPI is the universal POD standard. Use this canvas size for every design and it works on all 5 platforms.");
      }

      return {
        filename,
        checkedAt: new Date().toISOString(),
        overallStatus: failedPlatforms.length > 0 ? "FAIL" : totalWarnings > 0 ? "WARNING" : "PASS",
        summary: {
          totalIssues,
          totalWarnings,
          failedPlatforms,
          passingPlatforms,
          readyToUpload: failedPlatforms.length === 0,
        },
        platformResults: results,
        universalRecommendations,
        artworkSpecs: {
          filename,
          format: fmt,
          dimensions: `${widthPx}×${heightPx}px`,
          dpi: dpi ?? "not provided",
          fileSizeMB: fileSizeMB.toFixed(2),
          hasTransparentBackground: hasTransparentBackground ?? "not checked",
          colourMode: colourMode ?? "not provided",
        },
      };
    }),

  /**
   * Quick-check a single term against all platform rules
   */
  checkTerm: procedure
    .input(z.object({ term: z.string() }))
    .query(({ input }) => {
      const term = input.term.toLowerCase();
      const isTrigger = AMAZON_TRIGGER_WORDS.some(w => term.includes(w.toLowerCase()));
      const isCaution = AVIATION_TRADEMARK_CAUTION.some(w => term.includes(w.toLowerCase()));
      const isSafe = AMAZON_SAFE_MILITARY_TERMS.some(w => term.includes(w.toLowerCase()));

      return {
        term: input.term,
        status: isTrigger ? "BLOCKED" : isCaution ? "CAUTION" : isSafe ? "SAFE" : "UNKNOWN",
        reason: isTrigger
          ? "This term triggers Amazon's auto-rejection algorithm"
          : isCaution
          ? "This term has trademark sensitivity — use descriptively only, never as endorsement"
          : isSafe
          ? "This term is verified safe for military aviation POD listings"
          : "Term not in database — verify manually before use",
      };
    }),
});
