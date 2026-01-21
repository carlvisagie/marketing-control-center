/**
 * Social Platforms Router
 * Handles platform connections, posting, and analytics
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { metaApi } from "../integrations/meta";
import { linkedInApi } from "../integrations/linkedin";
import { socialEngine, Platform, PlatformCredentials } from "../integrations/socialEngine";
import { getDb } from "../db";
import { platformConnections } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const socialPlatformsRouter = router({
  /**
   * Get all connected platforms for the current user
   */
  getConnectedPlatforms: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return [];
    }
    const connections = await db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.userId, ctx.user.id));

    return connections.map((conn: any) => ({
      platform: conn.platform as Platform,
      connected: true,
      pageName: conn.pageName,
      pageId: conn.pageId,
      expiresAt: conn.expiresAt,
      needsRefresh: conn.expiresAt ? new Date() > new Date(conn.expiresAt) : false,
    }));
  }),

  /**
   * Get Meta (Facebook/Instagram) OAuth URL
   */
  getMetaAuthUrl: protectedProcedure
    .input(z.object({ redirectUri: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const appId = process.env.META_APP_ID;
      if (!appId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Meta App ID not configured",
        });
      }

      const state = Buffer.from(
        JSON.stringify({ userId: ctx.user.id, timestamp: Date.now() })
      ).toString("base64");

      const scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_insights",
      ];

      const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
      url.searchParams.set("client_id", appId);
      url.searchParams.set("redirect_uri", input.redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("scope", scopes.join(","));

      return { url: url.toString(), state };
    }),

  /**
   * Complete Meta OAuth and save credentials
   */
  connectMeta: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;

      if (!appId || !appSecret) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Meta App credentials not configured",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Exchange code for access token
      const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", appId);
      tokenUrl.searchParams.set("client_secret", appSecret);
      tokenUrl.searchParams.set("redirect_uri", input.redirectUri);
      tokenUrl.searchParams.set("code", input.code);

      const tokenResponse = await fetch(tokenUrl.toString());
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: tokenData.error.message,
        });
      }

      // Exchange for long-lived token
      const longLivedResult = await metaApi.exchangeForLongLivedToken(
        tokenData.access_token,
        appId,
        appSecret
      );

      if ("error" in longLivedResult) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: longLivedResult.error,
        });
      }

      // Get user's pages
      const pagesResult = await metaApi.getUserPages(longLivedResult.accessToken);

      if ("error" in pagesResult) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: pagesResult.error,
        });
      }

      const expiresAt = new Date(Date.now() + longLivedResult.expiresIn * 1000);

      // Save each page as a connection
      const savedConnections = [];

      for (const page of pagesResult.pages) {
        // Check for Instagram business account
        const igResult = await metaApi.getInstagramAccountId(page.accessToken, page.id);
        const instagramAccountId = "instagramAccountId" in igResult ? igResult.instagramAccountId : null;

        // Save Facebook connection - use upsert pattern for PostgreSQL
        const existingFb = await db
          .select()
          .from(platformConnections)
          .where(
            and(
              eq(platformConnections.userId, ctx.user.id),
              eq(platformConnections.platform, "facebook"),
              eq(platformConnections.pageId, page.id)
            )
          )
          .limit(1);

        if (existingFb.length > 0) {
          await db
            .update(platformConnections)
            .set({
              accessToken: page.accessToken,
              pageName: page.name,
              expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(platformConnections.id, existingFb[0].id));
        } else {
          await db.insert(platformConnections).values({
            userId: ctx.user.id,
            platform: "facebook",
            accessToken: page.accessToken,
            pageId: page.id,
            pageName: page.name,
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        savedConnections.push({ platform: "facebook", pageName: page.name });

        // Save Instagram connection if available
        if (instagramAccountId) {
          const existingIg = await db
            .select()
            .from(platformConnections)
            .where(
              and(
                eq(platformConnections.userId, ctx.user.id),
                eq(platformConnections.platform, "instagram"),
                eq(platformConnections.pageId, instagramAccountId)
              )
            )
            .limit(1);

          if (existingIg.length > 0) {
            await db
              .update(platformConnections)
              .set({
                accessToken: page.accessToken,
                pageName: `${page.name} (Instagram)`,
                expiresAt,
                updatedAt: new Date(),
              })
              .where(eq(platformConnections.id, existingIg[0].id));
          } else {
            await db.insert(platformConnections).values({
              userId: ctx.user.id,
              platform: "instagram",
              accessToken: page.accessToken,
              pageId: instagramAccountId,
              pageName: `${page.name} (Instagram)`,
              expiresAt,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          savedConnections.push({ platform: "instagram", pageName: `${page.name} (Instagram)` });
        }
      }

      return {
        success: true,
        connections: savedConnections,
      };
    }),

  /**
   * Get LinkedIn OAuth URL
   */
  getLinkedInAuthUrl: protectedProcedure
    .input(z.object({ redirectUri: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      if (!clientId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "LinkedIn Client ID not configured",
        });
      }

      const state = Buffer.from(
        JSON.stringify({ userId: ctx.user.id, timestamp: Date.now() })
      ).toString("base64");

      const url = linkedInApi.getAuthorizationUrl(clientId, input.redirectUri, state);

      return { url, state };
    }),

  /**
   * Complete LinkedIn OAuth and save credentials
   */
  connectLinkedIn: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        redirectUri: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "LinkedIn credentials not configured",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const tokenResult = await linkedInApi.exchangeCodeForToken(
        input.code,
        clientId,
        clientSecret,
        input.redirectUri
      );

      if ("error" in tokenResult) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: tokenResult.error,
        });
      }

      // Get user profile
      const profileResult = await linkedInApi.getProfile(tokenResult.accessToken);

      if ("error" in profileResult) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: profileResult.error,
        });
      }

      const expiresAt = new Date(Date.now() + tokenResult.expiresIn * 1000);

      // Save LinkedIn connection - upsert pattern
      const existingLi = await db
        .select()
        .from(platformConnections)
        .where(
          and(
            eq(platformConnections.userId, ctx.user.id),
            eq(platformConnections.platform, "linkedin")
          )
        )
        .limit(1);

      if (existingLi.length > 0) {
        await db
          .update(platformConnections)
          .set({
            accessToken: tokenResult.accessToken,
            pageId: profileResult.urn,
            pageName: profileResult.name,
            expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(platformConnections.id, existingLi[0].id));
      } else {
        await db.insert(platformConnections).values({
          userId: ctx.user.id,
          platform: "linkedin",
          accessToken: tokenResult.accessToken,
          pageId: profileResult.urn,
          pageName: profileResult.name,
          expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return {
        success: true,
        connections: [{ platform: "linkedin", pageName: profileResult.name }],
      };
    }),

  /**
   * Disconnect a platform
   */
  disconnectPlatform: protectedProcedure
    .input(z.object({ platform: z.enum(["facebook", "instagram", "linkedin", "tiktok"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await db
        .delete(platformConnections)
        .where(
          and(
            eq(platformConnections.userId, ctx.user.id),
            eq(platformConnections.platform, input.platform)
          )
        );

      return { success: true };
    }),

  /**
   * Post to selected platforms
   */
  post: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        platforms: z.array(z.enum(["facebook", "instagram", "linkedin", "tiktok"])),
        mediaUrls: z.array(z.string()).optional(),
        scheduledTime: z.date().optional(),
        link: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Get user's platform credentials
      const connections = await db
        .select()
        .from(platformConnections)
        .where(eq(platformConnections.userId, ctx.user.id));

      const credentials: PlatformCredentials[] = connections.map((conn: any) => ({
        platform: conn.platform as Platform,
        accessToken: conn.accessToken,
        pageId: conn.pageId || undefined,
        instagramAccountId: conn.platform === "instagram" ? conn.pageId || undefined : undefined,
        personUrn: conn.platform === "linkedin" ? conn.pageId || undefined : undefined,
        expiresAt: conn.expiresAt ? new Date(conn.expiresAt) : undefined,
      }));

      // Filter to only requested platforms
      const filteredCredentials = credentials.filter((c) =>
        input.platforms.includes(c.platform)
      );

      // Post to all platforms
      const results = await socialEngine.postToAllPlatforms(
        {
          content: input.content,
          platforms: input.platforms as Platform[],
          mediaUrls: input.mediaUrls,
          scheduledTime: input.scheduledTime,
          link: input.link,
        },
        filteredCredentials
      );

      return {
        results,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      };
    }),

  /**
   * Get aggregated analytics from all platforms
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return { facebook: {}, instagram: {}, linkedin: {}, tiktok: {} };
    }

    const connections = await db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.userId, ctx.user.id));

    const credentials: PlatformCredentials[] = connections.map((conn: any) => ({
      platform: conn.platform as Platform,
      accessToken: conn.accessToken,
      pageId: conn.pageId || undefined,
      instagramAccountId: conn.platform === "instagram" ? conn.pageId || undefined : undefined,
      organizationUrn: conn.platform === "linkedin" ? conn.pageId || undefined : undefined,
    }));

    const analytics = await socialEngine.getAggregatedAnalytics(credentials);

    return analytics;
  }),

  /**
   * Get optimal posting times for each platform
   */
  getOptimalTimes: protectedProcedure.query(async () => {
    return {
      facebook: socialEngine.getOptimalPostingTimes("facebook"),
      instagram: socialEngine.getOptimalPostingTimes("instagram"),
      linkedin: socialEngine.getOptimalPostingTimes("linkedin"),
      tiktok: socialEngine.getOptimalPostingTimes("tiktok"),
    };
  }),
});
