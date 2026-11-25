/* ═══════════════════════════════════════════════════════════
   HK Cheap Eats Value Score (0–100). Full explanation: docs/VALUE_SCORE.md
   Used by the app (browser) and by scripts/build-pages.mjs (Node).

   Component          weight  source
   Food quality         40%   editors' rating, blended with community ratings (Bayesian)
   Price affordability  25%   price vs the median price of the same cuisine
   Portion size         15%   NOT SCORED: no portion data yet (weight is left out)
   Customer satisfaction 15%  community reviews only, confidence-adjusted; left out if none
   Location convenience  5%   walking time to the nearest MTR station

   Missing components are left out and the remaining weights are rescaled,
   so a place is never given points for data that does not exist.
   ═══════════════════════════════════════════════════════════ */
(function (root) {
  const W = { quality: 40, price: 25, portion: 15, satisfaction: 15, location: 5 };
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const toPct = r => clamp((r - 3) / 2 * 100); // rating 3.0 → 0, 5.0 → 100
  const LABELS = [[85, 'exceptional'], [75, 'great'], [65, 'good'], [50, 'average'], [0, 'poor']];

  function medians(places) {
    const by = {};
    places.forEach(p => (by[p.cu] = by[p.cu] || []).push(p.price));
    const out = {};
    for (const [k, a] of Object.entries(by)) { a.sort((x, y) => x - y); const m = a.length >> 1; out[k] = a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
    return out;
  }

  /* p: place; ctx: { median: {cuisine: price}, stat: {reviews, avg}, walkMin: number|null } */
  function score(p, ctx) {
    const st = ctx.stat || { reviews: 0, avg: null }, parts = {};
    // Food quality: editors' rating is the prior, worth 5 reviews; community ratings pull it toward their average.
    if (p.rating || st.reviews) {
      const m = 5, prior = p.rating || 3.8, n = st.reviews || 0, avg = st.avg || prior;
      parts.quality = toPct((m * prior + n * avg) / (m + n));
    }
    // Affordability: half the cuisine median → 100, the median → 60, 1.75× the median → 0. Real discounts add up to 10.
    const med = ctx.median?.[p.cu];
    if (med) {
      const ratio = p.price / med, disc = p.orig && p.orig > p.price ? (p.orig - p.price) / p.orig : 0;
      parts.price = clamp(100 - (ratio - 0.5) * 80 + disc * 30);
    }
    // Customer satisfaction: only from community reviews, shrunk toward 3.8 with 3 virtual reviews.
    if (st.reviews > 0 && st.avg != null) parts.satisfaction = toPct((3 * 3.8 + st.reviews * st.avg) / (3 + st.reviews));
    // Location: ≤3 min from an MTR station → 100, 20+ min → 0.
    if (ctx.walkMin != null) parts.location = clamp(100 - (ctx.walkMin - 3) / 17 * 100);
    let sum = 0, wsum = 0;
    for (const [k, v] of Object.entries(parts)) { sum += v * W[k]; wsum += W[k]; }
    if (!wsum || parts.quality == null) return null;
    const total = Math.round(sum / wsum);
    return { total, label: LABELS.find(([t]) => total >= t)[1], parts, weights: W, reviews: st.reviews || 0,
      basis: st.reviews ? 'community' : 'editors' };
  }
  const api = { score, medians, WEIGHTS: W, LABELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HKCE_VALUE = api;
})(typeof window !== 'undefined' ? window : globalThis);
