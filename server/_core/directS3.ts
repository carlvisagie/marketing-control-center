/**
 * Direct S3 Storage - ZERO MANUS DEPENDENCIES
 * 
 * This module provides direct access to AWS S3 without any Manus proxy.
 * Fully portable and self-hostable.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Environment variables for S3
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "us-east-1";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_ENDPOINT = process.env.S3_ENDPOINT; // Optional: for S3-compatible services

// Create S3 client
function getS3Client(): S3Client | null {
  if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET) {
    console.warn("[S3] Not configured - missing credentials or bucket");
    return null;
  }

  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  };

  // Support S3-compatible services (DigitalOcean Spaces, MinIO, etc.)
  if (S3_ENDPOINT) {
    config.endpoint = S3_ENDPOINT;
    config.forcePathStyle = true;
  }

  return new S3Client(config);
}

export interface StorageResult {
  key: string;
  url: string;
}

/**
 * Upload file to S3
 */
export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<StorageResult> {
  const client = getS3Client();
  if (!client) {
    throw new Error("S3 not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.");
  }

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: data,
    ContentType: contentType || "application/octet-stream",
  });

  await client.send(command);

  // Generate public URL
  const url = S3_ENDPOINT
    ? `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
    : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * Get presigned URL for file download
 */
export async function storageGet(
  key: string,
  expiresIn: number = 3600
): Promise<StorageResult> {
  const client = getS3Client();
  if (!client) {
    throw new Error("S3 not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.");
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return { key, url };
}

/**
 * Delete file from S3
 */
export async function storageDelete(key: string): Promise<void> {
  const client = getS3Client();
  if (!client) {
    throw new Error("S3 not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.");
  }

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await client.send(command);
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return Boolean(
    S3_BUCKET &&
    S3_ACCESS_KEY_ID &&
    S3_SECRET_ACCESS_KEY
  );
}

/**
 * Get S3 configuration status
 */
export function getS3Status(): {
  configured: boolean;
  bucket?: string;
  region?: string;
  endpoint?: string;
} {
  return {
    configured: isS3Configured(),
    bucket: S3_BUCKET || undefined,
    region: S3_REGION || undefined,
    endpoint: S3_ENDPOINT || undefined,
  };
}
