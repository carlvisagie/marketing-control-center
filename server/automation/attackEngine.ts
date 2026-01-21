/**
 * 24/7 Attack Automation Engine
 * 
 * Autonomous marketing content generation and scheduling system
 * Based on Sintra strategy for Just Talk
 */

import { invokeLLM } from "../_core/openai";

// Content types based on Sintra schedule
export type ContentType = 
  | "tiktok_video"
  | "instagram_reel"
  | "instagram_story"
  | "facebook_post"
  | "linkedin_post"
  | "twitter_post";

export type ContentCategory =
  | "educational"
  | "testimonial"
  | "behind_scenes"
  | "promotional"
  | "engagement"
  | "trending";

interface GeneratedContent {
  type: ContentType;
  category: ContentCategory;
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  cta: string;
  optimalPostTime: string;
  platform: string;
}

interface AttackSchedule {
  platform: string;
  frequency: string;
  contentTypes: ContentType[];
  enabled: boolean;
}

// Sintra-recommended posting schedule
export const ATTACK_SCHEDULE: AttackSchedule[] = [
  {
    platform: "tiktok",
    frequency: "1/day",
    contentTypes: ["tiktok_video"],
    enabled: true,
  },
  {
    platform: "instagram",
    frequency: "1 reel/day, 3 stories/day",
    contentTypes: ["instagram_reel", "instagram_story"],
    enabled: true,
  },
  {
    platform: "facebook",
    frequency: "1/day",
    contentTypes: ["facebook_post"],
    enabled: true,
  },
  {
    platform: "linkedin",
    frequency: "3/week",
    contentTypes: ["linkedin_post"],
    enabled: true,
  },
];

// Content themes based on Just Talk's positioning
const CONTENT_THEMES = [
  "24/7 emotional support availability",
  "No judgment, just listening",
  "Mental health accessibility",
  "Breaking the stigma of asking for help",
  "Late night support when you need it",
  "Affordable mental wellness",
  "AI-powered empathetic conversations",
  "Privacy and confidentiality",
  "Instant access, no appointments",
  "Complement to traditional therapy",
];

// Meta-safe hooks (compliant with advertising policies)
const SAFE_HOOKS = [
  "It's 3 AM. Who can you call?",
  "You don't have to wait until morning.",
  "A supportive conversation, anytime.",
  "Sometimes you just need someone to listen.",
  "No appointments. No waiting rooms.",
  "Your feelings are valid at any hour.",
  "Talk it out, whenever you need to.",
  "Support that fits your schedule.",
  "When you need to process your thoughts...",
  "A judgment-free space to express yourself.",
];

/**
 * Generate content for a specific platform
 */
export async function generateContent(
  platform: string,
  category: ContentCategory,
  customTheme?: string
): Promise<GeneratedContent> {
  const theme = customTheme || CONTENT_THEMES[Math.floor(Math.random() * CONTENT_THEMES.length)];
  const hook = SAFE_HOOKS[Math.floor(Math.random() * SAFE_HOOKS.length)];

  const prompt = `You are a marketing content creator for Just Talk, a 24/7 AI-powered emotional support app.

Platform: ${platform}
Content Category: ${category}
Theme: ${theme}
Opening Hook: ${hook}

Create engaging, Meta-compliant content that:
1. Does NOT make medical claims or promise to treat/cure conditions
2. Positions Just Talk as emotional support, NOT therapy or medical treatment
3. Uses empathetic, inclusive language
4. Includes a clear but soft call-to-action
5. Is appropriate for the ${platform} platform and audience

Generate:
1. A short script (30-60 seconds for video, 2-3 paragraphs for text)
2. A caption with emojis
3. 5-7 relevant hashtags
4. A call-to-action

Format your response as JSON with these fields:
- script: string
- caption: string
- hashtags: string[] (without # symbol)
- cta: string`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a marketing expert specializing in mental wellness apps. Always create compliant, empathetic content." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "content_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              script: { type: "string", description: "The main content script" },
              caption: { type: "string", description: "Social media caption with emojis" },
              hashtags: { 
                type: "array", 
                items: { type: "string" },
                description: "Relevant hashtags without # symbol"
              },
              cta: { type: "string", description: "Call to action" },
            },
            required: ["script", "caption", "hashtags", "cta"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");

    // Determine optimal posting time based on platform
    const optimalTimes: Record<string, string> = {
      tiktok: "7:00 PM - 9:00 PM",
      instagram: "11:00 AM - 1:00 PM, 7:00 PM - 9:00 PM",
      facebook: "1:00 PM - 4:00 PM",
      linkedin: "7:00 AM - 8:00 AM, 12:00 PM",
      twitter: "8:00 AM - 10:00 AM, 12:00 PM - 1:00 PM",
    };

    return {
      type: getContentType(platform),
      category,
      hook,
      script: content.script,
      caption: content.caption,
      hashtags: content.hashtags,
      cta: content.cta,
      optimalPostTime: optimalTimes[platform] || "12:00 PM",
      platform,
    };
  } catch (error) {
    console.error("Content generation error:", error);
    throw new Error("Failed to generate content");
  }
}

function getContentType(platform: string): ContentType {
  const typeMap: Record<string, ContentType> = {
    tiktok: "tiktok_video",
    instagram: "instagram_reel",
    facebook: "facebook_post",
    linkedin: "linkedin_post",
    twitter: "twitter_post",
  };
  return typeMap[platform] || "facebook_post";
}

/**
 * Generate a full day's content queue
 */
export async function generateDailyContentQueue(): Promise<GeneratedContent[]> {
  const queue: GeneratedContent[] = [];
  const categories: ContentCategory[] = [
    "educational",
    "engagement",
    "promotional",
    "behind_scenes",
  ];

  // TikTok - 1 video
  queue.push(await generateContent("tiktok", categories[Math.floor(Math.random() * categories.length)]));

  // Instagram - 1 reel
  queue.push(await generateContent("instagram", categories[Math.floor(Math.random() * categories.length)]));

  // Facebook - 1 post
  queue.push(await generateContent("facebook", "educational"));

  return queue;
}

/**
 * Get attack status and statistics
 */
export function getAttackStatus() {
  return {
    isActive: false, // Will be controlled by system settings
    schedule: ATTACK_SCHEDULE,
    themes: CONTENT_THEMES,
    safeHooks: SAFE_HOOKS,
    contentCategories: [
      "educational",
      "testimonial", 
      "behind_scenes",
      "promotional",
      "engagement",
      "trending",
    ],
  };
}

/**
 * Validate content for platform compliance
 */
export function validateContent(content: GeneratedContent): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for medical claims
  const medicalTerms = ["cure", "treat", "therapy", "therapist", "diagnosis", "mental illness", "disorder"];
  const contentText = `${content.script} ${content.caption}`.toLowerCase();
  
  for (const term of medicalTerms) {
    if (contentText.includes(term)) {
      issues.push(`Contains potentially non-compliant term: "${term}"`);
    }
  }

  // Check caption length
  if (content.platform === "twitter" && content.caption.length > 280) {
    issues.push("Caption exceeds Twitter character limit");
  }

  // Check hashtag count
  if (content.hashtags.length > 30) {
    issues.push("Too many hashtags (Instagram limit is 30)");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
