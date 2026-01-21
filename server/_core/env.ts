/**
 * Environment Variables - ZERO MANUS DEPENDENCIES
 * 
 * All environment variables are standard and portable.
 * No Manus-specific variables required.
 */

export const ENV = {
  // App Configuration
  appId: process.env.APP_ID ?? "marketing-control-center",
  isProduction: process.env.NODE_ENV === "production",
  
  // Authentication (Simple JWT)
  jwtSecret: process.env.JWT_SECRET ?? "",
  adminUsername: process.env.ADMIN_USERNAME ?? "admin",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
  
  // Database (Marketing Control Center's own DB)
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Just Talk Database Connection (READ-ONLY)
  justTalkDatabaseUrl: process.env.JUST_TALK_DATABASE_URL ?? "",
  
  // OpenAI (Direct API - no proxy)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  
  // AWS S3 (Direct - no proxy)
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "", // Optional: for S3-compatible services
  
  // Twilio (Direct - for notifications)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
  twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER ?? "",
  ownerPhoneNumber: process.env.OWNER_PHONE_NUMBER ?? "",
  
  // Owner Info
  ownerName: process.env.OWNER_NAME ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
};

/**
 * Check if required environment variables are configured
 */
export function checkRequiredEnv(): { valid: boolean; missing: string[] } {
  const required = [
    "JWT_SECRET",
    "ADMIN_PASSWORD_HASH",
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get environment status for debugging
 */
export function getEnvStatus(): Record<string, boolean> {
  return {
    jwtSecret: Boolean(ENV.jwtSecret),
    adminPasswordHash: Boolean(ENV.adminPasswordHash),
    databaseUrl: Boolean(ENV.databaseUrl),
    justTalkDatabaseUrl: Boolean(ENV.justTalkDatabaseUrl),
    openaiApiKey: Boolean(ENV.openaiApiKey),
    s3Configured: Boolean(ENV.s3Bucket && ENV.s3AccessKeyId && ENV.s3SecretAccessKey),
    twilioConfigured: Boolean(ENV.twilioAccountSid && ENV.twilioAuthToken),
  };
}
