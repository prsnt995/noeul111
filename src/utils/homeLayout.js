// Shared, dependency-free homepage layout schema + normalization.
export const HOME_LAYOUT_VERSION = 1;
export const HOME_BLOCK_TYPES = ['hero','delivery','product_rail','category_tiles','category_row','banner','editorial'];
export const MAX_HOME_BLOCKS = 30;
const TEXT_LIMITS = { title_ko:80, title_en:80, eyebrow:40, subtitle_ko:160, subtitle_en:160, desc_ko:400, href:240, more_href:240, category_slug:80, placement:60, banner_id:120, variant:20, label:40 };
function clampText(v,key){const s=v==null?'':String(v);const m=TEXT_LIMITS[key];return m?s.slice(0,m):s;}
function clampInt(v,min,max,fb){const n=Number(v);if(!Number.isFinite(n))return fb;return Math.max(min,Math.min(max,Math.round(n)));}
function bool(v,fb=true){if(v===undefined||v===null)return fb;return !!v;}
function pickEnum(v,allowed,fb){return allowed.includes(v)?v:fb;}
const RAIL_SOURCES=['best','new','category','sale','all','manual'];
const DISPLAYS=['carousel','grid'];
const WIDTHS=['full','half'];
const HEIGHTS=['sm','md','lg'];
const BANNER_SOURCES=['placement','specific'];
const IMAGE_MODES=['auto','banner','product'];
function genId(){return 'blk_'+Math.random().toString(36).slice(2,10);}
export function newBlock(type,seed={}){const t=HOME_BLOCK_TYPES.includes(type)?type:'hero';const base={id:genId(),type:t,enabled:true};switch(t){case 'hero':return {...base,placement:'home_hero',banner_id:'',height:'md',title_ko:'',subtitle_ko:'',cta_href:'/shop',...seed};case 'delivery':return {...base,variant:'slim',...seed};case 'product_rail':return {...base,source:'best',category_slug:'',product_ids:[],limit:8,display:'carousel',title_ko:'',title_en:'',eyebrow:'',more_href:'',...seed};case 'category_tiles':return {...base,limit:6,...seed};case 'category_row':return {...base,category_slug:'',limit:4,show_anchored_banners:true,...seed};case 'banner':return {...base,source:'placement',placement:'home_after_best',banner_id:'',width:'full',height:'md',limit:1,...seed};case 'editorial':return {...base,banner_id:'',image_mode:'auto',title_ko:'',subtitle_ko:'',desc_ko:'',href:'/about',...seed};default:return base;}}
function normalizeHero(b){return {id:b.id,type:'hero',enabled:bool(b.enabled,true),placement:clampText(b.placement||'home_hero','placement')||'home_hero',banner_id:clampText(b.banner_id,'banner_id'),height:pickEnum(b.height,HEIGHTS,'md'),title_ko:clampText(b.title_ko,'title_ko'),subtitle_ko:clampText(b.subtitle_ko,'subtitle_ko'),cta_href:clampText(b.cta_href||'/shop','href')||'/shop'};}
function normalizeDelivery(b){return {id:b.id,type:'delivery',enabled:bool(b.enabled,true),variant:b.variant==='default'?'default':'slim'};}
function normalizeRail(b){const source=pickEnum(b.source,RAIL_SOURCES,'best');const ids=Array.isArray(b.product_ids)?b.product_ids:[];const cleanIds=[];const seen=new Set();for(const v of ids){const n=Number(v);const key=Number.isFinite(n)?n:String(v);if(seen.has(key))continue;seen.add(key);cleanIds.push(Number.isFinite(n)?n:String(v).trim());if(cleanIds.length>=12)break;}return {id:b.id,type:'product_rail',enabled:bool(b.enabled,true),source,category_slug:clampText(b.category_slug,'category_slug'),product_ids:cleanIds,limit:clampInt(b.limit,1,12,8),display:pickEnum(b.display,DISPLAYS,'carousel'),title_ko:clampText(b.title_ko,'title_ko'),title_en:clampText(b.title_en,'title_en'),eyebrow:clampText(b.eyebrow,'eyebrow'),more_href:clampText(b.more_href,'more_href')};}
function normalizeTiles(b){return {id:b.id,type:'category_tiles',enabled:bool(b.enabled,true),limit:clampInt(b.limit,2,8,6)};}
function normalizeRow(b){return {id:b.id,type:'category_row',enabled:bool(b.enabled,true),category_slug:clampText(b.category_slug,'category_slug'),limit:clampInt(b.limit,2,12,4),show_anchored_banners:bool(b.show_anchored_banners,true)};}
function normalizeBanner(b){return {id:b.id,type:'banner',enabled:bool(b.enabled,true),source:pickEnum(b.source,BANNER_SOURCES,'placement'),placement:clampText(b.placement||'home_after_best','placement')||'home_after_best',banner_id:clampText(b.banner_id,'banner_id'),width:pickEnum(b.width,WIDTHS,'full'),height:pickEnum(b.height,HEIGHTS,'md'),limit:clampInt(b.limit,1,5,1)};}
function normalizeEditorial(b){return {id:b.id,type:'editorial',enabled:bool(b.enabled,true),banner_id:clampText(b.banner_id,'banner_id'),image_mode:pickEnum(b.image_mode,IMAGE_MODES,'auto'),title_ko:clampText(b.title_ko,'title_ko'),subtitle_ko:clampText(b.subtitle_ko,'subtitle_ko'),desc_ko:clampText(b.desc_ko,'desc_ko'),href:clampText(b.href||'/about','href')||'/about'};}
const NORMALIZERS={hero:normalizeHero,delivery:normalizeDelivery,product_rail:normalizeRail,category_tiles:normalizeTiles,category_row:normalizeRow,banner:normalizeBanner,editorial:normalizeEditorial};
export function normalizeBlock(raw,ctx={}){if(!raw||typeof raw!=='object')return null;const type=HOME_BLOCK_TYPES.includes(raw.type)?raw.type:null;if(!type)return null;const id=(typeof raw.id==='string'&&raw.id.trim())?raw.id.trim():genId();const block={...raw,id,type};const normalized=NORMALIZERS[type](block);if(!normalized)return null;normalized.label=clampText(raw.label||'','label');normalized.device=pickEnum(raw.device,['all','desktop','mobile'],'all');normalized.start_date=raw.start_date||null;normalized.end_date=raw.end_date||null;try{const bannerIds=ctx.bannerIds;if(bannerIds instanceof Set && bannerIds.size){if(normalized.type==='banner'&&normalized.source==='specific'&&normalized.banner_id&&!bannerIds.has(normalized.banner_id))normalized.banner_id='';if(normalized.type==='hero'&&normalized.banner_id&&!bannerIds.has(normalized.banner_id))normalized.banner_id='';if(normalized.type==='editorial'&&normalized.banner_id&&!bannerIds.has(normalized.banner_id))normalized.banner_id='';}}catch{}return normalized;}
export function normalizeBlocks(input,ctx={}){let arr=null;if(Array.isArray(input))arr=input;else if(input&&typeof input==='object'&&Array.isArray(input.blocks))arr=input.blocks;else return [];const out=[];const seenIds=new Set();for(const raw of arr){if(out.length>=MAX_HOME_BLOCKS)break;const nb=normalizeBlock(raw,ctx);if(!nb)continue;if(seenIds.has(nb.id))nb.id=genId();seenIds.add(nb.id);out.push(nb);}return out;}
export function defaultHomeLayout(ctx={}){const categories=Array.isArray(ctx.categories)?ctx.categories:[];const maxRows=Number.isFinite(Number(ctx.maxRows))?Number(ctx.maxRows):0;const rows=maxRows>0?categories.slice(0,maxRows):[];const blocks=[];blocks.push(newBlock('hero',{placement:'home_hero'}));blocks.push(newBlock('delivery',{variant:'slim'}));blocks.push(newBlock('product_rail',{source:'best',limit:8,display:'carousel',eyebrow:'BEST SELLERS',more_href:'/shop?filter=best'}));blocks.push(newBlock('banner',{source:'placement',placement:'home_after_best',width:'full',height:'md',limit:1}));blocks.push(newBlock('category_tiles',{limit:6}));for(const c of rows){blocks.push(newBlock('category_row',{category_slug:c.slug,limit:4,show_anchored_banners:true}));}blocks.push(newBlock('product_rail',{source:'new',limit:8,display:'carousel',eyebrow:'NEW IN',more_href:'/shop?filter=new'}));blocks.push(newBlock('banner',{source:'placement',placement:'home_before_footer',width:'full',height:'md',limit:5}));blocks.push(newBlock('editorial',{image_mode:'auto',href:'/about'}));return normalizeBlocks(blocks,ctx);}
function deepEqual(a,b){try{return JSON.stringify(a)===JSON.stringify(b);}catch{return false;}}
export function normalizeHomeDoc(raw,ctx={}){let revision=0;let draftBlocks=[];let publishedBlocks=[];let draftMeta={updated_at:null,updated_by:null};let publishedMeta={published_at:null,published_by:null};if(Array.isArray(raw)){const nb=normalizeBlocks(raw,ctx);publishedBlocks=nb;draftBlocks=nb;}else if(raw&&typeof raw==='object'){if(raw.draft||raw.published){revision=Number.isFinite(Number(raw.revision))?Number(raw.revision):0;const d=raw.draft&&typeof raw.draft==='object'?raw.draft:{};const p=raw.published&&typeof raw.published==='object'?raw.published:{};draftBlocks=normalizeBlocks(d.blocks!==undefined?d:(d.blocks||[]),ctx);if(!draftBlocks.length&&Array.isArray(d))draftBlocks=normalizeBlocks(d,ctx);publishedBlocks=normalizeBlocks(p.blocks!==undefined?p:(p.blocks||[]),ctx);if(!publishedBlocks.length&&Array.isArray(p))publishedBlocks=normalizeBlocks(p,ctx);draftMeta={updated_at:d.updated_at||null,updated_by:d.updated_by||null};publishedMeta={published_at:p.published_at||null,published_by:p.published_by||null};}else if(Array.isArray(raw.blocks)){const nb=normalizeBlocks(raw.blocks,ctx);publishedBlocks=nb;draftBlocks=nb;revision=Number.isFinite(Number(raw.revision))?Number(raw.revision):0;}else if(Array.isArray(raw.sections)){const nb=normalizeBlocks(raw.sections,ctx);publishedBlocks=nb;draftBlocks=nb;}}if(!draftBlocks.length&&!publishedBlocks.length){draftBlocks=defaultHomeLayout(ctx);}const doc={version:HOME_LAYOUT_VERSION,revision,draft:{blocks:draftBlocks,...draftMeta},published:{blocks:publishedBlocks,...publishedMeta}};return doc;}
export function hasUnpublishedChanges(doc){if(!doc||typeof doc!=='object')return false;const d=doc.draft?.blocks;const p=doc.published?.blocks;if(!Array.isArray(d)||!Array.isArray(p))return false;if(d.length!==p.length)return true;return !deepEqual(d,p);}
export function moveBlock(blocks,fromIndex,toIndex){if(!Array.isArray(blocks))return [];const arr=blocks.slice();if(fromIndex<0||fromIndex>=arr.length)return arr;const to=Math.max(0,Math.min(arr.length-1,toIndex));const [item]=arr.splice(fromIndex,1);arr.splice(to,0,item);return arr;}
export function groupBannerRows(blocks){const out=[];let i=0;const arr=Array.isArray(blocks)?blocks:[];while(i<arr.length){const b=arr[i];if(!b||b.type!=='banner'||b.width!=='half'){out.push({kind:'full',blocks:[b],expand:false});i+=1;continue;}const group=[b];let j=i+1;while(j<arr.length&&arr[j]&&arr[j].type==='banner'&&arr[j].width==='half'&&group.length<2){group.push(arr[j]);j+=1;}out.push({kind:'half-row',blocks:group,expand:group.length===1});i=j;}return out;}
export function blockSummary(block,ctx={}){if(!block)return '';const cats=Array.isArray(ctx.categories)?ctx.categories:[];const catName=(slug)=>{const c=cats.find(x=>x.slug===slug);return c?(c.name_ko||c.name_en||slug):slug;};switch(block.type){case 'hero':return block.banner_id?'지정 배너':(block.placement||'home_hero');case 'delivery':return block.variant==='default'?'기본':'슬림';case 'product_rail':{const src=block.source==='manual'?`수동 ${(block.product_ids||[]).length}개`:block.source==='category'?`카테고리: ${catName(block.category_slug)}`:block.source==='best'?'베스트':block.source==='new'?'신상품':block.source==='sale'?'세일':'전체';return `${src} · ${block.limit}개 · ${block.display==='grid'?'그리드':'캐러셀'}`;}case 'category_tiles':return `${block.limit}개 타일`;case 'category_row':return `${catName(block.category_slug)||'미지정'} · ${block.limit}개`;case 'banner':{const src=block.source==='specific'?'지정 배너':(block.placement||'');return `${src} · ${block.width==='half'?'절반':'전체'}폭 · ${block.height}`;}case 'editorial':return block.image_mode==='auto'?'자동 이미지':'지정 이미지';default:return '';}}

export function isBlockActive(block, now = new Date()) {
  if (!block || block.enabled === false) return false;
  try {
    if (block.start_date && new Date(block.start_date) > now) return false;
    if (block.end_date && new Date(String(block.end_date) + 'T23:59:59') < now) return false;
  } catch (e) { /* ignore */ }
  return true;
}

export function validateLayout(blocks, ctx = {}) {
  const issues = [];
  const cats = Array.isArray(ctx.categories) ? ctx.categories : [];
  const slugs = new Set(cats.map(function(c){ return c.slug; }));
  const bannerIds = ctx.bannerIds instanceof Set ? ctx.bannerIds : new Set(ctx.bannerIds || []);
  const arr = Array.isArray(blocks) ? blocks : [];
  if (arr.length === 0) issues.push({ level: 'warn', blockId: null, message: '블록이 없습니다. 기본 레이아웃을 사용하세요.' });
  if (arr.length >= MAX_HOME_BLOCKS) issues.push({ level: 'warn', blockId: null, message: '블록이 ' + MAX_HOME_BLOCKS + '개 한도에 도달했습니다.' });
  const seenSlugs = new Set();
  for (const b of arr) {
    if (!b) continue;
    if (b.type === 'category_row') {
      if (!b.category_slug) issues.push({ level: 'error', blockId: b.id, message: '카테고리가 선택되지 않았습니다.' });
      else if (slugs.size && !slugs.has(b.category_slug)) issues.push({ level: 'error', blockId: b.id, message: '존재하지 않는 카테고리: ' + b.category_slug });
      else if (seenSlugs.has(b.category_slug)) issues.push({ level: 'warn', blockId: b.id, message: '같은 카테고리가 중복 사용됩니다.' });
      seenSlugs.add(b.category_slug);
      const cat = cats.find(function(c){ return c.slug === b.category_slug; });
      if (cat && (cat.product_count || 0) === 0) issues.push({ level: 'warn', blockId: b.id, message: (cat.name_ko || b.category_slug) + ' 카테고리에 상품이 없습니다.' });
    }
    if (b.type === 'product_rail' && b.source === 'category') {
      if (!b.category_slug) issues.push({ level: 'error', blockId: b.id, message: '카테고리가 선택되지 않았습니다.' });
      else if (slugs.size && !slugs.has(b.category_slug)) issues.push({ level: 'error', blockId: b.id, message: '존재하지 않는 카테고리: ' + b.category_slug });
    }
    if (b.type === 'product_rail' && b.source === 'manual' && (!b.product_ids || !b.product_ids.length)) {
      issues.push({ level: 'warn', blockId: b.id, message: '수동 선택 상품이 없습니다.' });
    }
    if (b.type === 'banner' && b.source === 'specific' && !b.banner_id) {
      issues.push({ level: 'error', blockId: b.id, message: '배너가 선택되지 않았습니다.' });
    }
    if (b.type === 'banner' && b.source === 'specific' && b.banner_id && bannerIds.size && !bannerIds.has(b.banner_id)) {
      issues.push({ level: 'error', blockId: b.id, message: '존재하지 않는 배너입니다.' });
    }
    if (b.type === 'hero' && b.banner_id && bannerIds.size && !bannerIds.has(b.banner_id)) {
      issues.push({ level: 'error', blockId: b.id, message: '존재하지 않는 히어로 배너입니다.' });
    }
    if (b.start_date && b.end_date && new Date(b.start_date) > new Date(b.end_date)) {
      issues.push({ level: 'error', blockId: b.id, message: '시작일이 종료일보다 늦습니다.' });
    }
  }
  return issues;
}

export const HOME_PRESETS = [
  { id: 'minimal', name: '미니멀', desc: '히어로 + 베스트 + 타일 + 신상 + 에디토리얼', blocks: [
    { type: 'hero' }, { type: 'delivery', variant: 'slim' },
    { type: 'product_rail', source: 'best', limit: 8, display: 'carousel', eyebrow: 'BEST SELLERS', more_href: '/shop?filter=best' },
    { type: 'category_tiles', limit: 6 },
    { type: 'product_rail', source: 'new', limit: 8, display: 'carousel', eyebrow: 'NEW IN', more_href: '/shop?filter=new' },
    { type: 'editorial', image_mode: 'auto' },
  ]},
  { id: 'sale', name: '세일 집중', desc: '세일 레일 + 프로모션 배너 중심', blocks: [
    { type: 'hero' }, { type: 'delivery', variant: 'slim' },
    { type: 'banner', source: 'placement', placement: 'home_after_best', width: 'full', height: 'lg', limit: 1 },
    { type: 'product_rail', source: 'sale', limit: 8, display: 'carousel', eyebrow: 'SALE', more_href: '/shop?filter=sale', title_ko: '세일 상품' },
    { type: 'category_tiles', limit: 6 },
    { type: 'product_rail', source: 'best', limit: 4, display: 'grid', eyebrow: 'BEST' },
    { type: 'editorial', image_mode: 'auto' },
  ]},
  { id: 'landing', name: '랜딩', desc: '히어로 + 절반 배너 2개 + 타일 + 에디토리얼', blocks: [
    { type: 'hero' },
    { type: 'banner', source: 'placement', placement: 'home_after_best', width: 'half', height: 'md', limit: 1 },
    { type: 'banner', source: 'placement', placement: 'home_before_footer', width: 'half', height: 'md', limit: 1 },
    { type: 'category_tiles', limit: 4 },
    { type: 'editorial', image_mode: 'auto' },
  ]},
];

export function applyPreset(id, ctx = {}) {
  const preset = HOME_PRESETS.find(function(p){ return p.id === id; });
  if (!preset) return null;
  if (preset.id === 'rich') return defaultHomeLayout(ctx);
  return normalizeBlocks(preset.blocks || [], ctx);
}
