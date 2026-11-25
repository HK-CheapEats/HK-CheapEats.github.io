/* ═══════════════════════════════════════════════════════════
   HK Cheap Eats · 港慳食 — app
   ═══════════════════════════════════════════════════════════ */
(function () {
'use strict';
const CFG = window.HKCE_CONFIG, DATA = window.HKCE_DATA, I18N = window.HKCE_I18N, GLOSS = window.HKCE_GLOSSARY, BE = window.BE;
const CU = DATA.cuisines, DIST = DATA.districts, AREAS = DATA.areas;

/* ═════════════ NATIVE BRIDGE (Capacitor) ═════════════ */
const CAP = window.Capacitor;
const NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
const plug = n => NATIVE ? ((CAP.Plugins && CAP.Plugins[n]) || (CAP.registerPlugin && CAP.registerPlugin(n))) : null;
if (NATIVE) document.documentElement.classList.add('native', CAP.getPlatform());
const haptic = (kind = 'light') => { const h = plug('Haptics'); if (!h) return;
  if (kind === 'success') h.notification({ type: 'SUCCESS' }).catch(() => {});
  else h.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }).catch(() => {}); };
function syncStatusBar() { const sb = plug('StatusBar'); if (!sb) return;
  sb.setStyle({ style: isDark() ? 'DARK' : 'LIGHT' }).catch(() => {});
  if (CAP.getPlatform() === 'android') sb.setBackgroundColor({ color: isDark() ? '#0D0C11' : '#F5EFE4' }).catch(() => {}); }
const shareBase = () => CFG.publicUrl || (/^https?:/.test(location.protocol) && !NATIVE ? location.href.split('#')[0] : '');

/* ═════════════ UTIL ═════════════ */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = { get(k, d) { try { const v = localStorage.getItem('hkce3_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
             set(k, v) { try { localStorage.setItem('hkce3_' + k, JSON.stringify(v)); } catch {} if (SYNC_KEYS.includes(k)) onLocalChange(k); } };
const AUTH_ON = () => CFG.signIn !== false || BE.signedIn;
const SYNC_KEYS = ['saved', 'ate', 'pts', 'shared', 'myrv', 'rvname', 'clicks', 'wk', 'chal', 'lbname', 'grpname'];
const prng = s => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const DAY = 86400000;
const TODAY0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();

const ICON = {
  bowl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M7 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M17 7c0-1.5 1-1.5 1-3"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.4 0 5.5 3.1 4.3 6.3C19.5 15.4 12 20 12 20Z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13v4H6a2 2 0 0 1-2-2Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
  dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4h11l-1.5 4L16 12H5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11M3 13v6a2 2 0 0 0 2 2h11.5a2 2 0 0 0 2-1.6l1.4-7A2 2 0 0 0 18 10h-5V5.5A2.5 2.5 0 0 0 10.5 3L7 10"/></svg>',
  bike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h5l3 8M10 9 8.5 6H6M15 9l1-3h2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13 7 4 4"/></svg>',
  apple: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.9-.8-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.6ZM14.2 5.6c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3Z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3.5v17l9-8.5-9-8.5Zm10.5 9.5L16.6 15 20 13a1.2 1.2 0 0 0 0-2l-3.4-2-2.1 2.1 2.1 2-2.1 2Z"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7a11.5 11.5 0 0 1-4.6-4.1c-.4-.6-1-1.6-1-2.8s.7-1.8.9-2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.7 0l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>'
};

/* ═════════════ STATE ═════════════ */
const LANGS = ['en', 'hant', 'hans'];
const guessLang = () => { const l = (navigator.language || '').toLowerCase(); return l.startsWith('zh') ? (/cn|sg|hans/.test(l) ? 'hans' : 'hant') : 'en'; };
const S = {
  tab: LS.get('tab', 'deals'), lang: LANGS.includes(LS.get('lang')) ? LS.get('lang') : guessLang(),
  q: '', cu: new Set(), di: new Set(), meal: 'any', max: 200, openNow: false, octopus: false, veg: false, delivery: false, dealsOnly: false,
  col: null, sort: 'value', user: null, community: [], mtr: null, noPork: false, noBeef: false, halal: false, minRating: 0, min: 0, maxKm: null, valueMin: 0, bounds: null
};
const t = (k, ...a) => { const v = I18N[S.lang][k] ?? I18N.en[k] ?? k; return typeof v === 'function' ? v(...a) : v; };
const tri = o => o ? (o[S.lang] || o.hant || o.en || '') : '';
const nm = p => tri(p.name), alt = p => S.lang === 'en' ? p.name.hant : p.name.en;
const of = p => tri(p.offer);
const areaName = k => AREAS[k] ? tri(AREAS[k]) : k;
const cun = k => CU[k] ? tri(CU[k]) : k;
const isDeal = p => p.orig != null && p.orig > p.price;
const pct = p => isDeal(p) ? Math.round((p.orig - p.price) / p.orig * 100) : 0;
const fmt = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const locale = () => ({ en: 'en-GB', hant: 'zh-HK', hans: 'zh-CN' })[S.lang];

/* ═════════════ DATA ═════════════ */
// Listed places have no end dates: only community deals carry a real expiry the poster entered.
const PLACES = DATA.places.map(p => ({ ...p, expiry: null, addedTs: new Date(p.added + 'T00:00:00+08:00').getTime() }));
function fromCommunity(r) {
  const a = AREAS[r.area] || AREAS.Central, h = hash(r.id);
  const zh = r.name_zh || r.name_en, oz = r.offer_zh || r.offer_en;
  return {
    id: (BE.online ? 'c_' : '') + r.id, user: true, mine: !!r.mine,
    name: { en: r.name_en || zh, hant: zh, hans: zh }, offer: { en: r.offer_en || oz, hant: oz, hans: oz },
    cu: CU[r.cuisine] ? r.cuisine : 'cantonese', area: AREAS[r.area] ? r.area : 'Central', d: a.d, meal: r.meal,
    price: r.price, orig: r.orig, open: 660, close: 1320, closed: -1, pay: ['c'], veg: false, delivery: !!r.delivery,
    featured: false, legend: false, chain: false, rating: null,
    lat: a.ll[0] + ((h % 100) / 100 - .5) * .006, lng: a.ll[1] + ((h % 997) / 997 - .5) * .006,
    expiry: r.expires_on ? new Date(r.expires_on + 'T23:59:00').getTime() : null, addedTs: r.created_at ? new Date(r.created_at).getTime() : Date.now()
  };
}
const all = () => [...S.community.map(fromCommunity), ...PLACES].filter(p => !p.expiry || p.expiry > Date.now());
const byId = id => all().find(p => p.id === id) || PLACES.find(p => p.id === id);

/* ═════════════ VALUE SCORE (js/value.js, docs/VALUE_SCORE.md) ═════════════ */
const VAL = window.HKCE_VALUE, MED = VAL ? VAL.medians(DATA.places) : {};
const valMemo = new Map();
function value(p) {
  if (valMemo.has(p.id)) return valMemo.get(p.id);
  const m = nearestMtr(p), v = VAL ? VAL.score(p, { median: MED, stat: BE.stat(p.id), walkMin: m && m.d < 3 ? walkMin(m.d) : null }) : null;
  valMemo.set(p.id, v); return v;
}
const vTotal = p => value(p)?.total ?? 0;
const isGem = p => !p.chain && !p.featured && (rating(p) || 0) >= 4.2 && votes(p) < 5;
const isNew = p => Date.now() - p.addedTs < 14 * DAY;
const priceBand = n => n < 30 ? 1 : n <= 50 ? 2 : n <= 80 ? 3 : n <= 100 ? 4 : 5;

/* ═════════════ SMART SEARCH ═════════════ */
const SYN = [
  ['noodle', 'noodles', '麵', '面', 'mein', 'ho fun', '河', 'mixian', '米線', '米线', 'ramen', '拉麵', '拉面', 'pho', 'e-fu', '伊麵', 'lo mein', 'vermicelli', '粉'],
  ['rice', '飯', '饭', 'claypot', '煲仔', 'bowl'],
  ['dim sum', 'dimsum', '點心', '点心', 'har gow', '蝦餃', 'siu mai', '燒賣', '烧卖', 'yum cha', '飲茶', '饮茶'],
  ['dumpling', '餃子', '饺子', 'potsticker', '鍋貼', '锅贴', 'xiaolongbao', '小籠包', '小笼包'],
  ['wonton', '雲吞', '云吞', '餛飩', '馄饨'], ['brisket', '牛腩'], ['beef', '牛'], ['pork', '豬', '猪', 'char siu', '叉燒', '叉烧'],
  ['goose', '鵝', '鹅'], ['roast', 'bbq', 'siu mei', '燒味', '烧味', 'char siu', '叉燒', '叉烧', 'roast meat'],
  ['congee', 'porridge', 'jook', '粥'], ['dessert', 'sweet', '甜品', 'tofu pudding', '豆腐花', 'sago', 'mochi', '糖水', 'pudding'],
  ['egg waffle', 'eggette', '雞蛋仔', '鸡蛋仔', 'waffle'], ['fish ball', 'fishball', '魚蛋', '鱼蛋', 'fish-ball'],
  ['milk tea', '奶茶'], ['coffee', '咖啡'], ['cha chaan teng', '茶餐廳', '茶餐厅', 'diner', 'cafe', 'café', '冰室'],
  ['curry', '咖喱'], ['vegetarian', 'vegan', 'veggie', '素', '素食'], ['street food', 'snack', '小食', 'skewer', '串'],
  ['seafood', '海鮮', '海鲜', 'prawn', '蝦', '虾', 'oyster', '蠔', '蚝', 'crab', '蟹', 'fish'], ['bakery', 'bread', 'bun', '包', '餅', '饼', 'tart', '撻', '挞'],
  ['egg tart', '蛋撻', '蛋挞'], ['breakfast', '早餐', 'morning'], ['lunch', '午餐', '午市'], ['dinner', '晚餐', '晚市'],
  ['late night', 'late-night', 'supper', '宵夜', '夜宵'], ['afternoon tea', 'tea time', '下午茶'],
  ['japanese', '日式', '日本', 'ramen', 'sushi', '壽司', '寿司'], ['thai', '泰'], ['vietnamese', '越南', 'pho'], ['taiwanese', '台灣', '台湾'],
  ['shanghainese', '上海', '滬', '沪'], ['western', '西餐', 'steak', '扒'], ['halal', '清真'], ['chinese', '中菜', 'cantonese', '粵菜', '粤菜']
];
const STOP = new Set('cheap cheapest best good great affordable budget food foods eat eats eating in at near around the a an for of with and under below less than hk hkd place places restaurant restaurants shop shops meal meals to me find some get 平 抵 好 食'.split(' '));
const AREA_EN = [...Object.keys(AREAS).map(k => k.toLowerCase()), ...Object.values(DIST).map(d => d.en.toLowerCase())];
const PHRASES = [...new Set([...SYN.flat(), ...AREA_EN].filter(w => w.includes(' ')))].sort((a, b) => b.length - a.length);
const CJK = /[㐀-鿿]/;
const CJK_VOCAB = () => [...new Set([...SYN.flat().filter(w => CJK.test(w)), ...Object.values(AREAS).flatMap(a => [a.hant, a.hans]), ...Object.values(DIST).flatMap(d => [d.hant, d.hans, d.hant.replace(/區$/, ''), d.hans.replace(/区$/, '')]), ...Object.values(CU).flatMap(c => [c.hant, c.hans])])].filter(w => w && w.length > 0).sort((a, b) => b.length - a.length);
let cjkVocab = null;
function parseQ(raw) {
  let q = ` ${raw.toLowerCase()} `, max = null;
  const m = q.match(/(?:under|below|less than|max|<)\s*(?:hk)?\$?\s*(\d{2,3})|(?:hk)?\$\s?(\d{2,3})\b|(\d{2,3})\s*(?:蚊|元|以下|以內|以内)/);
  if (m) { max = +(m[1] || m[2] || m[3]); q = q.replace(m[0], ' '); }
  q = q.replace(/near me|附近/g, ' ');
  PHRASES.forEach(ph => { q = q.split(ph).join(' ' + ph.replace(/ /g, '_') + ' '); });
  const toks = [];
  q.split(/[\s,，、。！!?？]+/).map(x => x.replace(/_/g, ' ').trim()).filter(x => x && !STOP.has(x)).forEach(tok => {
    if (!CJK.test(tok) || tok.length <= 2) return toks.push(tok);
    cjkVocab = cjkVocab || CJK_VOCAB(); let rest = tok;
    cjkVocab.forEach(w => { if (w.length >= 1 && rest.includes(w) && (w.length > 1 || toks.length === 0)) { toks.push(w); rest = rest.split(w).join(' '); } });
    rest.split(' ').filter(x => x.length >= 2).forEach(x => toks.push(x));
  });
  return { toks: [...new Set(toks)], max };
}
const hayMemo = new Map();
function hay(p) {
  if (hayMemo.has(p.id)) return hayMemo.get(p.id);
  const a = AREAS[p.area] || {}, d = DIST[p.d] || {}, c = CU[p.cu] || {};
  const meal = { breakfast: 'breakfast 早餐', lunch: 'lunch 午餐 午市', tea: 'afternoon tea 下午茶', dinner: 'dinner 晚餐 晚市', latenight: 'late night supper 宵夜 夜宵' }[p.meal] || '';
  const h = [p.name.en, p.name.hant, p.name.hans, p.offer.en, p.offer.hant, p.offer.hans, a.en, a.hant, a.hans, d.en, d.hant, d.hans, c.en, c.hant, c.hans, meal,
    p.veg ? 'vegetarian veggie 素' : '', p.halal ? 'halal 清真' : '', p.close >= 1380 ? 'late night 宵夜' : ''].join(' | ').toLowerCase();
  hayMemo.set(p.id, h); return h;
}
const synOf = tok => { const t = tok.replace(/s$/, ''); const g = SYN.filter(gr => gr.includes(tok) || gr.includes(t)); return g.length ? [...new Set([tok, t, ...g.flat()])] : [tok, t]; };
let qParsed = { raw: null };
function curQ() { if (qParsed.raw !== S.q) qParsed = { raw: S.q, ...parseQ(S.q) }; return qParsed; }
// Location words in the query: the neighbourhood they name (for "closest" fallbacks)
function qPlace(toks) {
  for (const tok of toks) {
    const k = Object.keys(AREAS).find(a => [a.toLowerCase(), AREAS[a].hant, AREAS[a].hans].includes(tok));
    if (k) return { tok, ll: AREAS[k].ll };
    const d = Object.keys(DIST).find(x => [DIST[x].en.toLowerCase(), DIST[x].hant, DIST[x].hans, DIST[x].hant.replace(/區$/, ''), DIST[x].hans.replace(/区$/, '')].includes(tok));
    if (d) { const a = Object.values(AREAS).find(v => v.d === d); if (a) return { tok, ll: a.ll }; }
  }
  return null;
}
// When nothing matches exactly: drop the place words (sort by distance to it) and/or the budget (sort by price).
function closestMatches() {
  const { toks, max } = curQ(); if (!toks.length && !max) return null;
  const where = qPlace(toks), dish = toks.filter(x => !where || x !== where.tok);
  const base = all().filter(p => dish.every(tok => synOf(tok).some(w => hay(p).includes(w))) && p.price <= S.max && (S.meal === 'any' || p.meal === S.meal));
  if (!base.length || (!where && !max)) return null;
  const list = [...base].sort((x, y) => where ? hav(where.ll[0], where.ll[1], x.lat, x.lng) - hav(where.ll[0], where.ll[1], y.lat, y.lng) : x.price - y.price);
  return { list: list.slice(0, 12), why: where && max ? 'both' : where ? 'place' : 'price' };
}
function matchQ(p) {
  const { toks } = curQ(); if (!toks.length) return true;
  const h = hay(p); return toks.every(tok => synOf(tok).some(w => h.includes(w)));
}
const effMax = () => Math.min(S.max, curQ().max || 9999);
function suggestions(q) {
  q = q.trim().toLowerCase(); const out = [];
  if (!q) return LS.get('qhist', []).slice(0, 6).map(x => ({ k: 'hist', label: x, q: x }));
  const a = all();
  a.filter(p => [p.name.en, p.name.hant, p.name.hans].some(n => n.toLowerCase().includes(q))).slice(0, 4).forEach(p => out.push({ k: 'place', label: nm(p), sub: `${areaName(p.area)} · HK$${p.price}`, id: p.id }));
  Object.keys(AREAS).filter(k => [k, AREAS[k].hant, AREAS[k].hans].some(n => n.toLowerCase().includes(q))).slice(0, 3).forEach(k => out.push({ k: 'area', label: areaName(k), sub: tri(DIST[AREAS[k].d]), q: areaName(k) }));
  Object.keys(CU).filter(k => [CU[k].en, CU[k].hant, CU[k].hans].some(n => n.toLowerCase().includes(q))).slice(0, 2).forEach(k => out.push({ k: 'cu', label: cun(k), q: cun(k) }));
  if (!out.length && curQ().toks.length) out.push({ k: 'q', label: raw => raw, q });
  return out.slice(0, 7);
}
function pushHist(q) { q = (q || '').trim(); if (q.length < 2) return; const h = LS.get('qhist', []).filter(x => x !== q); h.unshift(q); LS.set('qhist', h.slice(0, 8)); }

/* ═════════════ MTR + DIETARY ═════════════ */
const MTR = window.HKCE_MTR || [];
const stName = i => S.lang === 'en' ? MTR[i][0] : S.lang === 'hans' ? (MTR[i][5] || MTR[i][1]) : MTR[i][1];
const mtrCache = new Map();
function nearestMtr(p) {
  if (!p.lat || !MTR.length) return null;
  if (mtrCache.has(p.id)) return mtrCache.get(p.id);
  let best = null; MTR.forEach((st, i) => { const d = hav(p.lat, p.lng, st[2], st[3]); if (!best || d < best.d) best = { i, d }; });
  mtrCache.set(p.id, best); return best;
}
const mtrDist = (p, i) => p.lat ? hav(p.lat, p.lng, MTR[i][2], MTR[i][3]) : 99;
const walkMin = km => Math.max(1, Math.round(km * 1.3 / 4.8 * 60));
const dtext = p => `${p.name.en} ${p.offer.en}`;
const PORK = /pork|char siu|\bham\b|sausage|siu mai|bacon|spare-rib|intestine|liver|wonton|dumpling|potsticker|xiaolongbao|chashu|tonkotsu|ramen|siu mei|roast meat|bbq|luncheon|cart noodle/i;
const BEEF = /beef|brisket|steak|sirloin|\bpho\b|gyudon|goulash/i;
const placeUrl = p => { const b = shareBase(); if (!b) return ''; return p.slug ? `${b}r/${p.slug}.html` : `${b}#deal/${p.id}`; };

/* ═════════════ LOCAL STATE ═════════════ */
const saved = () => LS.get('saved', []);
const isSaved = id => saved().includes(id);
const diary = () => LS.get('ate', []);
const points = () => LS.get('pts', 0);
const myReviews = () => LS.get('myrv', { n: 0, photos: 0 });
const addPts = n => { const b = levelOf(points()); LS.set('pts', points() + n); const w = LS.get('wk', {}), wk = weekKey(); LS.set('wk', { k: wk, p: (w.k === wk ? w.p : 0) + n }); const a = levelOf(points()); if (a.i > b.i) setTimeout(() => toast(t('tLvl', a.name)), 900); };

/* ═════════════ RATINGS & TIME ═════════════ */
const rating = p => { const s = BE.stat(p.id); return s.reviews ? s.avg : p.rating; };
const reviewCount = p => BE.stat(p.id).reviews;
const votes = p => BE.stat(p.id).votes;
function hkNow() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Hong_Kong', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
  const g = k => parts.find(x => x.type === k).value; let h = +g('hour'); if (h === 24) h = 0;
  return { wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), m: h * 60 + +g('minute') };
}
function openState(p) {
  const { wd, m } = hkNow(), pw = (wd + 6) % 7;
  if (p.closed !== wd && m >= p.open && m < p.close) return { open: true, until: p.close };
  if (p.close > 1440 && p.closed !== pw && m < p.close - 1440) return { open: true, until: p.close - 1440 };
  if (p.closed === wd) return { open: false, closedToday: true };
  return { open: false, next: m < p.open ? p.open : null };
}
function endsIn(p) {
  if (!p.expiry) return null; const ms = p.expiry - Date.now(); if (ms <= 0 || ms > 3 * DAY) return null;
  return t('left', Math.floor(ms / DAY), Math.max(1, Math.floor(ms % DAY / 3600000)));
}
const hav = (a, b, c, d) => { const R = 6371, x = (c - a) * Math.PI / 180, y = (d - b) * Math.PI / 180, h = Math.sin(x / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(y / 2) ** 2; return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); };
const distOf = p => S.user && p.lat ? hav(S.user[0], S.user[1], p.lat, p.lng) : null;
const fmtDist = k => k == null ? '' : k < 1 ? Math.round(k * 1000) + ' m' : k.toFixed(1) + ' km';

/* ═════════════ COLLECTIONS ═════════════ */
const COLS = [
  { k: 'u40', g: '平', c1: '#A82A1B', c2: '#F0954A', test: p => p.price <= 40 },
  { k: 'late', g: '夜', c1: '#2A2350', c2: '#8E7CF0', test: p => p.close >= 1380 || p.meal === 'latenight' },
  { k: 'legend', g: '老', c1: '#5A2A1E', c2: '#D9A25A', test: p => p.legend },
  { k: 'veg', g: '素', c1: '#3E6E2C', c2: '#BFE29D', test: p => p.veg },
  { k: 'breakfast', g: '早', c1: '#B46F00', c2: '#F7D774', test: p => p.open <= 420 || p.meal === 'breakfast' },
  { k: 'everyday', g: '抵', c1: '#0F6A4E', c2: '#7FCB9E', test: p => !isDeal(p) }
];

/* ═════════════ FILTER + SORT ═════════════ */
function filtered() {
  const col = COLS.find(c => c.k === S.col);
  return all().filter(p => (!S.cu.size || S.cu.has(p.cu)) && (!S.di.size || S.di.has(p.d)) && (S.meal === 'any' || p.meal === S.meal) && p.price <= effMax() && p.price >= S.min
    && (!S.openNow || openState(p).open) && (!S.octopus || p.pay.includes('o')) && (!S.veg || p.veg) && (!S.delivery || p.delivery)
    && (!S.dealsOnly || isDeal(p)) && (!col || col.test(p)) && matchQ(p)
    && (S.mtr == null || mtrDist(p, S.mtr) <= .8) && (!S.noPork || !PORK.test(dtext(p))) && (!S.noBeef || !BEEF.test(dtext(p))) && (!S.halal || p.halal)
    && (!S.minRating || (rating(p) || 0) >= S.minRating) && (!S.valueMin || vTotal(p) >= S.valueMin)
    && (S.maxKm == null || (S.user && distOf(p) != null && distOf(p) <= S.maxKm)) && (!S.bounds || (p.lat && S.bounds.contains([p.lat, p.lng]))));
}
const score = p => vTotal(p) + Math.log(votes(p) + reviewCount(p) + 1) * 2;
function sorted(arr) {
  const s = S.sort, a = [...arr];
  if (s === 'value') a.sort((x, y) => score(y) - score(x));
  if (s === 'disc') a.sort((x, y) => pct(y) - pct(x));
  if (s === 'price') a.sort((x, y) => x.price - y.price);
  if (s === 'priceDesc') a.sort((x, y) => y.price - x.price);
  if (s === 'recent') a.sort((x, y) => y.addedTs - x.addedTs || score(y) - score(x));
  if (s === 'rating') a.sort((x, y) => (rating(y) || 0) - (rating(x) || 0));
  if (s === 'reviews') a.sort((x, y) => reviewCount(y) - reviewCount(x) || score(y) - score(x));
  if (s === 'near' && S.user) a.sort((x, y) => (distOf(x) ?? 99) - (distOf(y) ?? 99));
  if (s === 'near' && !S.user && S.mtr != null) a.sort((x, y) => mtrDist(x, S.mtr) - mtrDist(y, S.mtr));
  return a;
}
const activeFilterCount = () => S.di.size + (S.meal !== 'any') + (S.max < 200) + S.openNow + S.octopus + S.veg + S.delivery + S.dealsOnly + (S.mtr != null) + S.noPork + S.noBeef + S.halal + (S.minRating > 0) + (S.min > 0) + (S.maxKm != null) + (S.valueMin > 0);

/* ═════════════ SHELL ═════════════ */
const TABS = [['deals', 'bowl', 'tDeals'], ['map', 'map', 'tMap'], ['saved', 'heart', 'tSaved'], ['guide', 'book', 'tGuide'], ['me', 'user', 'tMe']];
function renderShell() {
  document.documentElement.lang = { en: 'en', hant: 'zh-HK', hans: 'zh-CN' }[S.lang];
  const sc = saved().length, dot = k => k === 'saved' && sc ? `<span class="dot">${sc}</span>` : '';
  $('#tabs').innerHTML = TABS.map(([k, i, l]) => `<button class="${S.tab === k ? 'on' : ''}" data-go="${k}" aria-label="${t(l)}">${ICON[i]}<span class="lbl">${t(l)}</span>${dot(k)}</button>`).join('');
  const b = ([k, i, l]) => `<button class="${S.tab === k ? 'on' : ''}" data-go="${k}">${ICON[i]}<span>${t(l)}</span>${dot(k)}</button>`;
  $('#botnav').innerHTML = b(TABS[0]) + `<button data-act="searchNav">${ICON.search}<span>${t('navSearch')}</span></button>` + [TABS[1], TABS[2], TABS[4]].map(b).join('');
  document.querySelectorAll('#lang button').forEach(x => x.classList.toggle('on', x.dataset.l === S.lang));
  $('#q').placeholder = t('searchPh');
  $('#share-btn').innerHTML = `${ICON.plus}<span>${t('shareDeal')}</span>`;
  $('#theme-btn').innerHTML = isDark() ? ICON.sun : ICON.moon;
  const ab = $('#auth-btn');
  if (ab) ab.hidden = !AUTH_ON();
  if (ab && AUTH_ON()) { const on = BE.signedIn; ab.classList.toggle('in', on); ab.innerHTML = on ? `<span class="av">${esc((BE.email || '?').charAt(0).toUpperCase())}</span>` : `${ICON.user}<span>${t('signIn')}</span>`; ab.setAttribute('aria-label', on ? t('account') : t('signIn')); }
}

/* ═════════════ DISCOVER ═════════════ */
function renderDeals() {
  const f = filtered(), a = all(), openCount = a.filter(p => openState(p).open).length, dCount = new Set(a.map(p => p.d)).size;
  $('#kicker').innerHTML = t('kicker', a.length, openCount, dCount);
  $('#hero-h').innerHTML = t('heroH') + `<span class="zh">${t('heroZh')}</span>`;
  $('#hero-p').textContent = t('heroP');
  $('#hq').placeholder = t('searchPh'); if (document.activeElement !== $('#hq')) $('#hq').value = S.q;
  $('#spin-btn').innerHTML = `${ICON.dice}${t('surprise')}`;
  $('#near-btn').innerHTML = `${ICON.pin}${S.user ? t('nearOn') : t('near')}`;
  $('#near-btn').classList.toggle('on', !!S.user);
  const Q = [['u30', S.max === 30], ['u50', S.max === 50], ['u80', S.max === 80], ['u100', S.max === 100], ['open', S.openNow], ['near', !!S.user], ['top', S.minRating >= 4.3], ['best', S.valueMin >= 65], ['mtr', S.mtr != null]];
  $('#quick').innerHTML = Q.map(([k, on]) => `<button class="qchip ${on ? 'on' : ''}" data-quick="${k}">${k === 'mtr' && on ? esc(t('mtrChip', stName(S.mtr))) : t('q_' + k)}</button>`).join('');
  const deals = a.filter(isDeal), top = [...deals].sort((x, y) => score(y) - score(x))[0];
  $('#spotlight').innerHTML = top ? spotlight(top) : '';
  // ticker
  const tk = [...deals].sort((x, y) => pct(y) - pct(x)).slice(0, 14);
  const tkHtml = tk.map(p => { const c = CU[p.cu]; return `<span class="tk" data-open="${p.id}" style="--c1:${c.c1};--c2:${c.c2}"><span class="g">${c.g}</span>${esc(nm(p))}<b>$${p.price}</b><span class="d">−${pct(p)}%</span></span>`; }).join('');
  $('#ticker').innerHTML = `<div class="ticker-in">${tkHtml}${tkHtml}</div>`;
  // collections
  $('#cols-h').innerHTML = `<div><h2>${t('catT')}</h2><p>${t('catS')}</p></div>`;
  const cuAll = {}; a.forEach(p => (cuAll[p.cu] = cuAll[p.cu] || []).push(p));
  $('#cols').innerHTML = Object.keys(CU).filter(k => cuAll[k]).sort((x, y) => cuAll[y].length - cuAll[x].length).map(k => { const best = [...cuAll[k]].sort((x, y) => vTotal(y) - vTotal(x)).find(x => coverSrc(x.id)), c = CU[k];
    return `<button class="cat ${S.cu.has(k) && S.cu.size === 1 ? 'on' : ''}" data-cat="${k}" style="--c1:${c.c1};--c2:${c.c2}">${best ? `<img src="${esc(coverSrc(best.id))}" alt="" loading="lazy">` : ''}<span class="cat-g">${c.g}</span><b>${esc(cun(k))}</b><small>${t('placesN', cuAll[k].length)} · ${t('from')} HK$${Math.min(...cuAll[k].map(p => p.price))}</small></button>`; }).join('');
  renderRails(a);
  $('#promo').innerHTML = `<span class="pg">茶</span><div><b>${t('guideCta')}</b><span>${t('guideCtaP')}</span></div><span class="btn">${t('guideGo')}${ICON.arrow}</span>`;
  // rail
  const cuCount = {}; a.forEach(p => cuCount[p.cu] = (cuCount[p.cu] || 0) + 1);
  $('#rail').innerHTML = `<button class="cchip all ${S.cu.size ? '' : 'on'}" data-cu="">${t('all')}</button>` +
    Object.keys(CU).filter(k => cuCount[k]).map(k => `<button class="cchip ${S.cu.has(k) ? 'on' : ''}" style="--c1:${CU[k].c1};--c2:${CU[k].c2}" data-cu="${k}"><span class="g">${CU[k].g}</span>${cun(k)}</button>`).join('');
  const fc = activeFilterCount();
  $('#filter-btn').innerHTML = `${ICON.sliders}<span>${t('filters')}</span><i class="badge ${fc ? 'on' : ''}">${fc}</i>`;
  const sorts = ['value', 'price', 'priceDesc', 'rating', 'reviews', 'recent', 'disc'].concat(S.user || S.mtr != null ? ['near'] : []);
  $('#sort').innerHTML = sorts.map(s => `<option value="${s}" ${S.sort === s ? 'selected' : ''}>${t('sort_' + s)}</option>`).join('');
  // active chips
  const chips = [];
  if (S.col) chips.push([t('col_' + S.col)[0], 'col']);
  S.cu.forEach(k => chips.push([cun(k), 'cu:' + k]));
  S.di.forEach(k => chips.push([tri(DIST[k]), 'di:' + k]));
  if (S.meal !== 'any') chips.push([t('meal_' + S.meal), 'meal']);
  if (S.max < 200) chips.push([`≤ HK$${S.max}`, 'max']);
  if (S.min > 0) chips.push([`≥ HK$${S.min}`, 'min']);
  if (curQ().max) chips.push([`≤ HK$${curQ().max}`, 'q']);
  if (S.minRating) chips.push([`★ ${S.minRating}+`, 'minRating']);
  if (S.valueMin) chips.push([t('q_best'), 'valueMin']);
  if (S.maxKm != null) chips.push([`≤ ${fmtDist(S.maxKm)}`, 'maxKm']);
  if (S.bounds) chips.push([t('mapArea'), 'bounds']);
  if (S.openNow) chips.push([t('q_open'), 'openNow']);
  if (S.octopus) chips.push([t('pay_o'), 'octopus']);
  if (S.veg) chips.push([t('veg'), 'veg']);
  if (S.delivery) chips.push([t('delivery'), 'delivery']);
  if (S.dealsOnly) chips.push([t('fDealsOnly'), 'dealsOnly']);
  if (S.mtr != null) chips.push([t('mtrChip', stName(S.mtr)), 'mtr']);
  if (S.noPork) chips.push([t('noPork'), 'noPork']);
  if (S.noBeef) chips.push([t('noBeef'), 'noBeef']);
  if (S.halal) chips.push([t('halal'), 'halal']);
  if (S.q) chips.push([`“${esc(S.q.slice(0, 20))}”`, 'q']);
  $('#active-row').innerHTML = `<span class="count">${t('results', f.length)}</span>` + chips.map(([l, k]) => `<span class="fchip">${esc(l)}<button data-unchip="${esc(k)}" aria-label="Remove">${ICON.x}</button></span>`).join('') + (chips.length > 1 ? `<button class="clear-all" data-act="reset">${t('clear')}</button>` : '');
  const s = sorted(f);
  const cm = !s.length ? closestMatches() : null;
  $('#grid').innerHTML = s.length ? s.map(card).join('') : cm ? `<div class="near-miss">${t('nearMiss_' + cm.why)}</div>` + cm.list.map(card).join('') : emptyState();
  renderFooter();
}
const RAILS = [
  ['u50', a => a.filter(p => p.price <= 50).sort((x, y) => vTotal(y) - vTotal(x)), () => { S.max = 50; S.sort = 'value'; }],
  ['gems', a => a.filter(isGem).sort((x, y) => (rating(y) || 0) - (rating(x) || 0) || vTotal(y) - vTotal(x)), () => { S.sort = 'rating'; S.minRating = 4.2; }],
  ['value', a => [...a].sort((x, y) => vTotal(y) - vTotal(x)), () => { S.sort = 'value'; S.valueMin = 65; }],
  ['lunch', a => a.filter(p => p.meal === 'lunch').sort((x, y) => vTotal(y) - vTotal(x)), () => { S.meal = 'lunch'; S.sort = 'value'; }],
  ['late', a => a.filter(p => p.close >= 1380 || p.meal === 'latenight').sort((x, y) => vTotal(y) - vTotal(x)), () => { S.meal = 'latenight'; }],
  ['recent', a => a.filter(isNew).sort((x, y) => y.addedTs - x.addedTs || vTotal(y) - vTotal(x)), () => { S.sort = 'recent'; }],
  ['near', a => S.user ? a.filter(p => distOf(p) != null && distOf(p) <= 2).sort((x, y) => distOf(x) - distOf(y)) : [], () => { S.sort = 'near'; S.maxKm = 2; }]
];
function renderRails(a) {
  const box = $('#rails'); if (!box) return;
  const busy = S.q || activeFilterCount() || S.cu.size || S.col;
  box.hidden = !!busy; if (busy) return;
  const rails = RAILS.map(([k, fn]) => [k, fn(a).slice(0, 12)]).filter(([, l]) => l.length >= 3);
  const near = rails.find(r => r[0] === 'near');
  const order = near ? [near, ...rails.filter(r => r !== near)] : rails;
  box.innerHTML = order.slice(0, 3).map(railHtml).join('') + mapPreviewHtml() + order.slice(3).map(railHtml).join('');
  initMapPreview();
}
function railHtml([k, list]) {
  return `<section class="rail-sec"><div class="sec-h"><div><h2>${t('rail_' + k)[0]}</h2><p>${t('rail_' + k)[1]}</p></div><button class="btn btn-ghost" data-rail="${k}">${t('seeAll')}${ICON.arrow}</button></div>
    <div class="rail-row">${list.map(p => { const c = CU[p.cu] || CU.cantonese, v = value(p); return `<button class="rcard" data-open="${esc(p.id)}" style="--c1:${c.c1};--c2:${c.c2}">
      <span class="rc-img">${coverSrc(p.id) ? `<img src="${esc(coverSrc(p.id))}" alt="" loading="lazy">` : `<i>${c.g}</i>`}<em class="rc-price">HK$${p.price}</em></span>
      <b>${esc(nm(p))}</b><small>${esc(areaName(p.area))} · ${esc(cun(p.cu))}${k === 'near' && distOf(p) != null ? ' · ' + fmtDist(distOf(p)) : ''}${k === 'recent' ? ' · ' + t('addedOn', new Date(p.addedTs).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })) : ''}</small>
      ${v ? `<span class="vchip v-${v.label}">${t('valueShort')} ${v.total}</span>` : ''}</button>`; }).join('')}</div></section>`;
}
function mapPreviewHtml() {
  return `<section class="map-prev"><div class="mp-copy"><div class="spot-k">${t('mapPrevK')}</div><h2>${t('mapPrevT')}</h2><p>${t('mapPrevP')}</p>
    <div class="row"><button class="btn btn-ink" data-go="map">${ICON.map}${t('mapPrevGo')}</button><button class="btn btn-red" data-act="finder">${ICON.clock}${t('finderBtn')}</button></div>
    <div class="legend">${[1, 2, 3, 4, 5].map(b => `<span><i class="pb${b}"></i>${t('band' + b)}</span>`).join('')}</div></div><div id="map-prev" aria-label="${t('mapPrevT')}"></div></section>`;
}
let prevMap = null;
function initMapPreview() {
  const el = $('#map-prev'); if (!el || typeof L === 'undefined') return;
  if (prevMap) { prevMap.remove(); prevMap = null; }
  const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect();
    prevMap = L.map(el, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false, attributionControl: false }).setView([22.33, 114.17], 11);
    const k = isDark() ? 'Dark' : 'Light', base = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_' + k + '_Gray_';
    L.tileLayer(base + 'Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16 }).addTo(prevMap);
    all().filter(p => p.lat).forEach(p => L.circleMarker([p.lat, p.lng], { radius: 4, weight: 1, color: '#fff', fillOpacity: .95, className: 'cm pb' + priceBand(p.price) }).addTo(prevMap));
    prevMap.on('click', () => go('map'));
  });
  io.observe(el);
}
function statusPill(p, cls = 'pill') {
  const o = openState(p);
  if (o.open) return `<span class="${cls} open"><i></i>${t('open')} · ${t('until', fmt(o.until))}</span>`;
  return `<span class="${cls} closed"><i></i>${t('closed')}${o.closedToday ? ' · ' + t('closedToday') : o.next != null ? ' · ' + t('opens', fmt(o.next)) : ''}</span>`;
}
function sealHtml(p, extra = '') {
  return isDeal(p) ? `<div class="seal ${extra}" aria-label="${pct(p)}% ${t('off')}"><b>${pct(p)}%</b><small>${t('off')}</small></div>`
                   : `<div class="seal every ${extra}" aria-label="${t('everyday')}"><b>平</b><small>${t('everyday')}</small></div>`;
}
function priceHtml(p, size = '') {
  return isDeal(p) ? `<div class="price" title="${t('priceDealT')}"><span class="now ser" ${size}><sup>HK$</sup>${p.price}</span><s>HK$${p.orig}</s><span class="typ">${t('priceDeal')}</span></div>`
                   : `<div class="price" title="${t('priceTypT')}"><span class="now ser" ${size}><span class="tilde">~</span><sup>HK$</sup>${p.price}</span><span class="typ">${t('priceTyp')}</span></div>`;
}
const vchip = p => { const v = value(p); return v ? `<span class="vchip v-${v.label}" title="${t('valueT')}: ${t('vl_' + v.label)}">${t('valueShort')} ${v.total}</span>` : ''; };
function ratingHtml(p) {
  const r = rating(p), n = reviewCount(p);
  if (!r) return `<span class="newtag">${t('new')}</span>`;
  return `<span class="star">★ ${(+r).toFixed(1)}</span><span class="rv-ct">${n ? `(${n})` : t('editorsShort')}</span>`;
}
// Illustrated cover (www/img/covers, made by scripts/make-covers.mjs). Community deals fall back to the glyph.
const coverSrc = id => BE.cover(id) || (/^p\d+$/.test(id || '') ? `img/covers/${id}.webp` : null);
const coverArt = (p, c) => coverSrc(p.id) ? `<img class="cv-img${BE.cover(p.id) ? ' photo' : ''}" src="${esc(coverSrc(p.id))}" alt="${BE.cover(p.id) ? esc(t('photoBy')) : ''}" loading="lazy" decoding="async" onerror="this.remove()"><i class="cv-grain"></i>${BE.cover(p.id) ? `<span class="cv-photo">${ICON.camera}</span>` : ''}` : `<span class="glyph" aria-hidden="true">${c.g}</span>`;
const tileArt = (id, c) => coverSrc(id) ? `<div class="tile img" style="background-image:url('${esc(coverSrc(id))}')"></div>` : `<div class="tile">${c.g}</div>`;
function card(p, i) {
  const c = CU[p.cu] || CU.cantonese, sv = isSaved(p.id), el = endsIn(p), dist = distOf(p);
  const tags = [];
  if (p.featured) tags.push(`<span class="cv-tag feat">★ ${t('featured')}</span>`);
  if (el) tags.push(`<span class="cv-tag hot">${ICON.clock}${el}</span>`);
  else if (p.user) tags.push(`<span class="cv-tag">${t('user')}</span>`);
  const bd = badges(p); bd.slice(0, 3 - tags.length).forEach(b => tags.push(`<span class="cv-tag b-${b}">${t('bd_' + b)}</span>`));
  return `<article class="card" style="--c1:${c.c1};--c2:${c.c2};--i:${Math.min(i, 12)}" data-open="${esc(p.id)}" tabindex="0" aria-label="${esc(nm(p))}">
  <div class="cover"><span class="cv-lbl">${c.g} · ${esc(cun(p.cu))}</span>${coverArt(p, c)}<div class="cv-tags">${tags.join('')}</div></div>
  <button class="heart ${sv ? 'on' : ''}" data-save="${esc(p.id)}" aria-label="${t('save')}" aria-pressed="${sv}">${ICON.heart}</button>
  ${sealHtml(p)}
  <div class="cbody">
    <h3 class="cname">${esc(nm(p))}</h3>
    <div class="csub">${esc(alt(p))} · ${esc(areaName(p.area))}${dist != null ? ' · ' + fmtDist(dist) : ''}</div>
    <p class="coffer">${esc(of(p))}</p>
    <div class="ctags">${statusPill(p)}${mtrPill(p)}${p.pay.includes('o') ? `<span class="pill">${t('pay_o')}</span>` : ''}${p.veg ? `<span class="pill">${t('veg')}</span>` : ''}${p.halal ? `<span class="pill">${t('halal')}</span>` : ''}</div>
    <div class="cfoot">${priceHtml(p)}<div class="cmeta">${vchip(p)}${ratingHtml(p)}</div></div>
  </div></article>`;
}
function badges(p) {
  const v = vTotal(p), out = [];
  if (v >= 80) out.push('value'); if (p.price <= 35) out.push('budget'); if (isGem(p)) out.push('gem');
  if (votes(p) + reviewCount(p) >= 5) out.push('popular'); if (p.legend) out.push('legend'); if (isNew(p)) out.push('new');
  return out;
}
function mtrPill(p) {
  const m = S.mtr != null ? { i: S.mtr, d: mtrDist(p, S.mtr) } : nearestMtr(p);
  if (!m || m.d > 1.2) return '';
  return `<span class="pill mtr"><i style="background:${MTR[m.i][4]}"></i>${esc(stName(m.i))} · ${walkMin(m.d)}′</span>`;
}
function spotlight(p) {
  const c = CU[p.cu];
  return `<div class="spot" style="--c1:${c.c1};--c2:${c.c2}" data-open="${p.id}">
    <div class="cover"><span class="cv-lbl">${c.g} · ${esc(cun(p.cu))}</span>${coverArt(p, c)}<div class="cv-tags">${statusPill(p, 'cv-tag')}</div></div>
    <button class="heart ${isSaved(p.id) ? 'on' : ''}" data-save="${p.id}" aria-label="${t('save')}">${ICON.heart}</button>
    ${sealHtml(p)}
    <div class="spot-b"><div class="spot-k">${t('spotK')}</div><div class="spot-n">${esc(nm(p))}</div><div class="spot-o">${esc(of(p))} · ${esc(areaName(p.area))}</div>
    <div class="spot-f">${priceHtml(p, 'style="font-size:40px"')}<span class="btn btn-ink">${t('view')}${ICON.arrow}</span></div></div></div>`;
}
const emptyState = () => `<div class="empty"><div class="empty-g">冇</div><h3>${t('emptyT')}</h3><p>${t('emptyP')}</p><div class="row"><button class="btn btn-ghost" data-act="reset">${t('reset')}</button><button class="btn btn-red" data-act="spin">${ICON.dice}${t('surprise')}</button></div></div>`;
function renderFooter() {
  $('#foot').innerHTML = `<div><h4>${t('footA')}</h4><p>${t('footAP')}</p><div class="stores"><span class="store-b">${ICON.apple}<span>App Store<b>${S.lang === 'en' ? 'Coming soon' : S.lang === 'hant' ? '即將推出' : '即将推出'}</b></span></span><span class="store-b">${ICON.play}<span>Google Play<b>${S.lang === 'en' ? 'Coming soon' : S.lang === 'hant' ? '即將推出' : '即将推出'}</b></span></span>${NATIVE || installed() ? '' : `<button class="store-b web" data-act="install">${ICON.plus}<span>${t('webApp')}<b>${t('webAppB')}</b></span></button>`}</div></div>
  <div><h4>${t('footB')}</h4><p>${t('footBP')}</p></div><div><h4>${t('footC')}</h4><p>${t('footCP')}</p></div>
  <div class="foot-bottom"><span>© ${new Date().getFullYear()} HK Cheap Eats · 港慳食</span><span class="fl"><a href="c/">${S.lang === "en" ? "Food guides" : S.lang === "hant" ? "食經" : "食经"}</a> · <a href="d/">${S.lang === "en" ? "All districts" : S.lang === "hant" ? "十八區" : "十八区"}</a> · <a href="privacy.html">${t("privacy")}</a></span></div>`;
}

/* ═════════════ MAP ═════════════ */
let map = null, cluster = null, tiles = null, markers = {}, meMarker = null, mapFitted = false;
const isDark = () => { const th = document.documentElement.dataset.theme; return th ? th === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function ensureMap() {
  if (typeof L === 'undefined') { $('#map').innerHTML = '<p class="muted" style="padding:20px">Map unavailable.</p>'; return; }
  if (!map) {
    map = L.map('map', { zoomControl: false, maxZoom: 19, minZoom: 9 }).setView([22.35, 114.12], 11);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    cluster = L.markerClusterGroup({ maxClusterRadius: 42, showCoverageOnHover: false, iconCreateFunction: c => L.divIcon({ html: `<div class="clu">${c.getChildCount()}</div>`, className: '', iconSize: [42, 42] }) });
    map.addLayer(cluster); setTiles();
  }
  setTimeout(() => map.invalidateSize(), 60);
}
function setTiles() {
  if (!map) return; if (tiles) map.removeLayer(tiles);
  const k = isDark() ? 'Dark' : 'Light', base = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_' + k + '_Gray_';
  const o = { maxZoom: 19, maxNativeZoom: 16, attribution: 'Tiles © Esri' };
  tiles = L.layerGroup([L.tileLayer(base + 'Base/MapServer/tile/{z}/{y}/{x}', o), L.tileLayer(base + 'Reference/MapServer/tile/{z}/{y}/{x}', o)]).addTo(map);
}
function renderMap() {
  const f = sorted(filtered());
  $('#map-t').textContent = t('mapT'); $('#map-s').textContent = t('mapS', f.length);
  $('#map-tools').innerHTML = `<div class="f-chips">${[[200, t('any')], [30, '< $30'], [50, '≤ $50'], [80, '≤ $80'], [100, '≤ $100']].map(([v, l]) => `<button class="f-chip ${S.max === v ? 'on' : ''}" data-mapmax="${v}">${l}</button>`).join('')}</div>
    <div class="row"><button class="btn btn-ghost ${S.bounds ? 'on' : ''}" data-act="areaSearch">${ICON.search}${S.bounds ? t('mapAreaOff') : t('mapArea')}</button><button class="btn btn-red" data-act="finder">${ICON.clock}${t('finderBtn')}</button></div>
    <div class="legend">${[1, 2, 3, 4, 5].map(b => `<span><i class="pb${b}"></i>${t('band' + b)}</span>`).join('')}</div>`;
  $('#maplist').innerHTML = f.map(p => { const c = CU[p.cu]; return `<div class="mrow" data-pin="${esc(p.id)}" style="--c1:${c.c1};--c2:${c.c2}">
    ${tileArt(p.id, c)}<div class="mi"><div class="mn">${esc(nm(p))}</div><div class="ms">${esc(areaName(p.area))} · ${openState(p).open ? `<span style="color:var(--jade)">● ${t('open')}</span>` : t('closed')}</div></div>
    <div class="mp">${isDeal(p) ? '' : '~'}$${p.price}<small>${isDeal(p) ? '−' + pct(p) + '%' : t('everyday')}</small></div></div>`; }).join('') || `<p class="muted" style="padding:16px">${t('emptyT')}</p>`;
  ensureMap(); if (!map) return;
  cluster.clearLayers(); markers = {};
  f.forEach(p => { if (!p.lat) return; const c = CU[p.cu];
    const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="ppin pb${priceBand(p.price)}"><b>$${p.price}</b></div>`, iconSize: [46, 28], iconAnchor: [23, 30] }), title: `${nm(p)} · HK$${p.price}`, alt: `${nm(p)}, HK$${p.price}` });
    m.on('click', () => openDeal(p.id)); markers[p.id] = m; cluster.addLayer(m); });
  if (f.length && !mapFitted) { map.fitBounds(L.latLngBounds(f.filter(p => p.lat).map(p => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 14 }); mapFitted = true; }
}
function focusPin(id) { const m = markers[id]; if (!m || !map) return openDeal(id); cluster.zoomToShowLayer(m, () => { map.panTo(m.getLatLng()); setTimeout(() => openDeal(id), 250); }); }

/* ═════════════ SAVED ═════════════ */
function renderSaved() {
  const list = saved().map(byId).filter(Boolean);
  $('#saved-in').innerHTML = `<div class="page-h"><div><h1>${t('savedT')}</h1><p>${t('savedP', list.length)}</p></div><div class="grp-cta"><button class="btn btn-red" data-act="newGroup">${ICON.user}${t('grpNew')}</button><small>${list.length >= 2 ? t('grpFrom', Math.min(8, list.length)) : t('grpFromTop')}</small></div></div>` +
    (list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty"><div class="empty-g">♡</div><h3>${t('savedEmptyT')}</h3><p>${t('savedEmptyP')}</p><div class="row"><button class="btn btn-ink" data-go="deals">${t('browse')}${ICON.arrow}</button></div></div>`);
}

/* ═════════════ GUIDE ═════════════ */
let glTab = 'drinks';
function renderGuide() {
  const cats = [['drinks', 'g_drinks'], ['order', 'g_order'], ['food', 'g_food'], ['manners', 'g_manners']];
  const items = GLOSS[glTab] || [];
  $('#guide-in').innerHTML = `<div class="page-h"><div><h1>${t('guideT')}</h1><p>${t('guideP')}</p></div></div>
    <div class="gl-tabs">${cats.map(([k, l]) => `<button class="f-chip ${glTab === k ? 'on' : ''}" data-gl="${k}">${t(l)}</button>`).join('')}<span class="muted" style="align-self:center;padding:0 6px">${t('guideTip')}</span></div>
    <div class="gl-grid">${items.map(([hant, hans, jp, en, mHant, mHans], i) => `<div class="gl" style="--i:${i}">
      <div><div class="gl-w">${S.lang === 'hans' ? hans : hant}</div><div class="gl-j">${jp}</div></div>
      <div class="gl-m"><b>${S.lang === 'en' ? esc(en) : S.lang === 'hant' ? mHant : mHans}</b>${S.lang === 'en' ? '' : `<span>${esc(en)}</span>`}</div>
      <button class="say" data-say="${esc(hant)}" aria-label="Play">▶</button></div>`).join('')}</div>`;
}
function say(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/\s*\/\s*/g, '，'));
  u.lang = 'zh-HK'; u.rate = .85;
  const v = speechSynthesis.getVoices().find(v => /zh[-_]HK|yue/i.test(v.lang));
  if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}

/* ═════════════ ME ═════════════ */
const LVL = [0, 100, 300, 700];
function levelOf(p) { let i = 0; LVL.forEach((v, k) => { if (p >= v) i = k; }); return { i, name: t('levels')[i], next: LVL[i + 1], cur: LVL[i] }; }
const BADGES = [
  ['first', '啖', h => h.length >= 1], ['dimsum', '點', h => h.filter(x => x.cu === 'dimsum').length >= 3], ['hopper', '區', h => new Set(h.map(x => x.d)).size >= 5],
  ['saver', '慳', h => h.reduce((s, x) => s + x.saved, 0) >= 300], ['night', '夜', h => h.some(x => x.meal === 'latenight')],
  ['hero', '街', () => LS.get('shared', 0) >= 1], ['curator', '藏', () => saved().length >= 5],
  ['critic', '評', () => myReviews().n >= 3], ['snap', '影', () => myReviews().photos >= 1]
];
const unlocked = () => BADGES.filter(b => b[2](diary())).map(b => b[0]);
function renderMe() {
  const h = diary(), p = points(), tot = h.reduce((s, x) => s + x.saved, 0), ds = new Set(h.map(x => x.d)).size, lv = levelOf(p), cl = LS.get('clicks', 0);
  const prog = lv.next ? ((p - lv.cur) / (lv.next - lv.cur)) * 100 : 100;
  const days = [...Array(7)].map((_, k) => { const d0 = TODAY0 - (6 - k) * DAY; const v = h.filter(x => x.ts >= d0 && x.ts < d0 + DAY).reduce((s, x) => s + x.saved, 0); return { v, lbl: new Date(d0).toLocaleDateString(locale(), { weekday: 'short' }) }; });
  const mx = Math.max(40, ...days.map(d => d.v)), ul = unlocked();
  const ch = currentChallenge(), chp = Math.min(ch.n, ch.v(weekDiary())), chDone = LS.get('chal', []).includes(weekKey()), [chN, chD] = t('ch_' + ch.k);
  $('#me-in').innerHTML = `<div class="page-h"><div><h1>${t('meT')}</h1><p>${t('meP')}</p></div><div class="sync ${BE.online ? 'on' : ''}"><i></i>${t('syncT')}: ${BE.online ? t('syncOn') : t('syncOff')}</div></div>
  ${AUTH_ON() ? '' : '<!--'}<div class="acct panel"><div class="acct-av">${BE.signedIn ? esc(BE.email.charAt(0).toUpperCase()) : ICON.user}</div><div class="acct-i"><b>${BE.signedIn ? esc(BE.email) : t('accT')}</b><small>${BE.signedIn ? t('accSynced') : t('accGuest')}</small></div>
    ${BE.signedIn ? `<button class="btn btn-ghost" data-act="signOut">${t('signOut')}</button>` : `<button class="btn btn-red" data-act="auth">${t('signIn')}</button>`}</div>${AUTH_ON() ? '' : '-->'}
  <div class="panels">
    <div class="panel chal ${chDone ? 'done' : ''}"><div class="chal-k">${t('chalTitle')} · ${t('chalReset', daysLeftInWeek())}</div><h3>${chN}</h3><p class="sub">${chD}</p>
      <div class="bar"><i style="width:${chp / ch.n * 100}%"></i></div><div class="chal-f"><b>${ch.k === 'save100' ? 'HK$' + chp + ' / ' + ch.n : chp + ' / ' + ch.n}</b><span>${chDone ? '✓ ' + t('chalDone') : '+50 pts'}</span></div><span class="chal-g">挑</span></div>
    <div class="panel lb"><h3>${t('lbT')}</h3><p class="sub">${t('lbP')}</p><div id="lb-box"><div class="skel"></div></div></div>
  </div>
  <div class="stats">
    <div class="stat hero-stat"><div class="k">${t('stSaved')}</div><div class="v ser"><small>HK$</small>${tot}</div><span class="bg">慳</span></div>
    <div class="stat"><div class="k">${t('stMeals')}</div><div class="v ser">${h.length}</div><span class="bg">食</span></div>
    <div class="stat"><div class="k">${t('stPts')}</div><div class="v ser">${p}</div><span class="bg">分</span></div>
    <div class="stat"><div class="k">${t('stDist')}</div><div class="v ser">${ds}<small style="font-size:.45em"> / 18</small></div><span class="bg">區</span></div>
  </div>
  <div class="panels">
    <div class="panel"><h3>${t('lvlT')}</h3><p class="sub">${lv.next ? t('toNext', lv.next - p, t('levels')[lv.i + 1]) : t('maxLvl')}</p>
      <div class="lvl"><div class="lvl-seal">${['新', '街', '饕', '神'][lv.i]}</div><div style="flex:1"><div class="lvl-n">${lv.name}</div><div class="bar"><i style="width:${prog}%"></i></div><small>${p} / ${lv.next || p} pts</small></div></div>
      <h3 style="margin-top:6px">${t('weekT')}</h3><p class="sub">${t('weekS')}</p>
      <div class="week">${days.map(d => `<div class="d ${d.v ? '' : 'zero'}"><b>${d.v ? '$' + d.v : ''}</b><i style="height:${d.v ? Math.max(8, d.v / mx * 100) : 4}%"></i><span>${d.lbl}</span></div>`).join('')}</div>
    </div>
    <div class="panel"><h3>${t('histT')}</h3><p class="sub">&nbsp;</p><div class="hist">${h.length ? h.slice(0, 7).map(x => { const c = CU[x.cu] || CU.cantonese; return `<div class="hrow" style="--c1:${c.c1};--c2:${c.c2}">${tileArt(x.id, c)}<div class="hi"><div class="hn">${esc(tri(x.name))}</div><div class="hd">${new Date(x.ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })} · ${esc(areaName(x.area))}</div></div><div class="hs">+$${x.saved}</div></div>`; }).join('') : `<p class="muted">${t('histEmpty')}</p>`}</div></div>
  </div>
  <div class="panel" style="margin-bottom:16px"><h3>${t('badgesT')}</h3><p class="sub">${ul.length} / ${BADGES.length}</p>
    <div class="badges">${BADGES.map(([k, g]) => { const [n, d] = t('b_' + k); return `<div class="bdg ${ul.includes(k) ? 'on' : ''}"><div class="bs">${g}</div><b>${n}</b><small>${d}</small></div>`; }).join('')}</div></div>
  <div class="panel partner" style="margin-bottom:40px"><h3>${t('partnerT')}</h3><p class="sub">${t('partnerS')}</p>
    <div class="kv"><div><span>${t('clicks')}</span><b>${cl}</b></div><div><span>${t('estComm')}</span><b>HK$${(cl * CFG.affiliate.avgOrder * CFG.affiliate.rate).toFixed(2)}</b></div><div><span>${t('subs')}</span><b>${LS.get('shared', 0)}</b></div></div>
    <button class="btn btn-ghost" style="margin-top:18px" data-act="resetData">${t('resetData')}</button></div>`;
  if (!NATIVE && !installed()) $('#me-in').insertAdjacentHTML('beforeend', `<div class="panel install" style="margin:-24px 0 40px"><div><h3>${t('instT')}</h3><p class="sub" style="margin:0">${t('instP')}</p></div><button class="btn btn-ink" data-act="install">${ICON.plus}${t('instBtn')}</button></div>`);
  loadLeaderboard();
}

/* ═════════════ DETAIL SHEET ═════════════ */
let currentDeal = null;
function openDeal(id) { if (location.hash !== '#deal/' + id) location.hash = 'deal/' + id; else showDeal(id); }
function closeDeal() { if (location.hash.startsWith('#deal/')) history.replaceState(null, '', location.pathname + location.search); hideDeal(); }
function hideDeal() { closeOv('ov-deal'); currentDeal = null; }
function showDeal(id, keepScroll) {
  const p = byId(id); if (!p) return;
  const st = $('#deal-in').scrollTop;
  currentDeal = id; $('#deal-in').innerHTML = dealHTML(p); openOv('ov-deal');
  $('#deal-in').scrollTop = keepScroll ? st : 0;
  loadReviews(p);
}
function valueHtml(p) {
  const v = value(p); if (!v) return '';
  const rows = [['quality', v.parts.quality], ['price', v.parts.price], ['portion', v.parts.portion], ['satisfaction', v.parts.satisfaction], ['location', v.parts.location]];
  return `<div class="d-sec vbox"><div class="vhead"><div class="vring v-${v.label}" style="--v:${v.total}"><b>${v.total}</b><small>/100</small></div><div><h4 style="margin:0">${t('valueT')}</h4><div class="vlab v-${v.label}">${t('vl_' + v.label)}</div><small class="muted">${t('valueBasis', v.basis === 'community' ? t('reviewsN', v.reviews) : t('editorsShort'))}</small></div></div>
    <div class="vbars">${rows.map(([k, val]) => `<div class="vbar ${val == null ? 'na' : ''}"><span>${t('vp_' + k)} <em>${v.weights[k]}%</em></span><i><b style="width:${val ?? 0}%"></b></i><strong>${val == null ? t('noData') : Math.round(val)}</strong></div>`).join('')}</div>
    <p class="muted small">${t('valueExplain')} <a href="https://github.com/HK-CheapEats/HK-CheapEats.github.io/blob/main/VALUE_SCORE.md" target="_blank" rel="noopener">${t('howCalc')}</a> · ${t('calcOn', new Date().toLocaleDateString(locale(), { day: 'numeric', month: 'short' }))}</p></div>`;
}
function dealHTML(p) {
  const c = CU[p.cu] || CU.cantonese, sv = isSaved(p.id), voted = BE.hasVoted(p.id), dist = distOf(p);
  const ate = diary().some(x => x.id === p.id && x.ts >= TODAY0);
  const mq = encodeURIComponent(`${p.name.en} ${p.area} Hong Kong`);
  const exp = p.expiry ? new Date(p.expiry).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : t('ongoing');
  const hrs = `${fmt(p.open)} – ${fmt(p.close)}` + (p.closed >= 0 ? ` · ${t('closedOn', t('days')[p.closed])}` : '');
  const r = rating(p);
  return `<div class="d-cover" style="--c1:${c.c1};--c2:${c.c2}"><div class="cover"><span class="cv-lbl">${c.g} · ${esc(cun(p.cu))}</span>${coverArt(p, c)}</div></div>
  <button class="x" data-act="closeDeal" aria-label="Close">${ICON.x}</button>
  ${sealHtml(p, 'd-seal')}
  <div class="d-body">
    <div class="d-k">${p.featured ? '★ ' + t('featured') + ' · ' : ''}${p.legend ? t('legend') + ' · ' : ''}${esc(areaName(p.area))}${areaName(p.area) === tri(DIST[p.d]) ? '' : ' · ' + esc(tri(DIST[p.d]))}</div>
    <h2 class="d-n">${esc(nm(p))}</h2><div class="d-alt">${esc(alt(p))}</div>
    <div class="d-meta">${statusPill(p)}${r ? `<span class="pill" style="color:var(--gold)">★ ${(+r).toFixed(1)}${reviewCount(p) ? ` · ${t('reviewsN', reviewCount(p))}` : ` · ${t('editors')}`}</span>` : ''}${endsIn(p) ? `<span class="pill" style="color:var(--red)">${endsIn(p)}</span>` : ''}${dist != null ? `<span class="pill">${fmtDist(dist)}</span>` : ''}</div>
    <div class="ticket">
      <div class="t-offer">${esc(of(p))}</div>
      <div class="t-win">${ICON.clock}${t('dealHours')}: ${t('meal_' + p.meal)}</div>
      <div class="t-cut"></div>
      <div class="t-price">${priceHtml(p)}${isDeal(p) ? `<div class="t-save">${t('youSave')}<b>HK$${p.orig - p.price}</b></div>` : `<div class="t-save">${t('everydaySub')}</div>`}</div>
    </div>
    <div class="d-acts">
      <button class="btn ${ate ? 'btn-ghost voted' : 'btn-red'} btn-lg wide" data-ate="${esc(p.id)}" ${ate ? 'disabled' : ''}>${ICON.check}${ate ? t('ateDone') : t('ate')}</button>
      <a class="btn btn-ink btn-lg" href="https://www.google.com/maps/dir/?api=1&destination=${mq}&travelmode=walking" target="_blank" rel="noopener">${ICON.pin}${t('directions')}</a>
      <button class="btn btn-ghost btn-lg ${sv ? 'voted' : ''}" data-save="${esc(p.id)}" data-refresh="1">${ICON.heart}${sv ? t('saved') : t('save')}</button>
      <button class="btn btn-ghost" data-sharedeal="${esc(p.id)}">${ICON.share}${t('share')}</button>
      <a class="btn btn-ghost" href="https://wa.me/?text=${encodeURIComponent(shareText(p))}" target="_blank" rel="noopener">${ICON.wa}WhatsApp</a>
      <button class="btn btn-ghost wide" data-menu="${esc(p.id)}">${ICON.book}${t('menuBtn')}</button>
    </div>
    ${p.delivery ? `<a class="order" href="${CFG.affiliate.foodpanda}?${CFG.affiliate.utm}${encodeURIComponent(p.id)}" target="_blank" rel="sponsored noopener" data-track="1"><span class="ol">${ICON.bike}</span><span>${t('order')}<small>${t('orderSub')}</small></span><span class="arr">${ICON.arrow}</span></a>` : ''}
    <div class="d-sec"><div class="rv-head"><h4 style="margin:0">${t('reviewsT')}</h4><button class="btn btn-ghost" data-review="${esc(p.id)}">${ICON.pen}${t('writeReview')}</button></div><div id="rv-box"><div class="skel"></div></div></div>
    <div class="d-sec"><h4>Info</h4><div class="d-rows">
      <div class="d-row"><span>${t('hours')}</span><b>${hrs}</b></div>
      <div class="d-row"><span>${t('payment')}</span><b>${p.pay.map(x => t('pay_' + x)).join(' · ')}</b></div>
      <div class="d-row"><span>${t('cuisine')}</span><b>${esc(cun(p.cu))}${p.veg ? ' · ' + t('veg') : ''}</b></div>
      <div class="d-row"><span>${t('area')}</span><b>${esc(areaName(p.area))} · ${esc(tri(DIST[p.d]))}</b></div>
      ${(() => { const m = nearestMtr(p); return m && m.d < 3 ? `<div class="d-row"><span>${t('nearestMtr')}</span><b><i class="mtr-dot" style="background:${MTR[m.i][4]}"></i>${esc(stName(m.i))} · ${t('walkMin', walkMin(m.d))}</b></div>` : ''; })()}
      ${p.expiry ? `<div class="d-row"><span>${t('ends')}</span><b>${exp}</b></div>` : ''}
    </div></div>
    ${valueHtml(p)}
    <div class="d-sec"><h4>${t('menuItemsT')}</h4><table class="dish"><thead><tr><th>${t('dishT')}</th><th>${t('priceT')}</th></tr></thead><tbody><tr><td><b>${esc(of(p))}</b><small>${esc(S.lang === 'en' ? p.offer.hant : p.offer.en)}</small></td><td>HK$${p.price}${isDeal(p) ? `<s>HK$${p.orig}</s>` : ''}</td></tr></tbody></table><p class="muted small">${t('menuItemsNote')}</p></div>
    <div class="d-sec trust"><h4>${t('trustT')}</h4><div class="d-rows">
      <div class="d-row"><span>${t('trustStatus')}</span><b><span class="vstat ${p.user ? 'comm' : 'unv'}">${p.user ? t('stComm') : t('stUnv')}</span></b></div>
      <div class="d-row"><span>${t('trustSource')}</span><b>${p.user ? t('srcComm') : t('srcEd')}</b></div>
      <div class="d-row"><span>${t('trustListed')}</span><b>${new Date(p.addedTs).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })}</b></div>
      <div class="d-row"><span>${t('trustPrice')}</span><b>${t('notChecked')}</b></div>
    </div><button class="btn btn-ghost" style="margin-top:12px" data-report="${esc(p.id)}">${ICON.flag}${t('suggestFix')}</button></div>
    <div class="vote-row">
      <button class="btn btn-ghost ${voted ? 'voted' : ''}" data-vote="${esc(p.id)}">${ICON.up}${t('worth')} · ${votes(p)}</button>
      <button class="btn btn-ghost" data-pinmap="${esc(p.id)}">${ICON.map}${t('showMap')}</button>
      <button class="btn btn-ghost" data-report="${esc(p.id)}" aria-label="${t('report')}">${ICON.flag}</button>
    </div>
    <p class="disc">${t('disclaimer')}</p>
  </div>`;
}
const AV_COLORS = ['#D7392A', '#17795A', '#C98A1A', '#2D4C9E', '#A93468', '#5A2A1E', '#1F5E5B'];
async function loadReviews(p) {
  const box = $('#rv-box'); if (!box) return;
  let list;
  try { list = await BE.reviews(p.id); } catch (e) { if (currentDeal === p.id) box.innerHTML = `<div class="rv-empty">${t('loadFail')}</div>`; return; }
  if (currentDeal !== p.id || !$('#rv-box')) return;
  if (!list.length) { $('#rv-box').innerHTML = `<div class="rv-empty">${t('noReviews')}</div>`; return; }
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  $('#rv-box').innerHTML = `<div class="rv-sum"><div class="rv-avg">${avg.toFixed(1)}</div><div>${stars(avg)}<small>${t('reviewsN', list.length)}</small></div></div>
  <div class="rv-list">${list.map(r => `<div class="rv">
    <div class="rv-top"><div class="rv-av" style="background:${AV_COLORS[hash(r.user_id || r.display_name) % AV_COLORS.length]}">${esc((r.display_name || '?').trim().charAt(0).toUpperCase())}</div>
      <div style="flex:1;min-width:0"><div class="rv-n">${esc(r.display_name)}${r.mine ? `<em>${t('rvMine')}</em>` : ''}</div><div class="rv-d">${stars(r.rating)} · ${new Date(r.created_at).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })}</div></div></div>
    ${r.body ? `<div class="rv-body">${esc(r.body)}</div>` : ''}
    ${r.photo ? `<div class="rv-photo" data-zoom="${esc(r.photo)}"><img src="${esc(r.photo)}" alt="" loading="lazy"></div>` : ''}
    <div class="rv-acts">${r.mine ? `<button data-delrv="${esc(r.id)}">${t('rvDelete')}</button>` : `<button data-rptrv="${esc(r.id)}">${t('rvReport')}</button>`}</div>
  </div>`).join('')}</div>`;
  $('#rv-box')._list = list;
}
const stars = n => `<span class="stars">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= Math.round(n) ? '' : 'off'}">★</span>`).join('')}</span>`;
const shareText = p => `${nm(p)} — ${of(p)} · $${p.price}` + (isDeal(p) ? ` (${t('youSave')} $${p.orig - p.price})` : '') + (placeUrl(p) ? ` ${placeUrl(p)}` : '');
function shareDeal(id) {
  const p = byId(id), url = placeUrl(p) || undefined;
  const ns = plug('Share');
  if (ns) { haptic(); ns.share({ title: nm(p), text: shareText(p), url, dialogTitle: t('share') }).catch(() => {}); return; }
  if (navigator.share) navigator.share({ title: nm(p), text: shareText(p), url }).catch(() => {});
  else navigator.clipboard?.writeText(url || shareText(p)).then(() => toast(t('tLink')));
}

/* ═════════════ REVIEW FORM ═════════════ */
let rvState = null;
function openReview(id) {
  const p = byId(id); if (!p) return;
  rvState = { id, rating: 0, image: null, preview: null };
  $('#review-in').innerHTML = `<button class="x" data-close="ov-review" aria-label="Close">${ICON.x}</button><div class="form-in"><h2>${t('writeReview')}</h2><p>${esc(nm(p))} · ${esc(areaName(p.area))}</p>
    ${BE.online ? '' : `<div class="note">${t('rvLocal')}</div>`}
    <div class="fg"><label>${t('rvRating')}</label><div class="star-pick" id="star-pick">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-star="${i}" aria-label="${i}">★</button>`).join('')}</div></div>
    <div class="fg"><label for="rv-body">${t('yourReview')}</label><textarea id="rv-body" maxlength="1000" placeholder="${t('rvBody')}"></textarea></div>
    <div class="fg"><label for="rv-name">${t('rvName')}</label><input id="rv-name" maxlength="40" value="${esc(LS.get('rvname', ''))}" placeholder="${t('rvNamePh')}"></div>
    <label class="photo-pick fg" for="rv-file"><span class="ph" id="rv-ph">${ICON.camera}</span><span><b id="rv-pl">${t('rvPhoto')}</b><small>JPG · PNG · max 5 MB</small></span></label>
    <input type="file" id="rv-file" accept="image/*" hidden>
    <button class="btn btn-ink btn-lg btn-block" id="rv-post">${t('rvPost')}</button></div>`;
  openOv('ov-review');
  $('#rv-file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    $('#rv-pl').textContent = t('loading');
    rvState.pending = resizeImage(f, 1280, .82);
    try { const blob = await rvState.pending; rvState.image = blob; rvState.preview && URL.revokeObjectURL(rvState.preview); rvState.preview = URL.createObjectURL(blob);
      $('#rv-ph').innerHTML = `<img src="${rvState.preview}" alt="">`; $('#rv-pl').textContent = t('rvPhotoChange'); } catch { toast(t('tErr')); }
  });
  $('#rv-post').addEventListener('click', postReview);
}
function resizeImage(file, max, q) {
  return new Promise((res, rej) => {
    if (file.size > 15 * 1024 * 1024) return rej(new Error('too big'));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('encode')), 'image/jpeg', q); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); };
    img.src = url;
  });
}
async function postReview() {
  if (!rvState.rating) { toast(t('rvNeedRating')); return; }
  const btn = $('#rv-post'), name = ($('#rv-name').value.trim() || (S.lang === 'en' ? 'Anonymous foodie' : '匿名食家')).slice(0, 40), body = $('#rv-body').value.trim().slice(0, 1000);
  LS.set('rvname', $('#rv-name').value.trim());
  btn.disabled = true; btn.textContent = t('rvPosting');
  if (rvState.pending) { try { rvState.image = await rvState.pending; } catch { rvState.image = null; } }
  const before = unlocked();
  try {
    await BE.addReview({ placeId: rvState.id, name, rating: rvState.rating, body, image: rvState.image });
    const m = myReviews(); m.n++; if (rvState.image) m.photos++; LS.set('myrv', m);
    const pts = 15 + (rvState.image ? 5 : 0); addPts(pts);
    closeOv('ov-review'); haptic('success'); toast(t('tReview', pts)); confetti(innerWidth / 2, innerHeight / 3);
    checkBadges(before); if (currentDeal) showDeal(currentDeal, true); refreshViews();
  } catch (e) {
    btn.disabled = false; btn.textContent = t('rvPost');
    toast(e.message === 'already-reviewed' ? t('rvAlready') : /rate limit/i.test(e.message || '') ? t('rvRate') : t('tErr'));
  }
}
async function deleteReview(rid) {
  const list = $('#rv-box')?._list || [], r = list.find(x => String(x.id) === rid); if (!r || !confirm(t('rvDeleteQ'))) return;
  try { await BE.deleteReview(r); const m = myReviews(); m.n = Math.max(0, m.n - 1); LS.set('myrv', m); toast(t('tReviewDel')); if (currentDeal) showDeal(currentDeal, true); refreshViews(); }
  catch { toast(t('tErr')); }
}

/* ═════════════ ACCOUNT · SYNC ═════════════ */
var syncTimer = null, profTimer = null, lastAuth = null;
function onLocalChange(k) {
  if (k === 'wk' || k === 'pts' || k === 'lbname') { clearTimeout(profTimer); profTimer = setTimeout(() => pushProfile().catch(() => {}), 2500); }
  if (BE.signedIn) { clearTimeout(syncTimer); syncTimer = setTimeout(() => BE.pushState(collectState()), 1500); }
}
const collectState = () => Object.fromEntries(SYNC_KEYS.map(k => [k, LS.get(k, null)]));
function mergeState(c) {
  c = c || {}; const L = k => LS.get(k, null), out = {};
  out.saved = [...new Set([...(L('saved') || []), ...(c.saved || [])])];
  const seen = new Set();
  out.ate = [...(L('ate') || []), ...(c.ate || [])].filter(x => { const key = x.id + '|' + x.ts; if (seen.has(key)) return false; seen.add(key); return true; }).sort((a, b) => b.ts - a.ts).slice(0, 300);
  for (const k of ['pts', 'shared', 'clicks']) out[k] = Math.max(L(k) || 0, c[k] || 0);
  const mr = L('myrv') || { n: 0, photos: 0 }, cr = c.myrv || { n: 0, photos: 0 };
  out.myrv = { n: Math.max(mr.n, cr.n), photos: Math.max(mr.photos, cr.photos) };
  const lw = L('wk') || {}, cw = c.wk || {}, wk = weekKey();
  out.wk = lw.k === cw.k ? { k: lw.k, p: Math.max(lw.p || 0, cw.p || 0) } : lw.k === wk ? lw : cw.k === wk ? cw : lw;
  out.chal = [...new Set([...(L('chal') || []), ...(c.chal || [])])];
  for (const k of ['rvname', 'lbname', 'grpname']) out[k] = L(k) || c[k] || '';
  return out;
}
async function syncDown() {
  const cloud = await BE.pullState().catch(() => null), m = mergeState(cloud);
  for (const [k, v] of Object.entries(m)) { try { localStorage.setItem('hkce3_' + k, JSON.stringify(v)); } catch {} }
  await BE.pushState(m);
}
async function onUserChange() {
  const key = BE.userId + (BE.signedIn ? '+' : ''); if (key === lastAuth) return;
  const was = lastAuth; lastAuth = key; renderShell();
  if (BE.signedIn) { await syncDown(); LS.set('welcomed', true); closeOv('ov-auth'); refresh(); if (was) { haptic('success'); toast(t('tSignedIn', esc(BE.email))); } }
  else refresh();
}
function openAuth() {
  if (!BE.online) { toast(t('authOffline')); return; }
  const g = (CFG.authProviders || []).includes('google');
  $('#auth-in').innerHTML = `<button class="x" data-act="authGuest" aria-label="Close">${ICON.x}</button><div class="form-in auth" id="auth-step">
    <div class="auth-seal">慳</div><h2>${t('authT')}</h2><p>${t('authP')}</p>
    <ul class="perks">${t('authPerks').map(x => `<li>${ICON.check}<span>${x}</span></li>`).join('')}</ul>
    <div class="fg"><label for="auth-email">${t('authEmail')}</label><input id="auth-email" type="email" autocomplete="email" inputmode="email" placeholder="${t('authEmailPh')}"></div>
    <button class="btn btn-red btn-lg btn-block" data-act="authSend" id="auth-send">${t('authSend')}</button>
    ${g ? `<div class="or"><span>${t('authOr')}</span></div><button class="btn btn-ghost btn-lg btn-block" data-act="authGoogle">${t('authGoogle')}</button>` : ''}
    <button class="btn btn-ghost btn-block guest" data-act="authGuest">${t('authGuest')}</button><p class="center-t">${t('authGuestSub')}</p></div>`;
  openOv('ov-auth');
  $('#auth-email').addEventListener('keydown', e => { if (e.key === 'Enter') authSend(); });
}
function authGuest() { LS.set('welcomed', true); closeOv('ov-auth'); }
async function authSend() {
  const em = ($('#auth-email')?.value || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { toast(t('authBadEmail')); return; }
  const b = $('#auth-send'); b.disabled = true; b.textContent = t('loading');
  try { await BE.sendCode(em); authStepCode(em); }
  catch (e) { console.warn('[auth]', e); b.disabled = false; b.textContent = t('authSend'); toast(t('authFail')); }
}
function authStepCode(em) {
  $('#auth-step').innerHTML = `<div class="auth-seal">信</div><h2>${t('authCodeT')}</h2><p>${t('authCodeP', esc(em))}</p>
    <div class="fg"><input id="auth-code" class="code-in" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="${t('authCodePh')}" aria-label="${t('authCodePh')}"></div>
    <button class="btn btn-red btn-lg btn-block" data-act="authVerify" id="auth-ver">${t('authVerify')}</button>
    <button class="btn btn-ghost btn-block guest" data-act="authBack">${t('authBack')}</button>`;
  const c = $('#auth-code'); c.focus();
  c.addEventListener('input', () => { if (/^\d{6}$/.test(c.value.trim())) authVerify(); });
  c.addEventListener('keydown', e => { if (e.key === 'Enter') authVerify(); });
}
async function authVerify() {
  const c = ($('#auth-code')?.value || '').trim(), b = $('#auth-ver');
  if (!/^\d{6,10}$/.test(c)) { toast(t('authBadCode')); return; }
  if (!b || b.disabled) return; b.disabled = true;
  try { await BE.verifyCode(c); await onUserChange(); }
  catch (e) { console.warn('[auth]', e); b.disabled = false; toast(t('authBadCode')); }
}
function authBack() { openAuth(); }
async function signOut() {
  if (!confirm(t('confirmSignOut'))) return;
  await BE.signOut();
  SYNC_KEYS.forEach(k => { try { localStorage.removeItem('hkce3_' + k); } catch {} });
  lastAuth = null; await onUserChange(); toast(t('tSignedOut'));
}

/* ═════════════ WEEKLY CHALLENGE · LEADERBOARD ═════════════ */
const hkDay = () => { const d = new Date(Date.now() + 8 * 3600e3); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const weekStart = () => { const d0 = hkDay(), dow = (new Date(d0).getUTCDay() + 6) % 7; return d0 - dow * DAY - 8 * 3600e3; };
const daysLeftInWeek = () => Math.max(1, Math.ceil((weekStart() + 7 * DAY - Date.now()) / DAY));
function weekKey() {
  const t0 = new Date(hkDay()), dn = (t0.getUTCDay() + 6) % 7; t0.setUTCDate(t0.getUTCDate() - dn + 3);
  const y = t0.getUTCFullYear(), fy = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((t0 - fy) / DAY - 3 + (fy.getUTCDay() + 6) % 7) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
const CHALS = [
  { k: 'districts3', n: 3, v: h => new Set(h.map(x => x.d)).size },
  { k: 'legend2', n: 2, v: h => h.filter(x => PLACES.find(p => p.id === x.id)?.legend).length },
  { k: 'cuisines3', n: 3, v: h => new Set(h.map(x => x.cu)).size },
  { k: 'save100', n: 100, v: h => h.reduce((s, x) => s + (x.saved || 0), 0) },
  { k: 'breakfast2', n: 2, v: h => h.filter(x => x.meal === 'breakfast').length },
  { k: 'late2', n: 2, v: h => h.filter(x => x.meal === 'latenight').length }
];
const currentChallenge = () => { const m = weekKey().match(/(\d+)-W(\d+)/); return CHALS[(+m[1] * 53 + +m[2]) % CHALS.length]; };
const weekDiary = () => diary().filter(x => x.ts >= weekStart());
function checkChallenge() {
  const ch = currentChallenge(), wk = weekKey(), done = LS.get('chal', []);
  if (done.includes(wk) || ch.v(weekDiary()) < ch.n) return;
  LS.set('chal', [...done, wk].slice(-60)); addPts(50);
  setTimeout(() => { toast(t('tChal', t('ch_' + ch.k)[0])); confetti(innerWidth / 2, innerHeight / 3, 60); }, 1600);
}
async function pushProfile() {
  const name = LS.get('lbname', ''); if (!name || !BE.online) return;
  const w = LS.get('wk', {});
  await BE.saveProfile({ display_name: name, week_key: weekKey(), week_points: Math.min(3000, w.k === weekKey() ? w.p : 0), total_points: Math.min(500000, points()) });
}
async function loadLeaderboard(edit) {
  if (!$('#lb-box')) return;
  if (!BE.online) { $('#lb-box').innerHTML = `<p class="muted">${t('lbOffline')}</p>`; return; }
  const rows = await BE.leaderboard(weekKey(), 10), box = $('#lb-box'); if (!box) return;
  const name = LS.get('lbname', ''), me = rows.findIndex(r => r.mine);
  const list = rows.length ? `<ol class="lb-list">${rows.map((r, i) => `<li class="${r.mine ? 'me' : ''}"><span class="lb-r">${i < 3 ? ['壹', '貳', '參'][i] : i + 1}</span><span class="lb-n">${esc(r.display_name)}${r.mine ? ` <em>${t('lbYou')}</em>` : ''}</span><b>${t('lbPts', r.week_points)}</b></li>`).join('')}</ol>` : `<p class="muted">${t('lbEmpty')}</p>`;
  const join = name && !edit ? `<div class="lb-foot"><span>${me >= 0 ? t('lbRank', me + 1) : esc(name)}</span><button class="lb-edit" data-act="lbEdit">${t('lbChange')}</button></div>`
    : `<div class="lb-join"><input id="lb-name" maxlength="30" placeholder="${t('lbNamePh')}" value="${esc(name)}" aria-label="${t('lbName')}"><button class="btn btn-ink" data-act="lbJoin">${name ? t('lbSave') : t('lbJoin')}</button></div>`;
  box.innerHTML = list + join;
}
async function lbJoin() {
  const v = ($('#lb-name')?.value || '').trim(); if (!v || v.length > 30) { toast(t('lbBadName')); return; }
  LS.set('lbname', v);
  try { await pushProfile(); toast(t('tJoined')); haptic('success'); } catch (e) { console.warn(e); toast(t('tErr')); }
  loadLeaderboard();
}

/* ═════════════ MENU HELPER ═════════════ */
function openMenu(id) {
  const p = byId(id); if (!p) return; const ph = window.HKCE_PHRASES || [];
  $('#menu-in').innerHTML = `<button class="x" data-close="ov-menu" aria-label="Close">${ICON.x}</button><div class="form-in">
    <h2>${t('menuT')}</h2><p>${t('menuP')}</p>
    <div class="menu-card"><div class="menu-n">${esc(p.name.hant)}</div><div class="menu-w">${t('menuWant')}</div><div class="menu-o">${esc(S.lang === 'hans' ? p.offer.hans : p.offer.hant)}</div>
      <div class="menu-p"><small>${t('menuPrice')}</small>$${p.price}</div><button class="say big" data-say="${esc('唔該，我想要' + p.offer.hant)}" aria-label="Play">▶</button></div>
    <h4 class="menu-sub">${t('menuPhrases')}</h4>
    <div class="phr">${ph.map(([h, hs, jp, en]) => `<div class="ph-r"><div><b>${S.lang === 'hans' ? hs : h}</b><small>${jp}${S.lang === 'en' ? '' : ''} · ${esc(en)}</small></div><button class="say" data-say="${esc(h)}" aria-label="Play">▶</button></div>`).join('')}</div></div>`;
  openOv('ov-menu');
}

/* ═════════════ GROUP VOTE ═════════════ */
var grpTimer = null, grpCode = null;
const groupUrl = code => (shareBase() || location.href.split('#')[0]) + '#group/' + code;
async function newGroup() {
  if (!BE.online) { toast(t('grpOffline')); return; }
  const sv = saved().map(byId).filter(Boolean);
  const ids = (sv.length >= 2 ? sv : sorted(filtered()).slice(0, 5)).slice(0, 8).map(p => p.id);
  if (ids.length < 2) { toast(t('tErr')); return; }
  try { const code = await BE.createGroup(ids); haptic('success'); location.hash = 'group/' + code; }
  catch (e) { toast(/rate limit/i.test(e.message || '') ? t('rvRate') : t('tErr')); }
}
async function openGroup(code) {
  grpCode = code;
  $('#group-in').innerHTML = `<button class="x" data-act="closeGroup" aria-label="Close">${ICON.x}</button><div class="d-body grp"><div class="skel"></div></div>`;
  openOv('ov-group');
  if (!BE.online) { $('#group-in .d-body').innerHTML = `<div class="empty"><div class="empty-g">網</div><h3>${t('grpOffline')}</h3></div>`; return; }
  await renderGroup();
  clearInterval(grpTimer); grpTimer = setInterval(() => { if (grpCode && document.visibilityState === 'visible') renderGroup(true); }, 4000);
}
async function renderGroup(quiet) {
  const code = grpCode; if (!code) return;
  if (quiet && document.activeElement?.id === 'grp-name') return;
  let g; try { g = await BE.group(code); } catch { if (!quiet) toast(t('tErr')); return; }
  const body = $('#group-in .d-body'); if (code !== grpCode || !body) return;
  if (!g) { body.innerHTML = `<div class="empty"><div class="empty-g">散</div><h3>${t('grpGone')}</h3></div>`; clearInterval(grpTimer); return; }
  const counts = {}; g.votes.forEach(v => counts[v.place_id] = (counts[v.place_id] || 0) + 1);
  const mine = g.votes.find(v => v.mine)?.place_id, total = g.votes.length, max = Math.max(0, ...Object.values(counts));
  const names = g.votes.filter(v => v.voter_name).map(v => esc(v.voter_name));
  body.innerHTML = `<div class="d-k">${t('grpCode', code)} · ${t('grpEnds')}</div><h2 class="d-n">${t('grpT')}</h2><p class="muted" style="margin:6px 0 18px">${t('grpP')}</p>
    <div class="grp-share"><button class="btn btn-red" data-act="grpShare">${ICON.share}${t('grpShare')}</button><a class="btn btn-ghost" href="https://wa.me/?text=${encodeURIComponent(t('grpShareText', groupUrl(code)))}" target="_blank" rel="noopener">${ICON.wa}WhatsApp</a><button class="btn btn-ghost" data-act="grpCopy">${t('grpCopy')}</button></div>
    <div class="fg" style="margin-top:18px"><label for="grp-name">${t('grpName')}</label><input id="grp-name" maxlength="30" value="${esc(LS.get('grpname', ''))}" placeholder="${t('grpNamePh')}"></div>
    ${mine ? '' : `<p class="grp-hint">${t('grpTapVote')}</p>`}
    <div class="grp-list">${g.place_ids.map(byId).filter(Boolean).map(p => { const n = counts[p.id] || 0, c = CU[p.cu] || CU.cantonese, lead = n > 0 && n === max;
      return `<button class="grp-row ${mine === p.id ? 'mine' : ''} ${lead ? 'lead' : ''}" data-gvote="${esc(p.id)}" style="--c1:${c.c1};--c2:${c.c2}">${tileArt(p.id, c)}<span class="gi"><b>${esc(nm(p))}</b><small>${esc(areaName(p.area))} · ${isDeal(p) ? '' : '~'}$${p.price}${lead ? ` · <em>${t('grpLead')}</em>` : ''}${mine === p.id ? ` · ${t('grpYour')}` : ''}</small><span class="gbar"><i style="width:${total ? n / total * 100 : 0}%"></i></span></span><span class="gn">${n}</span></button>`; }).join('')}</div>
    <p class="muted" style="margin-top:14px">${t('grpVotes', total)}${names.length ? ` · ${t('grpVoters')}: ${names.join(', ')}` : ''}</p>`;
}
async function groupVote(id) {
  if (!grpCode) return; const name = ($('#grp-name')?.value || '').trim().slice(0, 30); LS.set('grpname', name);
  try { await BE.groupVote(grpCode, id, name); haptic('medium'); renderGroup(); } catch (e) { console.warn(e); toast(t('tErr')); }
}
function grpShare() {
  const url = groupUrl(grpCode), text = t('grpShareText', url), ns = plug('Share');
  if (ns) { ns.share({ title: t('grpT'), text, url }).catch(() => {}); return; }
  if (navigator.share) navigator.share({ title: t('grpT'), text, url }).catch(() => {}); else grpCopy();
}
function grpCopy() { navigator.clipboard?.writeText(groupUrl(grpCode)).then(() => toast(t('tLink'))); }
function closeGroup() { closeOv('ov-group'); }

/* ═════════════ INSTALL (web app) · OFFLINE ═════════════ */
var deferredInstall = null;
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast(t('instDone')); refresh(); });
async function install() {
  if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  $('#msg-in').innerHTML = `<button class="x" data-close="ov-msg" aria-label="Close">${ICON.x}</button><div class="form-in"><div class="auth-seal">裝</div><h2>${t('instT')}</h2><p>${t('instP')}</p><div class="note" style="font-size:14px">${ios ? t('instIos') : t('instOther')}</div></div>`;
  openOv('ov-msg');
}
if ('serviceWorker' in navigator && !NATIVE && (location.protocol === 'https:' || location.hostname === 'localhost')) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
window.addEventListener('offline', () => toast(t('offlineT')));

/* ═════════════ SEARCH SUGGESTIONS ═════════════ */
let sugList = [], sugFor = null;
function showSug(input) {
  sugFor = input; sugList = suggestions(input.value);
  let box = $('#sug'); if (!box) { box = document.createElement('div'); box.id = 'sug'; box.className = 'sug'; box.setAttribute('role', 'listbox'); document.body.appendChild(box); }
  if (!sugList.length) { box.hidden = true; return; }
  const r = input.getBoundingClientRect();
  box.style.left = r.left + 'px'; box.style.top = (r.bottom + 6 + scrollY) + 'px'; box.style.width = Math.max(260, r.width) + 'px';
  box.innerHTML = (input.value.trim() ? '' : `<div class="sug-h">${t('recentSearches')}</div>`) + sugList.map((x, i) => `<button role="option" data-sug="${i}"><span class="sug-k">${x.k === 'place' ? '🍜' : x.k === 'area' ? '📍' : x.k === 'cu' ? '🥢' : x.k === 'hist' ? '↺' : '🔎'}</span><span><b>${esc(typeof x.label === 'function' ? input.value : x.label)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}</span></button>`).join('');
  box.hidden = false;
}
function hideSug() { const b = $('#sug'); if (b) b.hidden = true; }
function pickSuggestion(i) {
  const x = sugList[i]; if (!x) return; hideSug();
  if (x.k === 'place') { pushHist(sugFor?.value); return openDeal(x.id); }
  S.q = x.q; $('#q').value = S.q; $('#hq').value = S.q; pushHist(S.q); if (S.tab !== 'deals' && S.tab !== 'map') go('deals'); else refresh(); scrollToResults();
}

/* ═════════════ MAP AREA SEARCH ═════════════ */
function areaSearch() {
  if (S.bounds) { S.bounds = null; return refresh(); }
  if (!map) return; S.bounds = map.getBounds(); mapFitted = true; refresh();
}

/* ═════════════ FINDER: a meal under $X within N minutes' walk ═════════════ */
const finder = { max: 50, walk: 10, cu: '' };
function openFinder() { renderFinder(); openOv('ov-msg'); }
function renderFinder(results) {
  $('#msg-in').innerHTML = `<button class="x" data-close="ov-msg" aria-label="Close">${ICON.x}</button><div class="form-in finder">
    <div class="auth-seal">搵</div><h2>${t('finderT')}</h2><p>${t('finderP')}</p>
    <div class="fg"><label>${t('finderBudget')}</label><div class="f-chips">${[30, 50, 80, 100].map(v => `<button class="f-chip ${finder.max === v ? 'on' : ''}" data-fbud="${v}">HK$${v}</button>`).join('')}</div></div>
    <div class="fg"><label>${t('finderWalk')}</label><div class="f-chips">${[5, 10, 15, 20].map(v => `<button class="f-chip ${finder.walk === v ? 'on' : ''}" data-fwalk="${v}">${v} min</button>`).join('')}</div></div>
    <div class="fg"><label for="f-fcu">${t('cuisine')}</label><select id="f-fcu"><option value="">${t('any')}</option>${Object.keys(CU).map(k => `<option value="${k}" ${finder.cu === k ? 'selected' : ''}>${esc(cun(k))}</option>`).join('')}</select></div>
    <button class="btn btn-red btn-lg btn-block" data-act="findGo">${ICON.pin}${t('finderGo')}</button>
    <div id="finder-out">${results || ''}</div></div>`;
  $('#f-fcu').addEventListener('change', e => { finder.cu = e.target.value; });
}
function runFinder() {
  const out = () => {
    const km = finder.walk / 60 * 4.8 / 1.3;
    const list = all().filter(p => p.price <= finder.max && (!finder.cu || p.cu === finder.cu) && distOf(p) != null && distOf(p) <= km)
      .sort((x, y) => vTotal(y) - vTotal(x)).slice(0, 8);
    const html = list.length ? `<p class="muted small" style="margin:18px 0 8px">${t('finderN', list.length)} ${t('walkEst')}</p><div class="find-list">${list.map(p => { const c = CU[p.cu] || CU.cantonese, mq = encodeURIComponent(`${p.name.en} ${p.area} Hong Kong`);
      return `<div class="find-row" style="--c1:${c.c1};--c2:${c.c2}">${tileArt(p.id, c)}<div class="fi"><b>${esc(nm(p))}</b><small>HK$${p.price} · ≈${walkMin(distOf(p))} min · ${fmtDist(distOf(p))}</small>${vchip(p)}</div>
        <div class="fa"><button class="btn btn-ghost" data-open="${esc(p.id)}">${t('view')}</button><a class="btn btn-ink" href="https://www.google.com/maps/dir/?api=1&destination=${mq}&travelmode=walking" target="_blank" rel="noopener">${t('walkThere')}</a></div></div>`; }).join('')}</div>`
      : `<div class="note" style="margin-top:16px">${t('finderNone')}</div>`;
    renderFinder(html); $('#finder-out')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  if (S.user) return out();
  const got = pos => { S.user = [pos.coords.latitude, pos.coords.longitude]; refresh(); out(); };
  const fail = () => toast(t('tGeo'));
  const g = plug('Geolocation');
  if (g) { g.requestPermissions().catch(() => {}).finally(() => g.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 }).then(got).catch(fail)); return; }
  if (!navigator.geolocation) return fail();
  navigator.geolocation.getCurrentPosition(got, fail, { timeout: 9000, enableHighAccuracy: true });
}

/* ═════════════ ACTIONS ═════════════ */
function refreshViews() { if (S.tab === 'deals') renderDeals(); if (S.tab === 'map') renderMap(); if (S.tab === 'saved') renderSaved(); if (S.tab === 'me') renderMe(); if (S.tab === 'guide') renderGuide(); }
function refresh() { valMemo.clear(); renderShell(); refreshViews(); if ($('#ov-filters').classList.contains('open')) renderFilters(); }
function go(tab) {
  if (S.tab !== tab) haptic(); S.tab = tab; LS.set('tab', tab);
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + tab));
  document.body.className = document.body.className.replace(/\btab-\w+/g, '').trim() + ' tab-' + tab;
  window.scrollTo({ top: 0, behavior: 'instant' }); refresh();
}
function scrollToResults() { if (innerWidth > 760) $('#toolbar').scrollIntoView({ behavior: 'smooth', block: 'start' }); else $('#active-row').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function quick(k) {
  const bud = { u30: 30, u50: 50, u80: 80, u100: 100 }[k]; if (bud) S.max = S.max === bud ? 200 : bud;
  if (k === 'near') return nearMe();
  if (k === 'top') S.minRating = S.minRating >= 4.3 ? 0 : 4.3;
  if (k === 'best') { S.valueMin = S.valueMin ? 0 : 65; if (S.valueMin) S.sort = 'value'; }
  if (k === 'open') S.openNow = !S.openNow;
  if (k === 'oct') S.octopus = !S.octopus;
  if (k === 'veg') S.veg = !S.veg;
  const mk = { breakfast: 'breakfast', tea: 'tea', late: 'latenight' }[k]; if (mk) S.meal = S.meal === mk ? 'any' : mk;
  if (k === 'mtr') { if (S.mtr != null) S.mtr = null; else if (S.user) { const n = nearestMtr({ id: '_me', lat: S.user[0], lng: S.user[1] }); mtrCache.delete('_me'); S.mtr = n ? n.i : null; } else return openFilters(true); }
  refresh(); scrollToResults();
}
function unchip(k) {
  if (k === 'col') S.col = null; else if (k === 'meal') S.meal = 'any'; else if (k === 'max') S.max = 200;
  else if (k === 'q') { S.q = ''; $('#q').value = ''; $('#hq').value = ''; }
  else if (k === 'min') S.min = 0; else if (k === 'minRating') S.minRating = 0; else if (k === 'valueMin') S.valueMin = 0; else if (k === 'maxKm') S.maxKm = null; else if (k === 'bounds') S.bounds = null;
  else if (k === 'mtr') { S.mtr = null; if (S.sort === 'near' && !S.user) S.sort = 'value'; }
  else if (k.startsWith('cu:')) S.cu.delete(k.slice(3)); else if (k.startsWith('di:')) S.di.delete(k.slice(3));
  else S[k] = false;
  refresh();
}
function resetFilters() { S.cu.clear(); S.di.clear(); S.meal = 'any'; S.max = 200; S.openNow = S.octopus = S.veg = S.delivery = S.dealsOnly = S.noPork = S.noBeef = S.halal = false; S.mtr = null; S.col = null; S.minRating = 0; S.min = 0; S.maxKm = null; S.valueMin = 0; S.bounds = null; S.q = ''; $('#q').value = ''; $('#hq').value = ''; refresh(); }
function toggleSave(id, btn) {
  const s = saved(), i = s.indexOf(id), was = i >= 0;
  if (was) s.splice(i, 1); else s.unshift(id); LS.set('saved', s);
  if (btn) { btn.classList.toggle('on', !was); btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  haptic(was ? 'light' : 'medium'); toast(was ? t('tUnsaved') : t('tSavedT'));
  const before = unlocked(); setTimeout(() => checkBadges(before), 0);
  renderShell(); if (S.tab === 'saved') renderSaved();
}
async function vote(id) { const on = await BE.toggleVote(id); if (on) { addPts(1); toast(t('tVote')); } showDeal(id, true); if (S.tab === 'deals') renderDeals(); }
function ateHere(id, btn) {
  const p = byId(id); if (!p) return; const before = unlocked();
  const h = diary(); h.unshift({ id, name: p.name, cu: p.cu, area: p.area, d: p.d, meal: p.meal, saved: isDeal(p) ? p.orig - p.price : 0, ts: Date.now() }); LS.set('ate', h.slice(0, 300));
  const pts = 10 + Math.round((isDeal(p) ? p.orig - p.price : 0) / 5); addPts(pts);
  const r = btn.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top);
  haptic('success'); toast(t('tAte', pts)); checkBadges(before); checkChallenge(); showDeal(id, true);
}
function checkBadges(before) { unlocked().filter(k => !before.includes(k)).forEach((k, i) => setTimeout(() => { toast(t('tBadge', t('b_' + k)[0])); confetti(innerWidth / 2, innerHeight / 3); }, 700 + i * 900)); }
function resetData() { if (!confirm(t('confirmReset'))) return; ['saved', 'ate', 'pts', 'clicks', 'shared', 'myrv'].forEach(k => { try { localStorage.removeItem('hkce3_' + k); } catch {} }); refresh(); }
function nearMe() {
  if (S.user) { S.user = null; if (S.sort === 'near') S.sort = 'value'; if (meMarker) { meMarker.remove(); meMarker = null; } refresh(); return; }
  $('#near-btn').innerHTML = `${ICON.pin}${t('locating')}`;
  const got = pos => { S.user = [pos.coords.latitude, pos.coords.longitude]; S.sort = 'near'; refresh(); scrollToResults();
    if (map && typeof L !== 'undefined') meMarker = L.marker(S.user, { icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [18, 18] }) }).addTo(map); };
  const fail = () => { toast(t('tGeo')); refresh(); };
  const g = plug('Geolocation');
  if (g) { g.requestPermissions().catch(() => {}).finally(() => g.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000 }).then(got).catch(fail)); return; }
  if (!navigator.geolocation) return fail();
  navigator.geolocation.getCurrentPosition(got, fail, { timeout: 9000 });
}

/* ═════════════ FILTERS DRAWER ═════════════ */
function openFilters(toMtr) { renderFilters(); openOv('ov-filters'); if (toMtr === true) setTimeout(() => { $('#mtr-sel')?.scrollIntoView({ block: 'center' }); $('#mtr-sel')?.focus(); }, 350); }
function renderFilters() {
  const a = all(), cnt = {}; a.forEach(p => cnt[p.d] = (cnt[p.d] || 0) + 1);
  const regions = ['hk', 'kln', 'nt'].map(r => { const ds = Object.keys(DIST).filter(k => DIST[k].r === r); return `<div class="f-reg">${t('reg_' + r)}</div><div class="f-chips">${ds.map(k => `<button class="f-chip ${S.di.has(k) ? 'on' : ''}" data-di="${k}">${esc(tri(DIST[k]))}<small>${cnt[k] || 0}</small></button>`).join('')}</div>`; }).join('');
  const pc = ((S.max - 20) / 180) * 100;
  const tg = (k, l, s) => `<label class="tog"><span>${l}<small>${s}</small></span><span class="sw"><input type="checkbox" data-tog="${k}" ${S[k] ? 'checked' : ''}><i></i></span></label>`;
  $('#filters-in').innerHTML = `<button class="x" data-close="ov-filters" aria-label="Close">${ICON.x}</button>
  <div class="f-h"><h2>${t('fTitle')}</h2></div>
  <div class="f-sec"><h4>${t('fBudget')}<b id="max-lbl">${S.max >= 200 ? '∞' : '$' + S.max}</b></h4><input type="range" id="max-range" min="20" max="200" step="5" value="${S.max}" style="--p:${pc}%"><div class="range-l"><span>$20</span><span>$100</span><span>$200+</span></div></div>
  <div class="f-sec"><h4>${t('fPrice')}</h4><div class="frow"><div class="fg"><label for="f-min">${t('fMin')}</label><input id="f-min" type="number" min="0" max="500" inputmode="numeric" value="${S.min || ''}" placeholder="0"></div><div class="fg"><label for="f-max">${t('fMaxP')}</label><input id="f-max" type="number" min="0" max="500" inputmode="numeric" value="${S.max < 200 ? S.max : ''}" placeholder="∞"></div></div></div>
  <div class="f-sec"><h4>${t('fRating')}</h4><div class="f-chips">${[[0, t('any')], [3, '3+'], [4, '4+'], [4.5, '4.5+']].map(([v, l]) => `<button class="f-chip ${S.minRating === v ? 'on' : ''}" data-minrating="${v}">${v ? '★ ' : ''}${l}</button>`).join('')}</div></div>
  <div class="f-sec"><h4>${t('fDistance')}</h4>${S.user ? `<div class="f-chips">${[['', t('any')], [.5, '500 m'], [1, '1 km'], [3, '3 km'], [5, '5 km']].map(([v, l]) => `<button class="f-chip ${S.maxKm === (v === '' ? null : v) ? 'on' : ''}" data-km="${v}">${l}</button>`).join('')}</div>` : `<p class="muted small" style="margin-bottom:10px">${t('fDistNeed')}</p><button class="btn btn-ghost" data-act="near">${ICON.pin}${t('near')}</button>`}</div>
  <div class="f-sec"><h4>${t('fMeal')}</h4><div class="f-chips">${['any', 'breakfast', 'lunch', 'tea', 'dinner', 'latenight'].map(m => `<button class="f-chip ${S.meal === m ? 'on' : ''}" data-meal="${m}">${t('meal_' + m)}</button>`).join('')}</div></div>
  <div class="f-sec"><h4>${t('fMust')}</h4>${tg('openNow', t('q_open'), t('fOpenSub'))}${tg('dealsOnly', t('fDealsOnly'), t('fDealsOnlySub'))}${tg('octopus', t('q_oct'), t('fOctSub'))}${tg('veg', t('q_veg'), t('fVegSub'))}${tg('delivery', t('delivery'), t('fDelSub'))}</div>
  <div class="f-sec"><h4>${t('fMtr')}</h4><div class="fg" style="margin:0"><select id="mtr-sel" aria-label="${t('fMtr')}"><option value="">${t('fMtrAny')}</option>${MTR.map((st, i) => [i, stName(i)]).sort((a, b) => a[1].localeCompare(b[1], locale())).map(([i, n]) => `<option value="${i}" ${S.mtr === i ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div><p class="muted" style="margin-top:8px;font-size:12px">${t('fMtrSub')}</p></div>
  <div class="f-sec"><h4>${t('fDiet')}</h4>${tg('noPork', t('fNoPork'), t('fDietSub'))}${tg('noBeef', t('fNoBeef'), t('fDietSub'))}${tg('halal', t('fHalal'), t('fHalalSub'))}</div>
  <div class="f-sec" style="border:0"><h4>${t('fDist')}</h4>${regions}</div>
  <div class="f-foot"><button class="btn btn-ghost" data-act="reset">${t('fReset')}</button><button class="btn btn-ink" data-close="ov-filters">${t('fShow', filtered().length)}</button></div>`;
  const rg = $('#max-range');
  rg.addEventListener('input', () => { S.max = +rg.value; rg.style.setProperty('--p', ((rg.value - 20) / 180 * 100) + '%'); $('#max-lbl').textContent = rg.value >= 200 ? '∞' : '$' + rg.value; });
  rg.addEventListener('change', refresh);
  const pmin = $('#f-min'), pmax = $('#f-max');
  pmin.addEventListener('change', () => { S.min = Math.max(0, +pmin.value || 0); refresh(); });
  pmax.addEventListener('change', () => { const v = +pmax.value || 0; S.max = v > 0 ? Math.min(200, v) : 200; refresh(); });
  $('#mtr-sel').addEventListener('change', e => { S.mtr = e.target.value === '' ? null : +e.target.value; if (S.mtr == null && S.sort === 'near' && !S.user) S.sort = 'value'; refresh(); });
}

/* ═════════════ SPIN ═════════════ */
let spinning = false;
function openSpin() {
  const pool = filtered().length ? filtered() : all();
  $('#spin-in').innerHTML = `<button class="x" data-close="ov-spin" aria-label="Close">${ICON.x}</button><div class="spin-in"><h2>${t('spinT')}</h2><p>${t('spinP', pool.length)}</p>
    <div class="reel" id="reel"><span>?</span></div><div class="spin-name" id="spin-name">&nbsp;</div><div class="spin-sub" id="spin-sub">&nbsp;</div>
    <div class="spin-acts"><button class="btn btn-ghost" data-act="respin">${ICON.dice}${t('again')}</button><button class="btn btn-red" id="spin-go" disabled>${t('go')}${ICON.arrow}</button></div></div>`;
  openOv('ov-spin'); setTimeout(runSpin, 250);
}
function runSpin() {
  if (spinning) return; spinning = true;
  const pool = filtered().length ? filtered() : all(), pick = pool[Math.floor(Math.random() * pool.length)];
  const reel = $('#reel'), n = $('#spin-name'), s = $('#spin-sub'), g = $('#spin-go'); g.disabled = true; reel.classList.remove('landed');
  const steps = 20 + Math.floor(Math.random() * 6); let i = 0;
  const show = p => { const c = CU[p.cu]; reel.style.setProperty('--c1', c.c1); reel.style.setProperty('--c2', c.c2); reel.innerHTML = `<span>${c.g}</span>`; reel.classList.remove('bump'); void reel.offsetWidth; reel.classList.add('bump'); n.textContent = nm(p); s.textContent = `${areaName(p.area)} · $${p.price}`; };
  (function tick() {
    const p = i >= steps ? pick : pool[Math.floor(Math.random() * pool.length)]; show(p); if (i % 2 === 0) haptic(); i++;
    if (i <= steps) setTimeout(tick, 45 + Math.pow(i / steps, 3) * 380);
    else { spinning = false; haptic('success'); reel.classList.add('landed'); s.textContent = `${of(pick)} · ${areaName(pick.area)} · $${pick.price}`; g.disabled = false; g.onclick = () => { closeOv('ov-spin'); openDeal(pick.id); }; const r = reel.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, 26); }
  })();
}

/* ═════════════ SHARE A DEAL ═════════════ */
let draft = null;
function openSubmit() {
  const opt = (o, sel) => o.map(([v, l]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const v = k => esc(draft?.[k] ?? '');
  $('#submit-in').innerHTML = `<button class="x" data-close="ov-submit" aria-label="Close">${ICON.x}</button><div class="form-in" id="sub-step"><h2>${t('subT')}</h2><p>${t('subP')}</p>
    <div class="frow"><div class="fg"><label for="f-ne">${t('lNe')}</label><input id="f-ne" maxlength="80" value="${v('name_en')}" placeholder="Yat Lok Roast Goose"></div><div class="fg"><label for="f-nz">${t('lNz')}</label><input id="f-nz" maxlength="80" value="${v('name_zh')}" placeholder="一樂燒鵝"></div></div>
    <div class="frow"><div class="fg"><label for="f-cu">${t('lCu')}</label><select id="f-cu">${opt(Object.keys(CU).map(k => [k, cun(k)]), draft?.cuisine)}</select></div><div class="fg"><label for="f-di">${t('lDi')}</label><select id="f-di">${opt(Object.keys(AREAS).map(k => [k, `${areaName(k)} · ${tri(DIST[AREAS[k].d])}`]), draft?.area)}</select></div></div>
    <div class="fg"><label for="f-oe">${t('lOe')}</label><textarea id="f-oe" maxlength="200" placeholder="Roast goose rice + soup">${v('offer_en')}</textarea></div>
    <div class="fg"><label for="f-oz">${t('lOz')}</label><textarea id="f-oz" maxlength="200" placeholder="燒鵝飯 + 例湯">${v('offer_zh')}</textarea></div>
    <div class="frow"><div class="fg"><label for="f-pr">${t('lPr')}</label><input id="f-pr" type="number" min="1" max="2000" inputmode="numeric" value="${v('price')}" placeholder="48"></div><div class="fg"><label for="f-or">${t('lOr')}</label><input id="f-or" type="number" min="1" max="5000" inputmode="numeric" value="${v('orig')}" placeholder="68"></div></div>
    <div class="frow"><div class="fg"><label for="f-meal">${t('lMeal')}</label><select id="f-meal">${opt(['breakfast', 'lunch', 'tea', 'dinner', 'latenight'].map(m => [m, t('meal_' + m)]), draft?.meal)}</select></div><div class="fg"><label for="f-ex">${t('lEx')}</label><input id="f-ex" type="date" value="${v('expires_on')}"></div></div>
    <label class="chk"><input type="checkbox" id="f-del" ${draft?.delivery ? 'checked' : ''}> ${t('lDel')}</label>
    <button class="btn btn-ink btn-lg btn-block" data-act="previewSub">${t('preview')}${ICON.arrow}</button></div>`;
  openOv('ov-submit');
}
function previewSub() {
  const g = id => $('#' + id).value.trim();
  const price = parseInt(g('f-pr')), orig = parseInt(g('f-or'));
  draft = { name_en: g('f-ne'), name_zh: g('f-nz'), cuisine: g('f-cu'), area: g('f-di'), meal: g('f-meal'), offer_en: g('f-oe'), offer_zh: g('f-oz'),
    price, orig: orig > price ? orig : null, delivery: $('#f-del').checked, expires_on: g('f-ex') || null };
  if ((!draft.name_en && !draft.name_zh) || (!draft.offer_en && !draft.offer_zh) || !(price > 0)) { toast(t('fill')); return; }
  if (!draft.name_en) draft.name_en = draft.name_zh;
  const prev = fromCommunity({ ...draft, id: 'preview' });
  $('#sub-step').innerHTML = `<h2>${t('preview')}</h2><p>${t('subP')}</p><div class="prev-wrap">${card(prev, 0)}</div>
    <div class="spin-acts"><button class="btn btn-ghost" data-act="editSub">${t('edit')}</button><button class="btn btn-red" id="post-btn" data-act="postSub">${ICON.check}${t('post')}</button></div>`;
}
async function postSub() {
  if (!draft) return; const before = unlocked(), btn = $('#post-btn'); btn.disabled = true;
  try {
    const row = await BE.shareDeal(draft);
    S.community.unshift(row); LS.set('shared', LS.get('shared', 0) + 1); addPts(25); draft = null;
    $('#sub-step').innerHTML = `<div class="ok"><div class="empty-g">謝</div><h3>${t('subOkT')}</h3><p>${t('subOkP')}</p></div>`;
    haptic('success'); confetti(innerWidth / 2, innerHeight / 2, 60); checkBadges(before);
    setTimeout(() => { closeOv('ov-submit'); refresh(); }, 2000);
  } catch (e) { btn.disabled = false; toast(/rate limit/i.test(e.message || '') ? t('rvRate') : t('tErr')); }
}

/* ═════════════ REPORT ═════════════ */
let rpt = null;
function openReport(kind, id) {
  rpt = { kind, id, reason: null };
  const reasons = kind === 'review' ? t('rvReasons') : t('reasons'), p = kind === 'place' ? byId(id) : null;
  $('#report-in').innerHTML = `<button class="x" data-close="ov-report" aria-label="Close">${ICON.x}</button><div class="form-in"><h2>${t('rptT')}</h2><p>${p ? esc(nm(p)) + ' · ' : ''}${t('rptP')}</p>
    <div class="reasons">${reasons.map((r, i) => `<button class="f-chip" data-reason="${i}">${r}</button>`).join('')}</div>
    <div class="fg"><label for="r-note">${t('rptNote')}</label><textarea id="r-note" maxlength="500"></textarea></div>
    <button class="btn btn-ink btn-lg btn-block" data-act="sendReport">${t('rptSend')}</button></div>`;
  openOv('ov-report');
}
async function sendReport() {
  if (rpt.reason == null) { toast(t('pickReason')); return; }
  try {
    await BE.report({ placeId: rpt.kind === 'place' ? rpt.id : null, reviewId: rpt.kind === 'review' ? rpt.id : null, reason: rpt.reason, note: $('#r-note').value.slice(0, 500) });
    addPts(5); closeOv('ov-report'); toast(t('tRpt'));
  } catch { toast(t('tErr')); }
}

/* ═════════════ OVERLAYS / TOAST / FX ═════════════ */
const ovStack = [];
function openOv(id) { const el = $('#' + id); if (!el.classList.contains('open')) { el.classList.add('open'); ovStack.push(id); document.body.style.overflow = 'hidden'; } }
function closeOv(id) { const el = $('#' + id); el.classList.remove('open'); const i = ovStack.indexOf(id); if (i >= 0) ovStack.splice(i, 1); if (!ovStack.length) document.body.style.overflow = '';
  if (id === 'ov-deal') { currentDeal = null; if (location.hash.startsWith('#deal/')) history.replaceState(null, '', location.pathname + location.search); }
  if (id === 'ov-group') { clearInterval(grpTimer); grpCode = null; if (location.hash.startsWith('#group/')) history.replaceState(null, '', location.pathname + location.search); } }
function toast(html) { const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = html; $('#toasts').appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2600); }
function confetti(x, y, n = 34) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti'; const cols = ['#D7392A', '#E3A02F', '#17795A', '#F6B2CB', '#2D4C9E', '#fff'];
  for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = cols[i % cols.length];
    p.style.setProperty('--x', (Math.random() - .5) * 420 + 'px'); p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); p.style.setProperty('--d', (1.1 + Math.random() * 1.2) + 's'); box.appendChild(p); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
}
function toggleTheme() { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; LS.set('theme', document.documentElement.dataset.theme); $('#theme-btn').innerHTML = isDark() ? ICON.sun : ICON.moon; setTiles(); syncStatusBar(); haptic(); }

/* ═════════════ EVENTS (one delegated listener) ═════════════ */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-save],[data-open],[data-go],[data-act],[data-cu],[data-col],[data-quick],[data-unchip],[data-di],[data-meal],[data-close],[data-ate],[data-vote],[data-report],[data-rptrv],[data-delrv],[data-review],[data-sharedeal],[data-pinmap],[data-pin],[data-star],[data-reason],[data-gl],[data-say],[data-zoom],[data-track],[data-l],[data-menu],[data-gvote],[data-cat],[data-rail],[data-mapmax],[data-minrating],[data-km],[data-sug],[data-fbud],[data-fwalk]');
  if (!el) { if (e.target.classList.contains('ov-bg')) { const id = e.target.parentElement.id; id === 'ov-deal' ? closeDeal() : closeOv(id); } return; }
  const d = el.dataset;
  if (d.save) { e.stopPropagation(); toggleSave(d.save, d.refresh ? null : el); if (d.refresh) showDeal(d.save, true); return; }
  if (d.l) { S.lang = d.l; LS.set('lang', S.lang); refresh(); if (currentDeal) showDeal(currentDeal, true); return; }
  if (d.open) return openDeal(d.open);
  if (d.go) { e.preventDefault(); if (ovStack.length) ovStack.slice().forEach(id => id === 'ov-deal' ? closeDeal() : closeOv(id)); return go(d.go); }
  if (d.cu !== undefined) { if (!d.cu) S.cu.clear(); else S.cu.has(d.cu) ? S.cu.delete(d.cu) : S.cu.add(d.cu); return refresh(); }
  if (d.col) { S.col = S.col === d.col ? null : d.col; refresh(); return scrollToResults(); }
  if (d.quick) return quick(d.quick);
  if (d.unchip) return unchip(d.unchip);
  if (d.di) { S.di.has(d.di) ? S.di.delete(d.di) : S.di.add(d.di); return refresh(); }
  if (d.meal) { S.meal = d.meal; return refresh(); }
  if (d.close) return closeOv(d.close);
  if (d.ate) return ateHere(d.ate, el);
  if (d.vote) return vote(d.vote);
  if (d.report) return openReport('place', d.report);
  if (d.rptrv) return openReport('review', d.rptrv);
  if (d.delrv) return deleteReview(d.delrv);
  if (d.review) return openReview(d.review);
  if (d.sharedeal) return shareDeal(d.sharedeal);
  if (d.pinmap) { const id = d.pinmap; closeDeal(); go('map'); return setTimeout(() => focusPin(id), 350); }
  if (d.pin) return focusPin(d.pin);
  if (d.star) { rvState.rating = +d.star; document.querySelectorAll('#star-pick button').forEach(b => b.classList.toggle('on', +b.dataset.star <= rvState.rating)); haptic(); return; }
  if (d.reason) { rpt.reason = +d.reason; el.parentElement.querySelectorAll('.f-chip').forEach(b => b.classList.toggle('on', b === el)); return; }
  if (d.gl) { glTab = d.gl; return renderGuide(); }
  if (d.say) return say(d.say);
  if (d.zoom) { const lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = `<img src="${esc(d.zoom)}" alt="">`; lb.onclick = () => lb.remove(); document.body.appendChild(lb); return; }
  if (d.track) { LS.set('clicks', LS.get('clicks', 0) + 1); return; }
  if (d.menu) return openMenu(d.menu);
  if (d.cat) { const k = d.cat; S.cu.clear(); S.cu.add(k); refresh(); return scrollToResults(); }
  if (d.rail) { const r = RAILS.find(x => x[0] === d.rail); if (r) { resetFilters(); r[2](); refresh(); scrollToResults(); } return; }
  if (d.mapmax) { S.max = +d.mapmax; mapFitted = true; return refresh(); }
  if (d.minrating !== undefined) { S.minRating = +d.minrating; return refresh(); }
  if (d.km !== undefined) { S.maxKm = d.km === '' ? null : +d.km; return refresh(); }
  if (d.sug !== undefined) return pickSuggestion(+d.sug);
  if (d.fbud) { finder.max = +d.fbud; return renderFinder(); }
  if (d.fwalk) { finder.walk = +d.fwalk; return renderFinder(); }
  if (d.gvote) return groupVote(d.gvote);
  const A = { spin: openSpin, respin: runSpin, reset: resetFilters, resetData, closeDeal, previewSub, postSub, editSub: openSubmit, sendReport, filters: openFilters, share: openSubmit, near: nearMe, theme: toggleTheme, guide: () => go('guide'),
    auth: () => openAuth(), authGuest, authSend, authVerify, authBack, authGoogle: () => BE.signInWith('google').catch(() => toast(t('tErr'))), signOut,
    newGroup, grpShare, grpCopy, closeGroup, install, lbJoin, finder: openFinder, findGo: runFinder, areaSearch,
    searchNav: () => { go('deals'); setTimeout(() => { $('#hq').focus(); $('#hq').scrollIntoView({ block: 'center' }); }, 80); }, lbEdit: () => loadLeaderboard(true) };
  if (A[d.act]) A[d.act]();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches?.('.card')) { openDeal(e.target.dataset.open); return; }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#q').focus(); }
  if (e.key === 'Escape') { const lb = $('.lightbox'); if (lb) return lb.remove(); const top = ovStack[ovStack.length - 1]; if (top === 'ov-deal') closeDeal(); else if (top) closeOv(top); }
});
let qT;
const onSearch = e => { showSug(e.target); clearTimeout(qT); qT = setTimeout(() => { S.q = e.target.value; if (e.target.id === 'q') $('#hq').value = S.q; else $('#q').value = S.q; if (S.tab !== 'deals' && S.tab !== 'map') go('deals'); else refresh(); }, 140); };
$('#q').addEventListener('input', onSearch); $('#hq').addEventListener('input', onSearch);
$('#hq').addEventListener('keydown', e => { if (e.key === 'Enter') { pushHist(e.target.value); hideSug(); e.target.blur(); scrollToResults(); } if (e.key === 'Escape') hideSug(); });
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter') { pushHist(e.target.value); hideSug(); } if (e.key === 'Escape') hideSug(); });
['#hq', '#q'].forEach(sel => { $(sel).addEventListener('focus', e => showSug(e.target)); $(sel).addEventListener('blur', () => setTimeout(hideSug, 180)); });
$('#sort').addEventListener('change', e => { S.sort = e.target.value; refresh(); });
document.addEventListener('change', e => { const k = e.target.dataset?.tog; if (k) { S[k] = e.target.checked; refresh(); } });
window.addEventListener('hashchange', () => { const g = location.hash.match(/^#group\/([A-Z0-9]{6})$/i); if (g) return openGroup(g[1].toUpperCase()); const m = location.hash.match(/^#deal\/(.+)$/); if (m) showDeal(decodeURIComponent(m[1])); else if (currentDeal) hideDeal(); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!document.documentElement.dataset.theme) { setTiles(); renderShell(); } });
setInterval(() => { if (ovStack.length) return; document.body.classList.add('quiet'); refreshViews(); setTimeout(() => document.body.classList.remove('quiet'), 50); }, 60000);
$('#theme-btn').addEventListener('click', toggleTheme);
$('#share-btn').addEventListener('click', openSubmit);
$('#filter-btn').addEventListener('click', openFilters);
$('#spin-btn').addEventListener('click', openSpin);
$('#near-btn').addEventListener('click', nearMe);
$('#promo').addEventListener('click', () => go('guide'));
$('#auth-btn')?.addEventListener('click', () => BE.signedIn ? go('me') : openAuth());

/* ═════════════ INIT ═════════════ */
(async function init() {
  const th = LS.get('theme', null); if (th) document.documentElement.dataset.theme = th;
  if (!TABS.some(x => x[0] === S.tab)) S.tab = 'deals';
  go(S.tab); syncStatusBar();
  const m = location.hash.match(/^#deal\/(.+)$/); if (m) setTimeout(() => showDeal(decodeURIComponent(m[1])), 100);
  await BE.init();
  lastAuth = BE.userId + (BE.signedIn ? '+' : '');
  BE.on(ev => { if (ev === 'user') onUserChange(); });
  await Promise.all([BE.loadStats(), BE.loadCovers()]);
  S.community = await BE.communityDeals();
  if (BE.signedIn) await syncDown();
  const deep = /^#(deal|group)\//.test(location.hash);
  const g = location.hash.match(/^#group\/([A-Z0-9]{6})$/i); if (g) openGroup(g[1].toUpperCase());
  if (AUTH_ON() && BE.online && !BE.signedIn && !LS.get('welcomed', false) && !deep) setTimeout(() => openAuth(true), 900);
  document.body.classList.add('quiet'); refresh(); setTimeout(() => document.body.classList.remove('quiet'), 50);
  if (currentDeal) showDeal(currentDeal, true);
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
})();
})();
