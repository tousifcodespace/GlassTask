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
type MfaEnrollResult =
  | { ok: true; factorId: string; qrCodeSvg: string; secret: string }
  | { ok: false; error: string };

type MfaVerifyResult = { ok: true } | { ok: false; error: string };

type AuthStore = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  isLoading: boolean;
  /**
   * True once the user is signed in (isAuthenticated) but still needs to
   * pass a TOTP challenge before using the app — i.e. their session is at
   * AAL1 but their account requires AAL2. Distinct from isAuthenticated:
   * a session can exist without yet satisfying MFA.
   */
  mfaRequired: boolean;
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
  /** Re-checks whether the current session still needs an MFA challenge and updates `mfaRequired`. */
  refreshMfaStatus: () => Promise<void>;
  /** True if the account has at least one verified TOTP factor. */
  hasMfaEnrolled: () => Promise<boolean>;
  /** Starts enrolling a new TOTP factor — returns a QR code (SVG) and manual-entry secret. */
  enrollMfa: () => Promise<MfaEnrollResult>;
  /** Verifies a 6-digit code against a factor that was just enrolled, completing setup. */
  confirmMfaEnrollment: (
    factorId: string,
    code: string,
  ) => Promise<MfaVerifyResult>;
  /** Verifies a 6-digit code during login, satisfying the AAL2 requirement. */
  verifyMfaChallenge: (code: string) => Promise<MfaVerifyResult>;
  /** Removes 2FA from the account entirely. */
  disableMfa: () => Promise<MfaVerifyResult>;
};

let initialized = false;

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  hasHydrated: false,
  isLoading: false,
  mfaRequired: false,

  init: () => {
    if (initialized) return;
    initialized = true;

    const syncMfaStatus = async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      set({ mfaRequired: !!data && data.currentLevel !== data.nextLevel });
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        hasHydrated: true,
      });
      if (session?.user) {
        useProfileStore.getState().fetchProfile(session.user.id);
        await syncMfaStatus();
      }
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
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
        await syncMfaStatus();
      } else {
        useProfileStore.getState().clearProfile();
        set({ mfaRequired: false });
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
      await get().refreshMfaStatus();
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

    if (data.session) {
      await get().refreshMfaStatus();
    }

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

  refreshMfaStatus: async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    set({ mfaRequired: !!data && data.currentLevel !== data.nextLevel });
  },

  hasMfaEnrolled: async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) return false;
    return data.totp.some((f) => f.status === "verified");
  },

  enrollMfa: async () => {
    // Supabase only allows one *unverified* TOTP factor to exist at a
    // time — if a previous enrollment attempt was abandoned partway,
    // starting a new one fails until that stale factor is removed first.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const stale = existing?.totp.find((f) => String(f.status) === "unverified");
    if (stale) {
      await supabase.auth.mfa.unenroll({ factorId: stale.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });
    if (error || !data) {
      return {
        ok: false,
        error: error?.message ?? "Couldn't start 2FA setup.",
      };
    }
    return {
      ok: true,
      factorId: data.id,
      qrCodeSvg: data.totp.qr_code,
      secret: data.totp.secret,
    };
  },

  confirmMfaEnrollment: async (factorId, code) => {
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      return {
        ok: false,
        error: challengeError?.message ?? "Couldn't verify that code.",
      };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (verifyError) return { ok: false, error: verifyError.message };

    await get().refreshMfaStatus();
    return { ok: true };
  },

  verifyMfaChallenge: async (code) => {
    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((f) => f.status === "verified");
    if (factorsError || !factor) {
      return {
        ok: false,
        error: factorsError?.message ?? "No 2FA method found on this account.",
      };
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError || !challenge) {
      return {
        ok: false,
        error: challengeError?.message ?? "Couldn't verify that code.",
      };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (verifyError) return { ok: false, error: verifyError.message };

    await get().refreshMfaStatus();
    return { ok: true };
  },

  disableMfa: async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data)
      return {
        ok: false,
        error: error?.message ?? "Couldn't load 2FA status.",
      };

    for (const factor of data.totp) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (unenrollError) return { ok: false, error: unenrollError.message };
    }

    await get().refreshMfaStatus();
    return { ok: true };
  },
}));
