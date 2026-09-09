import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import type { AvatarId } from "@/constants/avatars";
import { supabase } from "@/lib/supabase";

export type AvatarType = "none" | "preset" | "photo";

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  /** Formatted display string, e.g. "March 14, 1998" — no picker value stored raw. */
  dateOfBirth: string;
  location: string;
  bio: string;
  avatarType: AvatarType;
  /** Set when avatarType === "preset". Stable across themes — only the
   *  underlying image swaps between the dark/light asset sets. */
  avatarId: AvatarId | null;
  /** Set when avatarType === "photo" — a local file URI from the picker. */
  avatarUri: string | null;
};

const EMPTY_PROFILE: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  location: "",
  bio: "",
  avatarType: "none",
  avatarId: null,
  avatarUri: null,
};

type EditableFields = Pick<
  UserProfile,
  "fullName" | "email" | "phone" | "dateOfBirth" | "location" | "bio"
>;

type ProfileRow = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  location: string | null;
  bio: string | null;
  avatar_type: string | null;
  avatar_id: string | null;
};

/**
 * Custom profile *photos* aren't uploaded anywhere (no Supabase Storage
 * bucket is wired up) — the value picked from the device's photo library
 * is just a local file URI, meaningless on any other device or after this
 * device's cache is cleared. So photo avatars are cached locally per
 * account, on this device only, separately from the fields that actually
 * sync through Supabase. Preset avatars (bundled art, referenced by a
 * small id) sync fine since there's no file to move around.
 */
function localPhotoKey(userId: string) {
  return `glasstask-photo-avatar:${userId}`;
}

/**
 * Profile core fields + preset-avatar choice live in Supabase's `profiles`
 * table, one row per user (RLS scopes everyone to their own row via
 * auth.uid() = id). This store is a client-side cache of that row for
 * whoever is currently signed in — it is NOT persisted to AsyncStorage as
 * a whole anymore (only the local-only photo URI is, see above). It used
 * to be fully local, which meant it was a single blob shared by whichever
 * account last wrote to it on that device: register as A, then log in as
 * B on the same browser, and B would see A's name/bio/etc. `fetchProfile`
 * / `clearProfile` are called from the auth store on sign-in/sign-out to
 * keep this in sync with whoever is actually logged in.
 */
type ProfileStore = {
  profile: UserProfile;
  isLoading: boolean;
  hasLoaded: boolean;
  currentUserId: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (
    patch: Partial<EditableFields>,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  setPresetAvatar: (id: AvatarId) => Promise<void>;
  setPhotoAvatar: (uri: string) => Promise<void>;
  clearAvatar: () => Promise<void>;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: EMPTY_PROFILE,
  isLoading: false,
  hasLoaded: false,
  currentUserId: null,

  fetchProfile: async (userId: string) => {
    set({ isLoading: true, currentUserId: userId });

    const [{ data, error }, localPhotoUri] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "full_name, email, phone, date_of_birth, location, bio, avatar_type, avatar_id",
        )
        .eq("id", userId)
        .maybeSingle(),
      AsyncStorage.getItem(localPhotoKey(userId)).catch(() => null),
    ]);

    set({ isLoading: false, hasLoaded: true });

    if (error) {
      console.warn("[profile] fetchProfile failed:", error.message);
      return;
    }

    const row = data as ProfileRow | null;
    const base: EditableFields = row
      ? {
          fullName: row.full_name ?? "",
          email: row.email ?? "",
          phone: row.phone ?? "",
          dateOfBirth: row.date_of_birth ?? "",
          location: row.location ?? "",
          bio: row.bio ?? "",
        }
      : {
          fullName: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          location: "",
          bio: "",
        };

    // A cached local photo always wins (it's this device's most direct
    // customization); otherwise fall back to whatever preset choice, if
    // any, is synced on the account.
    let avatar: Pick<UserProfile, "avatarType" | "avatarId" | "avatarUri">;
    if (localPhotoUri) {
      avatar = {
        avatarType: "photo",
        avatarId: null,
        avatarUri: localPhotoUri,
      };
    } else if (row?.avatar_type === "preset" && row.avatar_id) {
      avatar = {
        avatarType: "preset",
        avatarId: row.avatar_id as AvatarId,
        avatarUri: null,
      };
    } else {
      avatar = { avatarType: "none", avatarId: null, avatarUri: null };
    }

    set({ profile: { ...base, ...avatar } });
  },

  updateProfile: async (patch) => {
    // Optimistic local update so the UI feels instant while the write
    // goes out to Supabase in the background.
    set((s) => ({ profile: { ...s.profile, ...patch } }));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "You're not logged in." };
    }

    const row: Record<string, string> = { id: user.id };
    if (patch.fullName !== undefined) row.full_name = patch.fullName;
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.dateOfBirth !== undefined) row.date_of_birth = patch.dateOfBirth;
    if (patch.location !== undefined) row.location = patch.location;
    if (patch.bio !== undefined) row.bio = patch.bio;

    const { error } = await supabase.from("profiles").upsert(row);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  setPresetAvatar: async (id) => {
    set((s) => ({
      profile: {
        ...s.profile,
        avatarType: "preset",
        avatarId: id,
        avatarUri: null,
      },
    }));

    const userId = get().currentUserId;
    if (userId) {
      await AsyncStorage.removeItem(localPhotoKey(userId)).catch(() => {});
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_type: "preset", avatar_id: id });
    if (error)
      console.warn("[profile] setPresetAvatar sync failed:", error.message);
  },

  setPhotoAvatar: async (uri) => {
    set((s) => ({
      profile: {
        ...s.profile,
        avatarType: "photo",
        avatarUri: uri,
        avatarId: null,
      },
    }));

    const userId = get().currentUserId;
    if (userId) {
      try {
        await AsyncStorage.setItem(localPhotoKey(userId), uri);
      } catch {
        // Best-effort local cache only — losing this just means the photo
        // won't survive an app restart, not a correctness issue.
      }
    }
    // Deliberately not synced to Supabase: it's a local file path with no
    // meaning on another device. Real cross-device photo sync would need
    // uploading the image to Supabase Storage, which isn't set up yet.
  },

  clearAvatar: async () => {
    set((s) => ({
      profile: {
        ...s.profile,
        avatarType: "none",
        avatarId: null,
        avatarUri: null,
      },
    }));

    const userId = get().currentUserId;
    if (userId) {
      await AsyncStorage.removeItem(localPhotoKey(userId)).catch(() => {});
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_type: "none", avatar_id: null });
    if (error)
      console.warn("[profile] clearAvatar sync failed:", error.message);
  },

  clearProfile: () =>
    set({ profile: EMPTY_PROFILE, hasLoaded: false, currentUserId: null }),
}));
