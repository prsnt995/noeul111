// Shared upload limits — single source of truth for product/media uploads.
// Imported by both the Vite frontend (src/) and the Node API (api/),
// mirroring src/config/business.js. Change the cap here and both sides
// plus the consistency tests follow.

/** Max images attachable to one product. */
export const PRODUCT_IMAGE_MAX = 20;

/** Max files the upload endpoint accepts per request (DoS guard). */
export const UPLOAD_MAX_FILES_PER_REQUEST = 20;

/** Max bytes per file accepted by the API (8 MB, mirrors the bucket). */
export const UPLOAD_MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Files above this size are downscaled client-side before upload. */
export const UPLOAD_DOWNSCALE_ABOVE_BYTES = 2 * 1024 * 1024;

/** Longest edge (px) after client-side downscale. */
export const UPLOAD_DOWNSCALE_MAX_DIM = 2048;

/** Frontend upload batch size (sequential requests dodge serverless body caps). */
export const UPLOAD_BATCH_SIZE = 3;

/** Extensions accepted end-to-end (picker filter, pre-flight, API, bucket). */
export const UPLOAD_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

/** MIME allowlist aligned with the extensions above. */
export const UPLOAD_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

/** Machine-readable per-file failure codes (API ↔ UI contract). */
export const UPLOAD_FAILED_TOO_MANY = 'TOO_MANY_FILES';
export const UPLOAD_FAILED_TOO_LARGE = 'FILE_TOO_LARGE';
export const UPLOAD_FAILED_TYPE = 'UNSUPPORTED_TYPE';
export const UPLOAD_FAILED_STORAGE = 'STORAGE_FULL';
export const UPLOAD_FAILED_GENERIC = 'UPLOAD_FAILED';
export const UPLOAD_FAILED_EMPTY = 'NO_FILES';
