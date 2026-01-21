import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { analyticsRouter } from "./routers/analytics";
import { aiRecommendationsRouter } from "./routers/aiRecommendations";
import { abTestingRouter } from "./routers/abTesting";
import { reportingRouter } from "./routers/reporting";
import { autoOptimizeRouter } from "./routers/autoOptimize";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Just Talk Analytics (READ-ONLY)
  analytics: analyticsRouter,

  // AI-Powered Marketing Intelligence
  ai: aiRecommendationsRouter,

  // A/B Testing & Auto-Optimization
  abTest: abTestingRouter,

  // Self-Reporting & Notifications
  reporting: reportingRouter,

  // Auto-Pause/Boost Optimization
  autoOptimize: autoOptimizeRouter,
});

export type AppRouter = typeof appRouter;
