/**
 * X (Twitter) API Integration
 * 
 * Handles OAuth 2.0 authentication and posting to X/Twitter.
 * Uses Twitter API v2 with OAuth 2.0 PKCE flow.
 */

interface TwitterTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
  };
}

interface TwitterError {
  error: string;
  error_description?: string;
}

/**
 * Generate a random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate code challenge from verifier (S256)
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const twitterApi = {
  /**
   * Get OAuth 2.0 authorization URL
   */
  getAuthorizationUrl: async (
    clientId: string,
    redirectUri: string,
    state: string
  ): Promise<{ url: string; codeVerifier: string }> => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const scopes = [
      'tweet.read',
      'tweet.write',
      'users.read',
      'offline.access',
    ];

    const url = new URL('https://twitter.com/i/oauth2/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return { url: url.toString(), codeVerifier };
  },

  /**
   * Exchange authorization code for access token
   */
  exchangeCodeForToken: async (
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<TwitterTokenResponse | TwitterError> => {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to exchange code for token' };
      }

      return data as TwitterTokenResponse;
    } catch (error) {
      return { error: `Token exchange failed: ${error}` };
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<TwitterTokenResponse | TwitterError> => {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to refresh token' };
      }

      return data as TwitterTokenResponse;
    } catch (error) {
      return { error: `Token refresh failed: ${error}` };
    }
  },

  /**
   * Get authenticated user profile
   */
  getProfile: async (
    accessToken: string
  ): Promise<TwitterUserResponse | TwitterError> => {
    try {
      const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || data.title || 'Failed to get profile' };
      }

      return data as TwitterUserResponse;
    } catch (error) {
      return { error: `Get profile failed: ${error}` };
    }
  },

  /**
   * Post a tweet
   */
  postTweet: async (
    accessToken: string,
    text: string,
    replyToId?: string
  ): Promise<TwitterTweetResponse | TwitterError> => {
    try {
      const body: any = { text };
      if (replyToId) {
        body.reply = { in_reply_to_tweet_id: replyToId };
      }

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || data.title || 'Failed to post tweet' };
      }

      return data as TwitterTweetResponse;
    } catch (error) {
      return { error: `Post tweet failed: ${error}` };
    }
  },

  /**
   * Post a thread (multiple tweets)
   */
  postThread: async (
    accessToken: string,
    tweets: string[]
  ): Promise<{ tweets: TwitterTweetResponse[] } | TwitterError> => {
    try {
      const postedTweets: TwitterTweetResponse[] = [];
      let previousTweetId: string | undefined;

      for (const text of tweets) {
        const result = await twitterApi.postTweet(accessToken, text, previousTweetId);
        
        if ('error' in result) {
          return result;
        }

        postedTweets.push(result);
        previousTweetId = result.data.id;

        // Small delay between tweets to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return { tweets: postedTweets };
    } catch (error) {
      return { error: `Post thread failed: ${error}` };
    }
  },

  /**
   * Delete a tweet
   */
  deleteTweet: async (
    accessToken: string,
    tweetId: string
  ): Promise<{ deleted: boolean } | TwitterError> => {
    try {
      const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || data.title || 'Failed to delete tweet' };
      }

      return { deleted: data.data?.deleted || false };
    } catch (error) {
      return { error: `Delete tweet failed: ${error}` };
    }
  },
};
