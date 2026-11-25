import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('Home editor contracts', () => {
  const admin = read('api/admin.js');
  const app = read('api/app.js');
  const homePage = read('src/pages/HomePage.jsx');
  const homeBlocks = read('src/components/home/HomeBlocks.jsx');
  const adminPage = read('src/pages/admin/AdminHomePage.jsx');
  const layout = read('src/components/admin/AdminLayout.jsx');
  const appjsx = read('src/App.jsx');

  it('admin endpoints exist', () => {
    expect(admin).toContain("app.get('/api/v1/admin/content/home'");
    expect(admin).toContain("app.put('/api/v1/admin/content/home'");
    expect(admin).toContain("app.post('/api/v1/admin/content/home/publish'");
    expect(admin).toContain("app.post('/api/v1/admin/content/home/discard'");
    expect(admin).toContain("app.delete('/api/v1/admin/content/home'");
  });
  it('admin writes are step-up guarded', () => {
    const putBlock = admin.slice(admin.indexOf("app.put('/api/v1/admin/content/home'"), admin.indexOf("app.post('/api/v1/admin/content/home/publish'"));
    expect(putBlock).toContain('needStep(R.cms)');
    expect(putBlock).toContain('auditLog');
  });
  it('publish endpoint copies draft and audits', () => {
    const block = admin.slice(admin.indexOf("app.post('/api/v1/admin/content/home/publish'"), admin.indexOf("app.post('/api/v1/admin/content/home/discard'"));
    expect(block).toContain('HOME_LAYOUT_PUBLISH');
    expect(block).toContain('LAYOUT_EMPTY');
  });
  it('storefront returns layout from published doc', () => {
    expect(app).toContain("key', 'home_layout'");
    expect(app).toContain('layout: homeLayout');
    expect(app).toContain('by_id');
  });
  it('HomePage uses published layout when present', () => {
    expect(homePage).toContain('data.layout');
    expect(homePage).toContain('HomeBlocks');
  });
  it('HomeBlocks renders all block types', () => {
    for (const t of ['hero', 'delivery', 'product_rail', 'category_tiles', 'category_row', 'editorial']) {
      expect(homeBlocks).toContain(`case '${t}'`);
    }
    expect(homeBlocks).toContain('BannerBlock');
    expect(homeBlocks).toContain('groupBannerRows');
    expect(homeBlocks).toContain('PromoBanner');
  });
  it('admin page has drag and drop + save/publish/discard/reset', () => {
    expect(adminPage).toContain('draggable');
    expect(adminPage).toContain('handleDrop');
    expect(adminPage).toContain('saveDraft');
    expect(adminPage).toContain('doPublish');
    expect(adminPage).toContain('doDiscard');
    expect(adminPage).toContain('doReset');
    expect(adminPage).toContain('ProductPickerModal');
  });
  it('nav + lazy route wired', () => {
    expect(layout).toContain("/admin/home");
    expect(appjsx).toContain("AdminHomePage");
    expect(appjsx).toContain('path="/admin/home"');
  });
});
