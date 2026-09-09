import type { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import { useProfileStore } from "@/store/profile";

/**
 * Where Supabase should send the user after they click the password-reset
 * link in their email. On web this is just the current site's own
 * /reset-password page. On native there's no browser to land in — this
 * builds an app deep link (e.g. glasstask://reset-password), but actually
 * opening that link into the app additionally requires the same URL to be
 * added to Supabase's Authentication → URL Configuration → Redirect URLs
 * allow list, which is a dashboard step, not something this code can do.
 * Since testing is web-only for now, the web path is what actually matters.
 */
function getResetPasswordRedirectUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/reset-password`;
  }
  return Linking.createURL("reset-password");
}

/**
 * Where Google should send the browser back to after the user approves
 * sign-in. Points at a dedicated /auth-callback screen (rather than
 * straight to "/") so there's a controlled place to wait for
 * detectSessionInUrl to finish parsing the OAuth token before entering the
 * app — see auth-callback.tsx.
 */
function getOAuthRedirectUrl(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/auth-callback`;
  }
  return Linking.createURL("auth-callback");
}

/**
 * Real authentication via Supabase Auth. Sessions are persisted to
 * AsyncStorage by the Supabase client itself (see src/lib/supabase.ts), so
 * this store doesn't need its own zustand `persist` — it just mirrors
 * whatever Supabase reports via getSession() / onAuthStateChange().
 */
type AuthStore = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  isLoading: boolean;
  init: () => void;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true; signedIn: boolean } | { ok: false; error: string }>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithGoogle: () => Promise<{ ok: true } | { ok: false; error: string }>;
  sendPasswordReset: (
    email: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  updatePassword: (
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
};

let initialized = false;

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  hasHydrated: false,
  isLoading: false,

  init: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        hasHydrated: true,
      });
      if (session?.user) {
        useProfileStore.getState().fetchProfile(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
      });
      // Keep the profile store scoped to whoever is actually logged in —
      // without this, switching accounts on the same device/browser would
      // keep showing the previous user's cached name/bio/etc.
      if (session?.user) {
        useProfileStore.getState().fetchProfile(session.user.id);
      } else {
        useProfileStore.getState().clearProfile();
      }
    });
  },

  register: async (fullName, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim() || !normalizedEmail || password.length < 8) {
      return {
        ok: false,
        error: "Fill in every field with a password of at least 8 characters.",
      };
    }

    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    set({ isLoading: false });

    if (error) return { ok: false, error: error.message };

    // When "Confirm email" is off in Supabase, signUp() auto-authenticates
    // and returns a live session immediately — the user is already logged
    // in at this point. When confirmation is required, session is null and
    // the caller should send them to the login screen instead. Sync store
    // state right away rather than waiting on onAuthStateChange, for the
    // same reason login() does — see the race-condition note there.
    const signedIn = !!data.session;
    if (signedIn) {
      set({
        session: data.session,
        user: data.session!.user,
        isAuthenticated: true,
      });
    }

    return { ok: true, signedIn };
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    set({ isLoading: false });

    if (error) return { ok: false, error: error.message };

    // Set isAuthenticated from this call's own result immediately, rather
    // than waiting for the separate onAuthStateChange subscription to fire.
    // That event can land a tick after this promise resolves, and the
    // caller navigates to "/" right after login() returns — if
    // isAuthenticated is still false at that point, _layout's protected
    // route effect sees "not authenticated" on the new segment and bounces
    // straight back to /login before the auth event ever arrives.
    set({
      session: data.session,
      user: data.session?.user ?? null,
      isAuthenticated: !!data.session,
    });

    return { ok: true };
  },

  signInWithGoogle: async () => {
    // On web, signInWithOAuth() navigates the whole browser tab away to
    // Google and back — there's no session to check here, the redirect
    // itself is the result. On native there's no browser tab to hijack;
    // wiring this up properly needs expo-web-browser's auth-session flow
    // plus registering the app's URL scheme in Supabase's redirect allow
    // list, which is a follow-up piece of work, not something to fake here.
    if (Platform.OS !== "web") {
      return {
        ok: false,
        error: "Google sign-in isn't set up for the native app yet.",
      };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getOAuthRedirectUrl() },
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  sendPasswordReset: async (email) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: getResetPasswordRedirectUrl() },
    );
    set({ isLoading: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  updatePassword: async (newPassword) => {
    if (newPassword.length < 8) {
      return {
        ok: false,
        error: "Password must be at least 8 characters.",
      };
    }

    set({ isLoading: true });
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    set({ isLoading: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },
}));
