/**
 * Main Router - ZERO MANUS DEPENDENCIES
 * 
 * All routers use direct integrations (OpenAI, S3, JWT) instead of Manus proxies.
 */

import { router } from "./_core/trpc";
import { simpleAuthRouter } from "./routers/simpleAuthRouter";
import { analyticsRouter } from "./routers/analytics";
import { aiRecommendationsRouter } from "./routers/aiRecommendations";
import { abTestingRouter } from "./routers/abTesting";
import { reportingRouter } from "./routers/reporting";
import { autoOptimizeRouter } from "./routers/autoOptimize";
import { tiktokRouter } from "./routers/tiktok";
import { socialPlatformsRouter } from "./routers/socialPlatforms";
import { attackRouter } from "./routers/attack";
import { commandsRouter } from "./routers/commands";
import { podAcquisitionRouter } from "./routers/podAcquisition";

export const appRouter = router({
  // Simple JWT Authentication (no Manus OAuth)
  auth: simpleAuthRouter,

  // Just Talk Analytics (READ-ONLY)
  analytics: analyticsRouter,

  // AI-Powered Marketing Intelligence (Direct OpenAI)
  ai: aiRecommendationsRouter,

  // A/B Testing & Auto-Optimization
  abTest: abTestingRouter,

  // Self-Reporting & Notifications
  reporting: reportingRouter,

  // Auto-Pause/Boost Optimization
  autoOptimize: autoOptimizeRouter,

  // TikTok Content & Send-to-Phone
  tiktok: tiktokRouter,

  // Social Platform Connections & Unified Posting
  social: socialPlatformsRouter,

  // 24/7 Attack Automation Engine
  attack: attackRouter,

  // Real Command Execution (generates content, posts to social)
  commands: commandsRouter,

  // POD Autonomous Acquisition Engine (Jetfighter1 Military Aviation)
  pod: podAcquisitionRouter,
});

export type AppRouter = typeof appRouter;
