import { describe, it, expect } from 'vitest';
import {
  normalizeBlocks,
  normalizeHomeDoc,
  hasUnpublishedChanges,
  defaultHomeLayout,
  newBlock,
  moveBlock,
  groupBannerRows,
  blockSummary,
  HOME_BLOCK_TYPES,
  MAX_HOME_BLOCKS,
} from '../src/utils/homeLayout.js';

describe('home layout — normalizeBlocks', () => {
  it('drops unknown block types', () => {
    const out = normalizeBlocks([{ type: 'nope' }, { type: 'hero' }], {});
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('hero');
  });
  it('clamps rail limit to 1..12', () => {
    const out = normalizeBlocks([{ type: 'product_rail', limit: 999 }, { type: 'product_rail', limit: 0 }], {});
    expect(out[0].limit).toBe(12);
    expect(out[1].limit).toBe(1);
  });
  it('dedupes block ids', () => {
    const out = normalizeBlocks([{ type: 'hero', id: 'x' }, { type: 'hero', id: 'x' }], {});
    expect(new Set(out.map(b => b.id)).size).toBe(2);
  });
  it('caps at MAX_HOME_BLOCKS', () => {
    const arr = Array.from({ length: MAX_HOME_BLOCKS + 5 }, () => ({ type: 'hero' }));
    expect(normalizeBlocks(arr, {})).toHaveLength(MAX_HOME_BLOCKS);
  });
  it('strips unknown keys (no mass assignment)', () => {
    const out = normalizeBlocks([{ type: 'hero', evil: '<script>' }], {});
    expect((out[0] as any).evil).toBeUndefined();
  });
  it('normalizes manual product_ids order + dedupe + cap', () => {
    const out = normalizeBlocks([{ type: 'product_rail', source: 'manual', product_ids: [1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }], {});
    expect(out[0].product_ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it('clears banner_id when not in context bannerIds', () => {
    const ctx = { bannerIds: new Set(['b1']) };
    const out = normalizeBlocks([{ type: 'banner', source: 'specific', banner_id: 'ghost' }], ctx);
    expect(out[0].banner_id).toBe('');
  });
});

describe('home layout — normalizeHomeDoc (draft/publish)', () => {
  it('seeds draft with default layout when empty', () => {
    const doc = normalizeHomeDoc(null, { categories: [{ slug: 'tops', name_ko: '상의' }], maxRows: 1 });
    expect(Array.isArray(doc.draft.blocks)).toBe(true);
    expect(doc.draft.blocks.length).toBeGreaterThan(0);
    expect(doc.published.blocks).toEqual([]);
  });
  it('migrates legacy { blocks } into both draft and published', () => {
    const doc = normalizeHomeDoc({ blocks: [{ type: 'hero' }] }, {});
    expect(doc.draft.blocks).toHaveLength(1);
    expect(doc.published.blocks).toHaveLength(1);
  });
  it('migrates legacy { sections }', () => {
    const doc = normalizeHomeDoc({ sections: [{ type: 'delivery' }] }, {});
    expect(doc.draft.blocks[0].type).toBe('delivery');
  });
  it('preserves draft/published separation', () => {
    const doc = normalizeHomeDoc({ revision: 3, draft: { blocks: [{ type: 'hero' }] }, published: { blocks: [] } }, {});
    expect(doc.revision).toBe(3);
    expect(doc.draft.blocks).toHaveLength(1);
    expect(doc.published.blocks).toHaveLength(0);
  });
});

describe('home layout — hasUnpublishedChanges', () => {
  it('false when equal', () => {
    const doc = normalizeHomeDoc({ draft: { blocks: [{ type: 'hero', id: 'h1' }] }, published: { blocks: [{ type: 'hero', id: 'h1' }] } }, {});
    expect(hasUnpublishedChanges(doc)).toBe(false);
  });
  it('true when different', () => {
    const doc = normalizeHomeDoc({ draft: { blocks: [{ type: 'hero', id: 'h1' }] }, published: { blocks: [{ type: 'delivery', id: 'd1' }] } }, {});
    expect(hasUnpublishedChanges(doc)).toBe(true);
  });
  it('true when lengths differ', () => {
    const doc = normalizeHomeDoc({ draft: { blocks: [{ type: 'hero', id: 'h1' }, { type: 'hero', id: 'h2' }] }, published: { blocks: [{ type: 'hero', id: 'h1' }] } }, {});
    expect(hasUnpublishedChanges(doc)).toBe(true);
  });
});

describe('home layout — defaultHomeLayout', () => {
  it('mirrors legacy order with mode-driven rows', () => {
    const cats = [{ slug: 'a', name_ko: 'A' }, { slug: 'b', name_ko: 'B' }];
    const blocks = defaultHomeLayout({ categories: cats, maxRows: 2 });
    expect(blocks[0].type).toBe('hero');
    expect(blocks[1].type).toBe('delivery');
    expect(blocks[2].type).toBe('product_rail');
    expect(blocks[2].source).toBe('best');
    const rowSlugs = blocks.filter(b => b.type === 'category_row').map(b => b.category_slug);
    expect(rowSlugs).toEqual(['a', 'b']);
  });
  it('no rows when sparse', () => {
    const blocks = defaultHomeLayout({ categories: [{ slug: 'a' }], maxRows: 0 });
    expect(blocks.filter(b => b.type === 'category_row')).toHaveLength(0);
  });
});

describe('home layout — moveBlock', () => {
  it('reorders immutably', () => {
    const src = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as any;
    const out = moveBlock(src, 0, 2);
    expect(out.map((b: any) => b.id)).toEqual(['b', 'c', 'a']);
    expect(src.map((b: any) => b.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('home layout — groupBannerRows', () => {
  it('pairs consecutive half banners', () => {
    const blocks = [
      { type: 'banner', width: 'half', id: '1' },
      { type: 'banner', width: 'half', id: '2' },
      { type: 'banner', width: 'full', id: '3' },
    ];
    const g = groupBannerRows(blocks);
    expect(g[0].kind).toBe('half-row');
    expect(g[0].blocks).toHaveLength(2);
    expect(g[1].kind).toBe('full');
  });
  it('marks trailing lone half as expand', () => {
    const blocks = [{ type: 'banner', width: 'half', id: '1' }];
    const g = groupBannerRows(blocks);
    expect(g[0].expand).toBe(true);
  });
});

describe('home layout — newBlock + blockSummary', () => {
  it('newBlock generates valid block', () => {
    const b: any = newBlock('banner', { width: 'half' });
    expect(HOME_BLOCK_TYPES).toContain(b.type);
    expect(b.width).toBe('half');
    expect(typeof b.id).toBe('string');
  });
  it('blockSummary returns non-empty for known types', () => {
    expect(blockSummary({ type: 'hero', placement: 'home_hero' })).not.toBe('');
    expect(blockSummary({ type: 'product_rail', source: 'best', limit: 8, display: 'carousel', product_ids: [] })).toContain('베스트');
  });
});
