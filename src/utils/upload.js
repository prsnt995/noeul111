import {
  PRODUCT_IMAGE_MAX,
  UPLOAD_TARGET_FILE_BYTES,
  UPLOAD_ACCEPT_MAX_BYTES,
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_ALLOWED_MIME,
  UPLOAD_FAILED_TOO_MANY,
  UPLOAD_FAILED_TOO_LARGE,
  UPLOAD_FAILED_COMPRESS,
  UPLOAD_FAILED_TYPE,
  UPLOAD_FAILED_STORAGE,
  UPLOAD_FAILED_GENERIC,
  UPLOAD_DOWNSCALE_MAX_DIM,
  UPLOAD_DOWNSCALE_ABOVE_BYTES,
} from '../config/upload.js';

/** Pure helpers for resilient uploads. validateImageFiles touches no DOM so it is unit-testable. */

export function extOf(fileName) {
  const base = String(fileName || '').split('?')[0];
  const dot = base.lastIndexOf('.');
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : '';
}

export function isHeicFile(name, type) {
  return /\.hei(c|f)$/i.test(String(name || '')) || String(type || '').toLowerCase().includes('heic');
}

/**
 * Pre-flight validationNaming each bad file instead of failing the batch.
 * files: File[] (or file-likes {name,size,type}).
 * Returns { accepted: File[], issues: [{ file, name, code }] }.
 */
export function validateImageFiles(files, { existingCount = 0, max = PRODUCT_IMAGE_MAX } = {}) {
  const list = Array.from(files || []);
  const accepted = [];
  const issues = [];
  const room = Math.max(0, (max || 0) - (existingCount || 0));
  list.forEach((f, i) => {
    const name = f?.name || `file-${i + 1}`;
    if (accepted.length >= room) {
      issues.push({ file: f, name, code: UPLOAD_FAILED_TOO_MANY });
      return;
    }
    const ext = extOf(name);
    const mime = String(f?.type || '').toLowerCase();
    const extOk = UPLOAD_ALLOWED_EXTENSIONS.includes(ext);
    const mimeOk = !mime || UPLOAD_ALLOWED_MIME.has(mime);
    if (!extOk || !mimeOk) {
      issues.push({ file: f, name, code: UPLOAD_FAILED_TYPE });
      return;
    }
    if (!f?.size || f.size > UPLOAD_ACCEPT_MAX_BYTES) {
      issues.push({ file: f, name, code: f?.size ? UPLOAD_FAILED_TOO_LARGE : UPLOAD_FAILED_GENERIC });
      return;
    }
    accepted.push(f);
  });
  return { accepted, issues };
}

const ERROR_TEXT = {
  [UPLOAD_FAILED_TOO_MANY]: { ko: '개수 초과: 상품당 최대 {max}장까지 등록할 수 있습니다.', en: 'Too many files: at most {max} images per product.' },
  [UPLOAD_FAILED_TOO_LARGE]: { ko: '용량 초과: 파일당 최대 25MB까지 업로드할 수 있습니다 (자동 압축 후 업로드).', en: 'File too large: max 25MB per file (auto-compressed before upload).' },
  [UPLOAD_FAILED_COMPRESS]: { ko: '압축 실패: 1MB 이하로 줄일 수 없습니다. 더 작은 이미지를 사용해주세요.', en: 'Compression failed: could not reduce below 1MB. Use a smaller image.' },
  [UPLOAD_FAILED_TYPE]: { ko: '지원하지 않는 형식: JPG, PNG, WEBP, GIF, AVIF만 가능합니다.', en: 'Unsupported format: JPG, PNG, WEBP, GIF, AVIF only.' },
  [UPLOAD_FAILED_STORAGE]: { ko: '저장소를 사용할 수 없습니다. 용량이 가득 찼거나 설정 문제일 수 있습니다.', en: 'Storage unavailable — it may be full or misconfigured.' },
  [UPLOAD_FAILED_GENERIC]: { ko: '업로드 실패: 파일을 읽을 수 없습니다.', en: 'Upload failed: could not read the file.' },
  NO_FILES: { ko: '업로드할 파일이 없습니다.', en: 'No files to upload.' },
};

/** Bilingual message for a failure code; HEIC gets a tailored hint. */
export function uploadErrorText(code, lang = 'ko', fileName = '', vars = {}) {
  if (isHeicFile(fileName, '')) {
    return lang === 'en'
      ? 'iPhone HEIC photo: change Camera settings to JPEG (or screenshot it) and retry.'
      : '아이폰 HEIC 사진: 카메라 설정을 JPEG로 바꾸거나 스크린샷으로 저장한 뒤 다시 시도하세요.';
  }
  const entry = ERROR_TEXT[code] || ERROR_TEXT[UPLOAD_FAILED_GENERIC];
  let text = lang === 'en' ? entry.en : entry.ko;
  for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, String(v));
  if (fileName) text = `${fileName}: ${text}`;
  return text;
}

/**
 * Downscale/compress oversized rasters in-browser (dependency-free canvas
 * path). Progressively reduces dimensions and quality until the result fits
 * UPLOAD_TARGET_FILE_BYTES (1 MB), so even large source files are uploaded
 * automatically instead of being rejected. Small files return untouched.
 * Never throws: returns the original file on any failure.
 */
export function downscaleImage(file, { maxDim = UPLOAD_DOWNSCALE_MAX_DIM, maxBytes = UPLOAD_DOWNSCALE_ABOVE_BYTES, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    try {
      const mime = String(file?.type || '').toLowerCase();
      if (!file || typeof window === 'undefined' || typeof document === 'undefined') return resolve(file);
      if (mime === 'image/gif' || isHeicFile(file.name, mime)) return resolve(file);

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const runPass = (dim, q, asJpeg) => new Promise((res) => {
          try {
            const scale = Math.min(1, dim / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) return res(null);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const outMime = asJpeg ? 'image/jpeg' : (mime === 'image/png' ? 'image/png' : 'image/jpeg');
            canvas.toBlob((blob) => {
              if (!blob) return res(null);
              const name = outMime === 'image/jpeg' && /\.(png|webp|avif)$/i.test(file.name)
                ? file.name.replace(/\.(png|webp|avif)$/i, '.jpg')
                : file.name;
              res(new File([blob], name, { type: outMime }));
            }, outMime, q);
          } catch {
            res(null);
          }
        });

        (async () => {
          let best = null;
          let dim = maxDim;
          let q = quality;
          for (let i = 0; i < 5; i += 1) {
            const asJpeg = !(mime === 'image/png' && file.size <= maxBytes);
            const candidate = await runPass(dim, q, asJpeg);
            if (candidate && (!best || candidate.size < best.size)) best = candidate;
            if (candidate && candidate.size <= UPLOAD_TARGET_FILE_BYTES) { best = candidate; break; }
            dim = Math.round(dim * 0.7);
            q = Math.max(0.5, q - 0.08);
            if (dim < 320) break;
          }
          if (!best || best.size > UPLOAD_TARGET_FILE_BYTES) {
            let dim2 = Math.min(maxDim, 1280);
            let q2 = 0.7;
            for (let i = 0; i < 4; i += 1) {
              const candidate = await runPass(dim2, q2, true);
              if (candidate && (!best || candidate.size < best.size)) best = candidate;
              if (candidate && candidate.size <= UPLOAD_TARGET_FILE_BYTES) { best = candidate; break; }
              dim2 = Math.round(dim2 * 0.7);
              q2 = Math.max(0.4, q2 - 0.1);
              if (dim2 < 240) break;
            }
          }
          if (!best) return resolve(file);
          // Keep the compressed result if it fits the cap OR is smaller than
          // the original (an improvement). Only fall back to the original when
          // compression made things worse AND still over the cap.
          if (best.size <= UPLOAD_TARGET_FILE_BYTES || best.size < file.size) {
            return resolve(best);
          }
          resolve(file);
        })().catch(() => resolve(file));
      };
      img.onerror = () => { try { URL.revokeObjectURL(url); } catch { /* ignore */ } resolve(file); };
      img.src = url;
    } catch {
      resolve(file);
    }
  });
}
