import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Finding #7: never trust the client filename or a lone MIME/extension
// match. Only raster images + PDF are accepted; SVG/HTML are rejected
// because they execute as active content on the serving origin.
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']);

// Storage config — server-generated safe filename, extension derived from
// the validated MIME type (never from the user filename).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const mime = String(file.mimetype || '').toLowerCase();
    const ext = MIME_TO_EXT[mime] || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

// File filter (images + PDF only). BOTH extension and MIME must allowlist;
// SVG, HTML, executables and archives are always rejected.
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();

  const extOk = ALLOWED_EXTS.has(ext);
  const mimeOk = Object.hasOwn(MIME_TO_EXT, mime);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일(JPG, PNG, WEBP, GIF, PDF)만 업로드 가능합니다. SVG/HTML은 허용되지 않습니다.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 1 }, // 8MB, single file
});
