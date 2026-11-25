// Shared upload limits — single source of truth for product/media uploads.
// Imported by both the Vite frontend (src/) and the Node API (api/),
// mirroring src/config/business.js. Change the cap here and both sides
// plus the consistency tests follow.

/** Max images attachable to one product. */
export const PRODUCT_IMAGE_MAX = 20;

/** Max files the upload endpoint accepts per request (DoS guard). */
export const UPLOAD_MAX_FILES_PER_REQUEST = 4;

/**
 * Max bytes per file accepted by the API (mirrors the bucket).
 *
 * Vercel functions reject request bodies above 4.5 MB *before* Express runs,
 * so a per-request total above that is a silent hard failure. With 4 files at
 * 1 MB the worst case is 4 MB plus multipart overhead — safely under the limit.
 */
export const UPLOAD_MAX_FILE_BYTES = 1 * 1024 * 1024;

/**
 * Hard ceiling for a file we are willing to accept from the browser BEFORE
 * client-side downscaling. Anything larger is rejected outright (canvas
 * downscaling cannot be trusted on huge inputs and Vercel would reject the
 * request if downscaling failed). Downscaled output must still fit
 * UPLOAD_MAX_FILE_BYTES.
 */
export const UPLOAD_ACCEPT_MAX_BYTES = 12 * 1024 * 1024;

/** Files above this size are compressed client-side before upload. */
export const UPLOAD_DOWNSCALE_ABOVE_BYTES = 512 * 1024;

/** Longest edge (px) after client-side downscale — originals stay small so
 * pages don't download multi-megabyte source files. */
export const UPLOAD_DOWNSCALE_MAX_DIM = 1600;

/** Frontend upload batch size (sequential requests dodge serverless body caps). */
export const UPLOAD_BATCH_SIZE = 3;

/** Max concurrent upload batches — makes multi-file uploads feel instant. */
export const UPLOAD_CONCURRENCY = 3;

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
export const UPLOAD_FAILED_NOT_CONFIGURED = 'STORAGE_NOT_CONFIGURED';
export const UPLOAD_FAILED_ACCEPT_TOO_LARGE = 'FILE_TOO_LARGE_TO_PROCESS';