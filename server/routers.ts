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
});

export type AppRouter = typeof appRouter;
