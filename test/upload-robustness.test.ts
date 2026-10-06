import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRODUCT_IMAGE_MAX,
  UPLOAD_MAX_FILES_PER_REQUEST,
  UPLOAD_MAX_FILE_BYTES,
  UPLOAD_BATCH_SIZE,
  UPLOAD_FAILED_TOO_MANY,
  UPLOAD_FAILED_TOO_LARGE,
  UPLOAD_FAILED_TYPE,
} from '../src/config/upload.js';
import {
  validateImageFiles,
  uploadErrorText,
  downscaleImage,
  extOf,
} from '../src/utils/upload.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f: string) => fs.readFileSync(path.join(root, f), 'utf8');
const F = (name: string, size: number, type: string) => ({ name, size, type });

describe('Upload robustness — shared limits', () => {
  it('cap is raised past 10 and aligned across layers', () => {
    expect(PRODUCT_IMAGE_MAX).toBeGreaterThan(10);
    expect(UPLOAD_MAX_FILES_PER_REQUEST).toBeGreaterThanOrEqual(PRODUCT_IMAGE_MAX);
    expect(UPLOAD_MAX_FILE_BYTES).toBe(8 * 1024 * 1024);
    expect(UPLOAD_BATCH_SIZE).toBeLessThanOrEqual(10);
  });

  it('backend enforces the shared constants (no hardcoded drift)', () => {
    const admin = read('api/admin.js');
    expect(admin.includes('UPLOAD_MAX_FILES_PER_REQUEST'), 'multer cap from config').toBe(true);
    expect(admin.includes('UPLOAD_MAX_FILE_BYTES'), 'size cap from config').toBe(true);
    expect(admin.includes('UPLOAD_ALLOWED_EXTENSIONS'), 'ext list from config').toBe(true);
    expect(admin.includes('array(\'images\', 10)'), 'no hardcoded 10-file cap').toBe(false);
  });

  it('product form no longer pins the old 10-image cap', () => {
    expect(read('src/pages/admin/AdminProductsPage.jsx').includes('maxImages={10}'), 'old cap gone').toBe(false);
  });
});

describe('Upload robustness — pre-flight validator', () => {
  it('accepts a clean batch', () => {
    const files = [F('a.jpg', 1000, 'image/jpeg'), F('b.png', 2000, 'image/png')];
    const { accepted, issues } = validateImageFiles(files, { existingCount: 0, max: 20 });
    expect(accepted).toHaveLength(2);
    expect(issues).toHaveLength(0);
  });

  it('names over-cap files instead of failing silently', () => {
    const files = [F('a.jpg', 100, 'image/jpeg'), F('b.jpg', 100, 'image/jpeg'), F('c.jpg', 100, 'image/jpeg')];
    const { accepted, issues } = validateImageFiles(files, { existingCount: 19, max: 20 });
    expect(accepted.map((f) => f.name)).toEqual(['a.jpg']);
    expect(issues.map((i) => [i.name, i.code])).toEqual([
      ['b.jpg', UPLOAD_FAILED_TOO_MANY],
      ['c.jpg', UPLOAD_FAILED_TOO_MANY],
    ]);
  });

  it('rejects HEIC, oversized, and extension-less files per file', () => {
    const files = [
      F('IMG_0001.HEIC', 3 * 1024 * 1024, 'image/heic'),
      F('huge.png', 9 * 1024 * 1024, 'image/png'),
      F('noext', 100, ''),
      F('ok.webp', 100, 'image/webp'),
    ];
    const { accepted, issues } = validateImageFiles(files, { existingCount: 0, max: 20 });
    expect(accepted.map((f) => f.name)).toEqual(['ok.webp']);
    expect(issues.map((i) => [i.name, i.code])).toEqual([
      ['IMG_0001.HEIC', UPLOAD_FAILED_TYPE],
      ['huge.png', UPLOAD_FAILED_TOO_LARGE],
      ['noext', UPLOAD_FAILED_TYPE],
    ]);
  });

  it('one bad file never blocks the good ones (mixed 20-file batch)', () => {
    const files = Array.from({ length: 20 }, (_, i) => F(`p${i}.jpg`, 500, 'image/jpeg'));
    files[7] = F('bad.heic', 500, 'image/heic');
    const { accepted, issues } = validateImageFiles(files, { existingCount: 0, max: 20 });
    expect(accepted).toHaveLength(19);
    expect(issues).toHaveLength(1);
    expect(issues[0].name).toBe('bad.heic');
  });

  it('HEIC gets a tailored bilingual hint, others get named reasons', () => {
    expect(uploadErrorText(UPLOAD_FAILED_TYPE, 'ko', 'IMG_1.HEIC')).toMatch(/HEIC/);
    expect(uploadErrorText(UPLOAD_FAILED_TYPE, 'en', 'IMG_1.HEIC')).toMatch(/HEIC/);
    expect(uploadErrorText(UPLOAD_FAILED_TOO_LARGE, 'ko', 'huge.png')).toMatch(/huge\.png/);
    expect(uploadErrorText(UPLOAD_FAILED_TOO_MANY, 'ko', 'x.jpg', { max: 20 })).toMatch(/20/);
  });

  it('ext parsing ignores query strings and case', () => {
    expect(extOf('PHOTO.JPG?x=1')).toBe('jpg');
    expect(extOf('a.WeBp')).toBe('webp');
    expect(extOf('noext')).toBe('');
  });

  it('downscale passes files through untouched without a DOM', async () => {
    const f = F('big.jpg', 5 * 1024 * 1024, 'image/jpeg');
    await expect(downscaleImage(f)).resolves.toBe(f);
  });
});

describe('Upload robustness — response contract', () => {
  it('backend returns per-file uploaded/failed (never whole-batch fail)', () => {
    const admin = read('api/admin.js');
    expect(admin.includes('failed.push(problem)'), 'validation failures collected').toBe(true);
    expect(admin.includes('uploaded,'), 'uploaded array').toBe(true);
    expect(admin.includes('failed,'), 'failed array').toBe(true);
    expect(admin.includes('UPLOAD_FAILED_STORAGE'), 'storage-full code').toBe(true);
  });

  it('uploader uploads sequentially, surfaces per-file reasons', () => {
    const ui = read('src/components/admin/ImageUploader.jsx');
    expect(ui.includes('UPLOAD_BATCH_SIZE'), 'batched requests').toBe(true);
    expect(ui.includes('validateImageFiles'), 'pre-flight').toBe(true);
    expect(ui.includes('downscaleImage'), 'downscale').toBe(true);
    expect(ui.includes('data.failed'), 'reads per-file failures').toBe(true);
    expect(ui.includes('사진 업로드 중 오류가 발생했습니다.'), 'generic toast gone').toBe(false);
  });
});
