/**
 * Storage Module - ZERO MANUS DEPENDENCIES
 * 
 * Uses direct AWS S3 API instead of Manus storage proxy.
 * Fully portable and self-hostable.
 */

export {
  storagePut,
  storageGet,
  storageDelete,
  isS3Configured,
  getS3Status,
} from './_core/directS3';
