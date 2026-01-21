/**
 * OAuth Callback Routes for Social Platform Connections
 * Handles the OAuth flow callbacks from Meta (Facebook/Instagram) and LinkedIn
 */
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { platformConnections } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getUserPages, exchangeForLongLivedToken } from "../integrations/meta";
import { getProfile as getLinkedInProfile } from "../integrations/linkedin";

const router = Router();

// Environment variables for OAuth
const META_APP_ID = process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";
const BASE_URL = process.env.BASE_URL || "https://marketing-control-center.onrender.com";

// Default user ID for owner (since this is a single-user control center)
const OWNER_USER_ID = 1;

/**
 * Meta (Facebook/Instagram) OAuth Callback
 * GET /api/oauth/meta/callback?code=xxx&state=xxx
 */
router.get("/meta/callback", async (req: Request, res: Response) => {
  try {
    const { code, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error("Meta OAuth error:", error, error_description);
      return res.redirect(`/settings?error=${encodeURIComponent(String(error_description || error))}`);
    }

    if (!code) {
      return res.redirect("/settings?error=No authorization code received");
    }

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/oauth/meta/callback`)}` +
      `&client_secret=${META_APP_SECRET}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json() as { access_token?: string; error?: { message: string } };

    if (tokenData.error) {
      console.error("Meta token exchange error:", tokenData.error);
      return res.redirect(`/settings?error=${encodeURIComponent(tokenData.error.message || "Token exchange failed")}`);
    }

    const shortLivedToken = tokenData.access_token;
    if (!shortLivedToken) {
      return res.redirect("/settings?error=No access token received");
    }

    // Exchange for long-lived token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&fb_exchange_token=${shortLivedToken}`;

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json() as { access_token?: string; expires_in?: number };
    
    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 3600;

    // Get user pages
    const pagesResult = await getUserPages(accessToken);
    
    // Check if pages fetch was successful
    if ('error' in pagesResult) {
      return res.redirect(`/settings?error=${encodeURIComponent(pagesResult.error)}`);
    }
    
    const pages = pagesResult.pages;

    // Get database connection
    const db = await getDb();
    if (!db) {
      return res.redirect("/settings?error=Database connection failed");
    }

    // Store Facebook connection
    if (pages.length > 0) {
      const page = pages[0]; // Use first page
      
      // Check if connection already exists
      const existing = await db.select()
        .from(platformConnections)
        .where(and(
          eq(platformConnections.platform, "facebook"),
          eq(platformConnections.pageId, page.id)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Update existing connection
        await db.update(platformConnections)
          .set({
            accessToken: page.accessToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            pageName: page.name,
            updatedAt: new Date(),
          })
          .where(eq(platformConnections.id, existing[0].id));
      } else {
        // Create new connection
        await db.insert(platformConnections).values({
          userId: OWNER_USER_ID,
          platform: "facebook",
          pageId: page.id,
          pageName: page.name,
          accessToken: page.accessToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Try to get Instagram accounts linked to pages
    for (const page of pages) {
      try {
        const igResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.accessToken}`
        );
        const igData = await igResponse.json() as { instagram_business_account?: { id: string } };
        
        if (igData.instagram_business_account) {
          const igId = igData.instagram_business_account.id;
          
          // Get Instagram account details
          const igDetailsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${igId}?fields=username,name&access_token=${page.accessToken}`
          );
          const igDetails = await igDetailsResponse.json() as { username?: string; name?: string };

          // Check if Instagram connection already exists
          const existingIg = await db.select()
            .from(platformConnections)
            .where(and(
              eq(platformConnections.platform, "instagram"),
              eq(platformConnections.pageId, igId)
            ))
            .limit(1);

          if (existingIg.length > 0) {
            await db.update(platformConnections)
              .set({
                accessToken: page.accessToken,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
                pageName: igDetails.username || igDetails.name || "Instagram",
                updatedAt: new Date(),
              })
              .where(eq(platformConnections.id, existingIg[0].id));
          } else {
            await db.insert(platformConnections).values({
              userId: OWNER_USER_ID,
              platform: "instagram",
              pageId: igId,
              pageName: igDetails.username || igDetails.name || "Instagram",
              accessToken: page.accessToken,
              expiresAt: new Date(Date.now() + expiresIn * 1000),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      } catch (igError) {
        console.error("Error fetching Instagram account:", igError);
      }
    }

    // Redirect back to settings with success
    res.redirect("/settings?success=meta");
  } catch (error) {
    console.error("Meta OAuth callback error:", error);
    res.redirect(`/settings?error=${encodeURIComponent("Failed to connect Meta account")}`);
  }
});

/**
 * LinkedIn OAuth Callback
 * GET /api/oauth/linkedin/callback?code=xxx&state=xxx
 */
router.get("/linkedin/callback", async (req: Request, res: Response) => {
  try {
    const { code, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error("LinkedIn OAuth error:", error, error_description);
      return res.redirect(`/settings?error=${encodeURIComponent(String(error_description || error))}`);
    }

    if (!code) {
      return res.redirect("/settings?error=No authorization code received");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: `${BASE_URL}/api/oauth/linkedin/callback`,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json() as { 
      access_token?: string; 
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error) {
      console.error("LinkedIn token exchange error:", tokenData.error);
      return res.redirect(`/settings?error=${encodeURIComponent(tokenData.error_description || "Token exchange failed")}`);
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.redirect("/settings?error=No access token received");
    }

    const expiresIn = tokenData.expires_in || 5184000; // Default 60 days

    // Get user profile
    const profile = await getLinkedInProfile(accessToken);
    
    // Check if profile fetch was successful
    if ('error' in profile) {
      return res.redirect(`/settings?error=${encodeURIComponent(profile.error)}`);
    }

    // Get database connection
    const db = await getDb();
    if (!db) {
      return res.redirect("/settings?error=Database connection failed");
    }

    // Check if connection already exists
    const existing = await db.select()
      .from(platformConnections)
      .where(and(
        eq(platformConnections.platform, "linkedin"),
        eq(platformConnections.pageId, profile.id)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing connection
      await db.update(platformConnections)
        .set({
          accessToken: accessToken,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          pageName: profile.name,
          updatedAt: new Date(),
        })
        .where(eq(platformConnections.id, existing[0].id));
    } else {
      // Create new connection
      await db.insert(platformConnections).values({
        userId: OWNER_USER_ID,
        platform: "linkedin",
        pageId: profile.id,
        pageName: profile.name,
        accessToken: accessToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Redirect back to settings with success
    res.redirect("/settings?success=linkedin");
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error);
    res.redirect(`/settings?error=${encodeURIComponent("Failed to connect LinkedIn account")}`);
  }
});

/**
 * Generate Meta OAuth URL
 * GET /api/oauth/meta/authorize
 */
router.get("/meta/authorize", (req: Request, res: Response) => {
  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
  ].join(",");

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/oauth/meta/callback`)}` +
    `&scope=${scopes}` +
    `&response_type=code`;

  res.redirect(authUrl);
});

/**
 * Generate LinkedIn OAuth URL
 * GET /api/oauth/linkedin/authorize
 */
router.get("/linkedin/authorize", (req: Request, res: Response) => {
  const scopes = [
    "openid",
    "profile",
    "w_member_social",
  ].join(" ");

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code` +
    `&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(`${BASE_URL}/api/oauth/linkedin/callback`)}` +
    `&scope=${encodeURIComponent(scopes)}`;

  res.redirect(authUrl);
});

export default router;
