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

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9가-힣_-]/g, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase || 'receipt'}-${uniqueSuffix}${ext}`);
  },
});

// File filter (Images only)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg|pdf/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  if (allowed.test(ext) || allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일(JPG, PNG, WEBP, GIF, PDF)만 업로드 가능합니다.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});
