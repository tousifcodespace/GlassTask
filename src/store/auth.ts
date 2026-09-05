import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * IMPORTANT: There is no backend for GlassTask — everything lives on this
 * device. "Register" just saves one local account to AsyncStorage, and
 * "Login" checks the entered email/password against that saved account.
 * The password is stored as plain text on-device, not hashed. This is fine
 * as a local gate/onboarding step for a personal, single-user app, but it is
 * NOT real authentication and must not be treated as securing sensitive
 * data — anyone with access to the device's storage can read it.
 */
type StoredAccount = {
  fullName: string;
  email: string;
  password: string;
};

type AuthStore = {
  account: StoredAccount | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string };
  login: (
    email: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string };
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      account: null,
      isAuthenticated: false,
      hasHydrated: false,

      setHasHydrated: (value) => set({ hasHydrated: value }),

      register: (fullName, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!fullName.trim() || !normalizedEmail || password.length < 8) {
          return {
            ok: false,
            error: "Fill in every field with a password of at least 8 characters.",
          };
        }
        set({
          account: { fullName: fullName.trim(), email: normalizedEmail, password },
          isAuthenticated: true,
        });
        return { ok: true };
      },

      login: (email, password) => {
        const account = get().account;
        const normalizedEmail = email.trim().toLowerCase();
        if (!account || account.email !== normalizedEmail || account.password !== password) {
          return { ok: false, error: "Email or password doesn't match." };
        }
        set({ isAuthenticated: true });
        return { ok: true };
      },

      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: "glasstask-auth",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);