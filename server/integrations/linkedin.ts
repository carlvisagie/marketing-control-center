/**
 * LinkedIn API Integration
 * Handles LinkedIn profile and company page posting
 */

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_OAUTH_BASE = "https://www.linkedin.com/oauth/v2";

interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  personUrn?: string; // urn:li:person:xxx
  organizationUrn?: string; // urn:li:organization:xxx
}

interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  scopes: string[] = ["openid", "profile", "w_member_social"]
): string {
  const url = new URL(`${LINKEDIN_OAUTH_BASE}/authorization`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes.join(" "));
  return url.toString();
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number } | { error: string }> {
  try {
    const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return { error: data.error_description || data.error };
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    return { error: `Token exchange failed: ${error}` };
  }
}

/**
 * Get current user's profile info
 */
export async function getProfile(
  accessToken: string
): Promise<{ id: string; name: string; urn: string } | { error: string }> {
  try {
    const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (data.error) {
      return { error: data.error_description || data.message };
    }

    return {
      id: data.sub,
      name: data.name,
      urn: `urn:li:person:${data.sub}`,
    };
  } catch (error) {
    return { error: `Failed to get profile: ${error}` };
  }
}

/**
 * Get organizations (company pages) the user administers
 */
export async function getOrganizations(
  accessToken: string
): Promise<{ organizations: Array<{ id: string; name: string; urn: string }> } | { error: string }> {
  try {
    // First get organization access control
    const response = await fetch(
      `${LINKEDIN_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(localizedName)))`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      return { error: data.error_description || data.message };
    }

    const organizations = (data.elements || []).map((element: any) => ({
      id: element.organization.split(":").pop(),
      name: element["organization~"]?.localizedName || "Unknown",
      urn: element.organization,
    }));

    return { organizations };
  } catch (error) {
    return { error: `Failed to get organizations: ${error}` };
  }
}

/**
 * Post to LinkedIn (personal profile or company page)
 */
export async function postToLinkedIn(
  accessToken: string,
  authorUrn: string, // urn:li:person:xxx or urn:li:organization:xxx
  text: string,
  options?: {
    imageUrl?: string;
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
  }
): Promise<PostResult> {
  try {
    const postBody: any = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    // Add article/link if provided
    if (options?.articleUrl) {
      postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "ARTICLE";
      postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          originalUrl: options.articleUrl,
          title: {
            text: options.articleTitle || "",
          },
          description: {
            text: options.articleDescription || "",
          },
        },
      ];
    }

    // Add image if provided (requires upload first)
    if (options?.imageUrl && !options?.articleUrl) {
      // For images, we need to register and upload first
      const uploadResult = await uploadImageToLinkedIn(accessToken, authorUrn, options.imageUrl);
      if ("error" in uploadResult) {
        return { success: false, error: uploadResult.error };
      }

      postBody.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "IMAGE";
      postBody.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          media: uploadResult.asset,
        },
      ];
    }

    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });

    const data = await response.json();

    if (data.error || response.status >= 400) {
      return {
        success: false,
        error: data.message || data.error_description || "Post failed",
      };
    }

    return {
      success: true,
      postId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: `LinkedIn post failed: ${error}`,
    };
  }
}

/**
 * Upload image to LinkedIn (required before posting with image)
 */
async function uploadImageToLinkedIn(
  accessToken: string,
  ownerUrn: string,
  imageUrl: string
): Promise<{ asset: string } | { error: string }> {
  try {
    // Step 1: Register upload
    const registerResponse = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: ownerUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    });

    const registerData = await registerResponse.json();

    if (registerData.error) {
      return { error: registerData.message || "Failed to register upload" };
    }

    const uploadUrl =
      registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]
        .uploadUrl;
    const asset = registerData.value.asset;

    // Step 2: Download image from URL
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Step 3: Upload to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/jpeg",
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      return { error: "Failed to upload image to LinkedIn" };
    }

    return { asset };
  } catch (error) {
    return { error: `Image upload failed: ${error}` };
  }
}

/**
 * Get post analytics (shares, likes, comments, impressions)
 */
export async function getPostAnalytics(
  accessToken: string,
  postUrn: string
): Promise<{ analytics: Record<string, number> } | { error: string }> {
  try {
    const response = await fetch(
      `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(postUrn)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      return { error: data.message || "Failed to get analytics" };
    }

    return {
      analytics: {
        likes: data.likesSummary?.totalLikes || 0,
        comments: data.commentsSummary?.totalFirstLevelComments || 0,
        shares: data.sharesSummary?.totalShares || 0,
      },
    };
  } catch (error) {
    return { error: `Failed to get analytics: ${error}` };
  }
}

/**
 * Get organization (company page) follower statistics
 */
export async function getOrganizationFollowers(
  accessToken: string,
  organizationUrn: string
): Promise<{ followers: number } | { error: string }> {
  try {
    const orgId = organizationUrn.split(":").pop();
    const response = await fetch(
      `${LINKEDIN_API_BASE}/networkSizes/${organizationUrn}?edgeType=CompanyFollowedByMember`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      return { error: data.message || "Failed to get followers" };
    }

    return {
      followers: data.firstDegreeSize || 0,
    };
  } catch (error) {
    return { error: `Failed to get followers: ${error}` };
  }
}

export const linkedInApi = {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getProfile,
  getOrganizations,
  postToLinkedIn,
  getPostAnalytics,
  getOrganizationFollowers,
};
