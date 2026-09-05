import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  /** Formatted display string, e.g. "March 14, 1998" — no picker value stored raw. */
  dateOfBirth: string;
  location: string;
  bio: string;
};

type ProfileStore = {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: {
        fullName: "Tousif",
        email: "",
        phone: "",
        dateOfBirth: "",
        location: "Dhaka, Bangladesh",
        bio: "Stay focused. Get things done.",
      },
      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    {
      name: "glasstask-profile",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);