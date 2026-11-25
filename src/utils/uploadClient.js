import { adminApi } from './api.js';
import {
  UPLOAD_BATCH_SIZE,
  UPLOAD_CONCURRENCY,
  UPLOAD_FAILED_COMPRESS,
  UPLOAD_FAILED_GENERIC,
  UPLOAD_MAX_FILE_BYTES,
} from '../config/upload.js';
import {
  validateImageFiles,
  downscaleImage,
  uploadErrorText,
} from './upload.js';

/**
 * Shared, resilient image upload used by the product form, the media library
 * and the media picker modal. Validates, downscales, batches, and aggregates
 * per-file results so callers can report truthful counts.
 *
 * Returns { uploaded: [{url,name,size}], failed: [{name,code}] }.
 */
export async function uploadImages(files, { existingCount = 0, max = 20 } = {}) {
  const { accepted, issues } = validateImageFiles(files, { existingCount, max });
  const failed = issues.map((i) => ({ name: i.name, code: i.code }));

  const prepared = [];
  for (const f of accepted) {
    const out = await downscaleImage(f);
    if (out.size > UPLOAD_MAX_FILE_BYTES) {
      failed.push({ name: out.name || f.name, code: UPLOAD_FAILED_COMPRESS });
    } else {
      prepared.push(out);
    }
  }

  const uploaded = [];
  const batches = [];
  for (let i = 0; i < prepared.length; i += UPLOAD_BATCH_SIZE) {
    batches.push(prepared.slice(i, i + UPLOAD_BATCH_SIZE));
  }
  const queue = [...batches];
  const workers = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length || 1) }, async () => {
    while (queue.length) {
      const batch = queue.shift();
      if (!batch) continue;
      const fd = new FormData();
      batch.forEach((file) => fd.append('images', file));
      try {
        const data = await adminApi.post('/admin/upload-multiple', fd);
        if (data?.success) {
          const rows = data.uploaded || data.data || [];
          uploaded.push(...rows.map((u) => ({ url: u.url, name: u.name || '', size: u.size || 0 })));
          for (const f of (data.failed || [])) failed.push({ name: f.name, code: f.code });
        } else {
          const code = data?.code || UPLOAD_FAILED_GENERIC;
          batch.forEach((file) => failed.push({ name: file.name, code }));
        }
      } catch (err) {
        const code = (err?.message && /^[A-Z_]+$/.test(err.message)) ? err.message : UPLOAD_FAILED_GENERIC;
        batch.forEach((file) => failed.push({ name: file.name, code }));
      }
    }
  });
  await Promise.all(workers);

  return { uploaded, failed, accepted, rejected: issues };
}

export { uploadErrorText };