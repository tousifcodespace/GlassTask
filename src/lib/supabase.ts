import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them to a .env file at the project root (see .env.example) and restart the dev server.",
  );
}

// `app.json` sets web.output to "static", so expo-router pre-renders pages
// on a Node.js server (no browser, no `window`/`localStorage`). The
// Supabase client kicks off session recovery as soon as it's constructed,
// which calls into AsyncStorage — and AsyncStorage's web implementation
// reads `window.localStorage` under the hood, crashing the SSR pass with
// "ReferenceError: window is not defined". Swap in a no-op storage there;
// the client hydrates with the real AsyncStorage once it runs in an actual
// browser or the native app.
const isServer = typeof window === "undefined";

const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isServer ? noopStorage : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    // Needed on web so that landing on /reset-password with
    // #access_token=...&type=recovery in the URL (from the password-reset
    // email) automatically establishes a session. Safe on native too: with
    // no URL hash to parse there, this is effectively a no-op.
    detectSessionInUrl: !isServer,
  },
});