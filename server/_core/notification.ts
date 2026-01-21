/**
 * Notification Module - ZERO MANUS DEPENDENCIES
 * 
 * Uses direct Twilio API for SMS/WhatsApp notifications.
 * Fully portable and self-hostable.
 */

import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required.",
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required.",
    });
  }

  const title = trimValue(input.title);
  const content = trimValue(input.content);

  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`,
    });
  }

  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`,
    });
  }

  return { title, content };
};

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return Boolean(
    ENV.twilioAccountSid &&
    ENV.twilioAuthToken &&
    ENV.twilioPhoneNumber &&
    ENV.ownerPhoneNumber
  );
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!isTwilioConfigured()) {
    console.warn("[Notification] Twilio not configured");
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioAccountSid}/Messages.json`;
  const auth = Buffer.from(`${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: ENV.twilioPhoneNumber,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`[Notification] SMS failed: ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] SMS error:", error);
    return false;
  }
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  if (!isTwilioConfigured() || !ENV.twilioWhatsappNumber) {
    console.warn("[Notification] WhatsApp not configured");
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioAccountSid}/Messages.json`;
  const auth = Buffer.from(`${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${ENV.twilioWhatsappNumber}`,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`[Notification] WhatsApp failed: ${error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] WhatsApp error:", error);
    return false;
  }
}

/**
 * Notify owner via SMS (and optionally WhatsApp)
 * Returns `true` if at least one notification was sent successfully.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  const { title, content } = validatePayload(payload);

  if (!isTwilioConfigured()) {
    console.warn("[Notification] Twilio not configured - cannot notify owner");
    return false;
  }

  // Format message
  const message = `📢 ${title}\n\n${content}`;
  
  // Truncate for SMS (160 char limit for single SMS)
  const smsMessage = message.length > 1500 
    ? message.substring(0, 1497) + "..."
    : message;

  // Try SMS first
  const smsResult = await sendSMS(ENV.ownerPhoneNumber, smsMessage);

  // Also try WhatsApp if configured
  let whatsappResult = false;
  if (ENV.twilioWhatsappNumber) {
    whatsappResult = await sendWhatsApp(ENV.ownerPhoneNumber, message);
  }

  return smsResult || whatsappResult;
}

/**
 * Get notification configuration status
 */
export function getNotificationStatus(): {
  configured: boolean;
  sms: boolean;
  whatsapp: boolean;
} {
  return {
    configured: isTwilioConfigured(),
    sms: Boolean(ENV.twilioPhoneNumber),
    whatsapp: Boolean(ENV.twilioWhatsappNumber),
  };
}
