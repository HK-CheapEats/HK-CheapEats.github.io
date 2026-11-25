/* ═══════════════════════════════════════════════════════════
   Community backend: Supabase when configured, this device otherwise.
   Every method works in both modes, so the UI never has to care.
   ═══════════════════════════════════════════════════════════ */
(function () {
  const cfg = window.HKCE_CONFIG || {};
  const LSK = 'hkce3_';
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(LSK + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(LSK + k, JSON.stringify(v)); return true; } catch { return false; } }
  };
  const BUCKET = 'review-photos';

  const BE = {
    mode: 'local',          // 'local' | 'online'
    userId: null,
    user: null,
    email: null,
    error: null,
    _sb: null,
    _stats: new Map(),
    _votes: new Set(ls.get('votes', [])),

    async init() {
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return this;
      try {
        this._sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, storageKey: 'hkce-auth', detectSessionInUrl: true }
        });
        let { data: { session } } = await this._sb.auth.getSession();
        if (!session) {
          const captchaToken = await this.captcha();
          const { data, error } = await this._sb.auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
          if (error) throw error;
          session = data.session;
        }
        this._setUser(session.user);
        this.mode = 'online';
        this._sb.auth.onAuthStateChange((ev, sess) => {
          if (sess?.user && sess.user.id !== this.userId) { this._setUser(sess.user); this._emit('user'); }
          else if (sess?.user && ev === 'USER_UPDATED') { this._setUser(sess.user); this._emit('user'); }
        });
        const { data: mine } = await this._sb.from('votes').select('place_id');
        this._votes = new Set((mine || []).map(r => r.place_id));
      } catch (e) {
        console.warn('[backend] offline mode:', e.message || e);
        this.error = e.message || String(e);
        this.mode = 'local';
      }
      return this;
    },
    _setUser(u) { this.userId = u.id; this.user = u; this.email = u.is_anonymous ? null : (u.email || u.new_email || null); },
    get signedIn() { return !!(this.online && this.user && !this.user.is_anonymous && this.user.email); },
    _subs: [], on(fn) { this._subs.push(fn); }, _emit(ev) { this._subs.forEach(f => { try { f(ev); } catch (e) { console.warn(e); } }); },

    /* ── anti-bot check (Cloudflare Turnstile), only when a site key is configured ── */
    captcha() {
      const key = cfg.turnstileSiteKey; if (!key) return Promise.resolve(null);
      return new Promise(res => {
        const run = () => {
          let box = document.getElementById('ts-box'); if (!box) { box = document.createElement('div'); box.id = 'ts-box'; box.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:900'; document.body.appendChild(box); }
          window.turnstile.render(box, { sitekey: key, appearance: 'interaction-only', callback: tok => { res(tok); setTimeout(() => box.remove(), 400); }, 'error-callback': () => { res(null); box.remove(); } });
        };
        if (window.turnstile) return run();
        const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = run; s.onerror = () => res(null); document.head.appendChild(s);
        setTimeout(() => res(null), 15000);
      });
    },

    /* ── sign in with email: a 6-digit code (or the link in the same email) ── */
    async sendCode(email) {
      if (!this.online) throw new Error('offline');
      const redirect = cfg.publicUrl || location.href.split('#')[0];
      const captchaToken = await this.captcha();
      // A guest keeps their id: attach the email to the current anonymous user.
      if (this.user?.is_anonymous) {
        const { error } = await this._sb.auth.updateUser({ email }, { emailRedirectTo: redirect });
        if (!error) { this._pending = { email, type: 'email_change' }; return 'link'; }
        if (!/already|exists|registered/i.test(error.message || '')) throw error;
      }
      const { error } = await this._sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: redirect, captchaToken: captchaToken || undefined } });
      if (error) throw error;
      this._pending = { email, type: 'email' };
      return 'login';
    },
    async verifyCode(code) {
      const p = this._pending; if (!p) throw new Error('no-pending');
      const { data, error } = await this._sb.auth.verifyOtp({ email: p.email, token: code.trim(), type: p.type });
      if (error) throw error;
      if (data?.user) this._setUser(data.user);
      this._pending = null; this._emit('user');
      return this.user;
    },
    async signInWith(provider) {
      const redirectTo = cfg.publicUrl || location.href.split('#')[0];
      if (this.user?.is_anonymous) { const { error } = await this._sb.auth.linkIdentity({ provider, options: { redirectTo } }); if (!error) return; }
      const { error } = await this._sb.auth.signInWithOAuth({ provider, options: { redirectTo } }); if (error) throw error;
    },
    async signOut() {
      if (!this.online) return;
      await this._sb.auth.signOut();
      const captchaToken = await this.captcha();
      const { data } = await this._sb.auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
      if (data?.user) this._setUser(data.user);
      this._votes = new Set(); ls.set('votes', []);
      this._emit('user');
    },

    /* ── private sync of on-device data ── */
    async pullState() {
      if (!this.signedIn) return null;
      const { data } = await this._sb.from('user_state').select('data,updated_at').eq('user_id', this.userId).maybeSingle();
      return data?.data || null;
    },
    async pushState(obj) {
      if (!this.signedIn) return;
      const { error } = await this._sb.from('user_state').upsert({ user_id: this.userId, data: obj, updated_at: new Date().toISOString() });
      if (error) console.warn('[sync]', error.message);
    },

    /* ── leaderboard ── */
    async myProfile() {
      if (!this.online) return null;
      const { data } = await this._sb.from('profiles').select('*').eq('user_id', this.userId).maybeSingle();
      return data;
    },
    async saveProfile(row) {
      if (!this.online) throw new Error('offline');
      const { error } = await this._sb.from('profiles').upsert({ user_id: this.userId, ...row, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    async leaderboard(week, n = 20) {
      if (!this.online) return [];
      const { data, error } = await this._sb.from('profiles').select('user_id,display_name,week_points').eq('week_key', week).gt('week_points', 0).order('week_points', { ascending: false }).limit(n);
      return error ? [] : data.map(r => ({ ...r, mine: r.user_id === this.userId }));
    },

    /* ── group votes ── */
    async createGroup(placeIds, title) {
      if (!this.online) throw new Error('offline');
      const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let k = 0; k < 4; k++) {
        const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => A[b % A.length]).join('');
        const { error } = await this._sb.from('groups').insert({ code, place_ids: placeIds.slice(0, 8), title: title || null });
        if (!error) return code;
        if (error.code !== '23505') throw error;
      }
      throw new Error('code');
    },
    async group(code) {
      if (!this.online) throw new Error('offline');
      const [{ data: g, error }, { data: v }] = await Promise.all([
        this._sb.from('groups').select('*').eq('code', code).maybeSingle(),
        this._sb.from('group_votes').select('user_id,place_id,voter_name').eq('code', code)]);
      if (error) throw error; if (!g) return null;
      return { ...g, votes: (v || []).map(x => ({ ...x, mine: x.user_id === this.userId })), mine: g.created_by === this.userId };
    },
    async groupVote(code, placeId, name) {
      const { error } = await this._sb.from('group_votes').upsert({ code, user_id: this.userId, place_id: placeId, voter_name: name || null });
      if (error) throw error;
    },

    /* ── newest community photo per place ── */
    _covers: new Map(),
    async loadCovers() {
      if (!this.online) return;
      const { data, error } = await this._sb.rpc('place_covers');
      if (!error && data) this._covers = new Map(data.map(r => [r.place_id, this.photoUrl(r.photo_path)]));
    },
    cover(id) { return this._covers.get(id) || null; },

    get online() { return this.mode === 'online'; },

    /* ── stats: votes, review count, average rating ── */
    async loadStats() {
      if (this.online) {
        const { data, error } = await this._sb.rpc('place_stats');
        if (!error) {
          this._stats = new Map(data.map(r => [r.place_id, { votes: +r.votes, reviews: +r.reviews, avg: r.avg_rating == null ? null : +r.avg_rating }]));
          return this._stats;
        }
      }
      const m = new Map();
      const rv = ls.get('reviews', {});
      for (const id of this._votes) m.set(id, { votes: 1, reviews: 0, avg: null });
      for (const [id, list] of Object.entries(rv)) {
        const s = m.get(id) || { votes: 0, reviews: 0, avg: null };
        s.reviews = list.length;
        s.avg = list.length ? Math.round(list.reduce((a, r) => a + r.rating, 0) / list.length * 100) / 100 : null;
        m.set(id, s);
      }
      this._stats = m;
      return m;
    },
    stat(id) { return this._stats.get(id) || { votes: 0, reviews: 0, avg: null }; },

    /* ── votes ── */
    hasVoted(id) { return this._votes.has(id); },
    async toggleVote(id) {
      const on = !this._votes.has(id);
      const s = this.stat(id);
      if (on) this._votes.add(id); else this._votes.delete(id);
      this._stats.set(id, { ...s, votes: Math.max(0, s.votes + (on ? 1 : -1)) });
      ls.set('votes', [...this._votes]);
      if (this.online) {
        const q = on ? this._sb.from('votes').insert({ place_id: id })
                     : this._sb.from('votes').delete().eq('place_id', id).eq('user_id', this.userId);
        const { error } = await q;
        if (error && error.code !== '23505') { console.warn(error); }
      }
      return on;
    },

    /* ── reviews ── */
    photoUrl(path) {
      if (!path) return null;
      if (path.startsWith('data:')) return path;
      return this._sb ? this._sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
    },
    async reviews(placeId) {
      if (this.online) {
        const { data, error } = await this._sb.from('reviews')
          .select('id,place_id,user_id,display_name,rating,body,photo_path,created_at')
          .eq('place_id', placeId).order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        return data.map(r => ({ ...r, photo: this.photoUrl(r.photo_path), mine: r.user_id === this.userId }));
      }
      return (ls.get('reviews', {})[placeId] || []).map(r => ({ ...r, photo: r.photo_path, mine: true }));
    },
    async addReview({ placeId, name, rating, body, image }) {
      // image: a Blob (already resized) or null
      if (this.online) {
        let photo_path = null;
        if (image) {
          photo_path = `${this.userId}/${placeId}-${Date.now()}.jpg`;
          const up = await this._sb.storage.from(BUCKET).upload(photo_path, image, { contentType: 'image/jpeg', upsert: false });
          if (up.error) throw up.error;
        }
        const { error } = await this._sb.from('reviews').insert({ place_id: placeId, display_name: name, rating, body, photo_path });
        if (error) {
          if (photo_path) await this._sb.storage.from(BUCKET).remove([photo_path]);
          if (error.code === '23505') throw new Error('already-reviewed');
          throw error;
        }
      } else {
        const all = ls.get('reviews', {});
        const list = all[placeId] || [];
        if (list.length) throw new Error('already-reviewed');
        const photo_path = image ? await blobToDataUrl(image) : null;
        list.unshift({ id: 'l' + Date.now(), place_id: placeId, display_name: name, rating, body, photo_path, created_at: new Date().toISOString() });
        all[placeId] = list;
        if (!ls.set('reviews', all)) { delete list[0].photo_path; ls.set('reviews', all); }
      }
      await this.loadStats();
    },
    async deleteReview(review) {
      if (this.online) {
        const { error } = await this._sb.from('reviews').delete().eq('id', review.id);
        if (error) throw error;
        if (review.photo_path) await this._sb.storage.from(BUCKET).remove([review.photo_path]);
      } else {
        const all = ls.get('reviews', {});
        all[review.place_id] = (all[review.place_id] || []).filter(r => r.id !== review.id);
        ls.set('reviews', all);
      }
      await this.loadStats();
    },

    /* ── reports ── */
    async report({ placeId = null, reviewId = null, reason, note = '' }) {
      if (this.online) {
        const { error } = await this._sb.from('reports').insert({ place_id: placeId, review_id: reviewId, reason, note });
        if (error && error.code !== '23505') throw error;
      } else {
        const r = ls.get('reports', []);
        r.push({ placeId, reviewId, reason, note, ts: Date.now() });
        ls.set('reports', r.slice(-200));
      }
    },

    /* ── community deals ── */
    async communityDeals() {
      if (this.online) {
        const { data, error } = await this._sb.from('community_deals').select('*').order('created_at', { ascending: false }).limit(200);
        if (!error) return data.map(r => ({ ...r, mine: r.user_id === this.userId }));
      }
      return ls.get('subs', []);
    },
    async shareDeal(row) {
      if (this.online) {
        const { data, error } = await this._sb.from('community_deals').insert(row).select().single();
        if (error) throw error;
        return { ...data, mine: true };
      }
      const s = ls.get('subs', []);
      const local = { ...row, id: 'l' + Date.now(), created_at: new Date().toISOString(), mine: true };
      s.unshift(local); ls.set('subs', s.slice(0, 50));
      return local;
    }
  };

  function blobToDataUrl(blob) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  }

  window.BE = BE;
})();
