/* ═══════════════════════════════════════════════════════════
   HK Cheap Eats — settings you can change
   ═══════════════════════════════════════════════════════════ */
window.HKCE_CONFIG = {
  // Supabase (Project Settings → API). The "anon / publishable" key is safe to ship in an app.
  // NEVER put the service_role / secret key here.
  // Leave both empty to run in offline mode (everything stays on this device).
  supabaseUrl: 'https://tslsyfmnyhzhqhskqxfn.supabase.co',
  supabaseAnonKey: 'sb_publishable_DMyCAH3lUJZD0-uwiLIVsg_7X7j7dsM',

  // Public web address of the site, used in shared links. Leave '' until it's live.
  publicUrl: 'https://hk-cheapeats.github.io/',

  // Email sign-in. Off until a custom email sender (SMTP) is set up in Supabase, because Supabase's
  // built-in sender only emails the project owner. Set to true to show the Sign in button and welcome screen.
  signIn: false,

  // Sign-in methods besides email. Add 'google' after setting up Google in Supabase → Authentication → Providers.
  authProviders: [],

  // Cloudflare Turnstile site key (anti-bot). Leave '' to turn it off. The secret key goes in
  // Supabase → Authentication → Attack Protection, never here.
  turnstileSiteKey: '',

  // Foodpanda affiliate (add your own tracking parameters)
  affiliate: {
    foodpanda: 'https://www.foodpanda.hk/',
    utm: 'utm_source=hkcheapeats&utm_medium=affiliate&utm_campaign=',
    rate: 0.06,
    avgOrder: 120
  }
};
