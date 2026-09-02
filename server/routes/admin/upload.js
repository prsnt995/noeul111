import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { verifyAdmin } from '../../middleware/auth.js';
import { query } from '../../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9가-힣_-]/g, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase || 'image'}-${uniqueSuffix}${ext}`);
  },
});

// Multer file filter (Images only)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|svg/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype.toLowerCase();

  if (allowed.test(ext) || allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일(JPG, PNG, WEBP, GIF, SVG)만 업로드 가능합니다.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const router = express.Router();
router.use(verifyAdmin);

// Helper to auto-register into media library
function registerMedia(file, customName) {
  const fileUrl = `/uploads/${file.filename}`;
  const name = customName || file.originalname;
  const sizeBytes = file.size;

  try {
    query.run(`
      INSERT INTO media (name, url, file_type, size_bytes, tags)
      VALUES (?, ?, 'image', ?, 'uploaded,product')
    `, name, fileUrl, sizeBytes);
  } catch (err) {
    console.error('Auto register media error:', err);
  }

  return {
    url: fileUrl,
    name: file.originalname,
    filename: file.filename,
    size: file.size,
  };
}

// Single Image Upload
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '업로드할 이미지 파일이 선택되지 않았습니다.' });
    }

    const savedFile = registerMedia(req.file, req.body?.name);
    res.json({
      success: true,
      message: '이미지가 성공적으로 업로드되었습니다.',
      data: savedFile,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: '이미지 업로드 실패: ' + error.message });
  }
});

// Multiple Images Upload (up to 10 images at once)
router.post('/upload-multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '업로드할 이미지 파일들이 선택되지 않았습니다.' });
    }

    const savedFiles = req.files.map((file) => registerMedia(file));

    res.json({
      success: true,
      message: `${savedFiles.length}개의 이미지가 성공적으로 업로드되었습니다.`,
      data: savedFiles,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ success: false, message: '다중 이미지 업로드 실패: ' + error.message });
  }
});

export default router;
