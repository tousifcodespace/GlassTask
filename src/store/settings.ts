import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * NOTE: themeMode drives the real light/dark palette in
 * src/constants/app-theme.ts via the useAppTheme() hook — "system" follows
 * the OS color scheme. As of now Home and Profile (plus the shared
 * GlassCard/BottomTabBar) read from that hook; other screens still use the
 * fixed dark palette and are being migrated over incrementally.
 *
 * Everything under "Notifications" below is still UI/preference state
 * only — there is no expo-notifications integration yet, so toggling these
 * does not actually schedule or suppress a real push notification. Wiring
 * that up is a separate task once real notification scheduling is added.
 */
export type ThemeMode = "dark" | "light" | "system";

export const REMINDER_PRESETS_MIN = [5, 10, 15, 30] as const;
export const SNOOZE_PRESETS_MIN = [5, 10, 15, 20, 30] as const;
export const REMINDER_SOUNDS = ["Default", "Chime", "Pulse", "Silent"] as const;

type SettingsStore = {
  themeMode: ThemeMode;
  reminderOffsetMinutes: number;
  soundHapticsEnabled: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  cycleReminderOffset: () => void;
  toggleSoundHaptics: () => void;

  // Notifications screen
  notificationsEnabled: boolean;
  reminderSound: (typeof REMINDER_SOUNDS)[number];
  notificationHapticsEnabled: boolean;
  snoozeMinutes: number;
  repeatMissedReminders: boolean;
  remindUntilCompleted: boolean;
  showOverdueTasks: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // formatted, e.g. "11:00 PM" — matches formatClockTime() from @/store/tasks
  quietHoursEnd: string;

  toggleNotificationsEnabled: () => void;
  cycleReminderSound: () => void;
  toggleNotificationHaptics: () => void;
  cycleSnoozeMinutes: () => void;
  toggleRepeatMissedReminders: () => void;
  toggleRemindUntilCompleted: () => void;
  toggleShowOverdueTasks: () => void;
  toggleQuietHours: () => void;
  setQuietHoursStart: (label: string) => void;
  setQuietHoursEnd: (label: string) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      themeMode: "dark",
      reminderOffsetMinutes: 10,
      soundHapticsEnabled: true,

      setThemeMode: (mode) => set({ themeMode: mode }),

      cycleReminderOffset: () => {
        const current = get().reminderOffsetMinutes;
        const idx = REMINDER_PRESETS_MIN.indexOf(
          current as (typeof REMINDER_PRESETS_MIN)[number],
        );
        const next =
          REMINDER_PRESETS_MIN[(idx + 1) % REMINDER_PRESETS_MIN.length];
        set({ reminderOffsetMinutes: next });
      },

      toggleSoundHaptics: () =>
        set((s) => ({ soundHapticsEnabled: !s.soundHapticsEnabled })),

      // Notifications screen
      notificationsEnabled: true,
      reminderSound: "Default",
      notificationHapticsEnabled: true,
      snoozeMinutes: 10,
      repeatMissedReminders: true,
      remindUntilCompleted: false,
      showOverdueTasks: true,
      quietHoursEnabled: false,
      quietHoursStart: "11:00 PM",
      quietHoursEnd: "7:00 AM",

      toggleNotificationsEnabled: () =>
        set((s) => ({ notificationsEnabled: !s.notificationsEnabled })),

      cycleReminderSound: () => {
        const current = get().reminderSound;
        const idx = REMINDER_SOUNDS.indexOf(current);
        set({
          reminderSound: REMINDER_SOUNDS[(idx + 1) % REMINDER_SOUNDS.length],
        });
      },

      toggleNotificationHaptics: () =>
        set((s) => ({
          notificationHapticsEnabled: !s.notificationHapticsEnabled,
        })),

      cycleSnoozeMinutes: () => {
        const current = get().snoozeMinutes;
        const idx = SNOOZE_PRESETS_MIN.indexOf(
          current as (typeof SNOOZE_PRESETS_MIN)[number],
        );
        set({
          snoozeMinutes:
            SNOOZE_PRESETS_MIN[(idx + 1) % SNOOZE_PRESETS_MIN.length],
        });
      },

      toggleRepeatMissedReminders: () =>
        set((s) => ({ repeatMissedReminders: !s.repeatMissedReminders })),

      toggleRemindUntilCompleted: () =>
        set((s) => ({ remindUntilCompleted: !s.remindUntilCompleted })),

      toggleShowOverdueTasks: () =>
        set((s) => ({ showOverdueTasks: !s.showOverdueTasks })),

      toggleQuietHours: () =>
        set((s) => ({ quietHoursEnabled: !s.quietHoursEnabled })),

      setQuietHoursStart: (label) => set({ quietHoursStart: label }),
      setQuietHoursEnd: (label) => set({ quietHoursEnd: label }),
    }),
    {
      name: "glasstask-settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
