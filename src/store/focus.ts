import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
    cancelScheduledNotification,
    ensureNotificationPermission,
    scheduleFocusCompleteNotification,
} from "@/lib/notifications";
import { Task } from "@/store/tasks";

type FocusStore = {
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  totalSeconds: number | null;
  /** Epoch ms the timer will hit zero at — set while running, null while paused. */
  endAt: number | null;
  /** Seconds left — only meaningful while paused (isRunning === false). */
  remainingSeconds: number | null;
  notificationId: string | null;
  isRunning: boolean;

  startFocus: (task: Task) => Promise<void>;
  pauseFocus: () => Promise<void>;
  resumeFocus: () => Promise<void>;
  addMinutes: (minutes: number) => Promise<void>;
  cancelFocus: () => Promise<void>;
  /** Called once the countdown naturally reaches zero — clears the active session. */
  finishFocus: () => void;
};

export const useFocusStore = create<FocusStore>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      activeTaskTitle: null,
      totalSeconds: null,
      endAt: null,
      remainingSeconds: null,
      notificationId: null,
      isRunning: false,

      startFocus: async (task) => {
        // Only one focus session at a time — starting a new one replaces
        // any previous one's scheduled notification so it doesn't also
        // fire later for an abandoned session.
        const prevNotificationId = get().notificationId;
        if (prevNotificationId) {
          await cancelScheduledNotification(prevNotificationId);
        }

        await ensureNotificationPermission();
        const seconds = Math.max(60, task.durationMinutes * 60);
        const notificationId = await scheduleFocusCompleteNotification(
          task.title,
          seconds,
        );

        set({
          activeTaskId: task.id,
          activeTaskTitle: task.title,
          totalSeconds: seconds,
          endAt: Date.now() + seconds * 1000,
          remainingSeconds: null,
          notificationId,
          isRunning: true,
        });
      },

      pauseFocus: async () => {
        const { endAt, notificationId } = get();
        if (!endAt) return;
        const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
        if (notificationId) await cancelScheduledNotification(notificationId);
        set({
          isRunning: false,
          endAt: null,
          remainingSeconds: remaining,
          notificationId: null,
        });
      },

      resumeFocus: async () => {
        const { remainingSeconds, activeTaskTitle } = get();
        if (remainingSeconds === null || !activeTaskTitle) return;
        const notificationId = await scheduleFocusCompleteNotification(
          activeTaskTitle,
          remainingSeconds,
        );
        set({
          isRunning: true,
          endAt: Date.now() + remainingSeconds * 1000,
          remainingSeconds: null,
          notificationId,
        });
      },

      addMinutes: async (minutes) => {
        const {
          isRunning,
          endAt,
          remainingSeconds,
          notificationId,
          activeTaskTitle,
        } = get();
        if (!activeTaskTitle) return;
        const extraSeconds = minutes * 60;

        if (isRunning && endAt) {
          if (notificationId) await cancelScheduledNotification(notificationId);
          const newRemaining =
            Math.max(0, Math.round((endAt - Date.now()) / 1000)) + extraSeconds;
          const newNotificationId = await scheduleFocusCompleteNotification(
            activeTaskTitle,
            newRemaining,
          );
          set((s) => ({
            endAt: Date.now() + newRemaining * 1000,
            totalSeconds: (s.totalSeconds ?? 0) + extraSeconds,
            notificationId: newNotificationId,
          }));
        } else if (remainingSeconds !== null) {
          set((s) => ({
            remainingSeconds: (s.remainingSeconds ?? 0) + extraSeconds,
            totalSeconds: (s.totalSeconds ?? 0) + extraSeconds,
          }));
        }
      },

      cancelFocus: async () => {
        const { notificationId } = get();
        if (notificationId) await cancelScheduledNotification(notificationId);
        set({
          activeTaskId: null,
          activeTaskTitle: null,
          totalSeconds: null,
          endAt: null,
          remainingSeconds: null,
          notificationId: null,
          isRunning: false,
        });
      },

      finishFocus: () => {
        set({
          activeTaskId: null,
          activeTaskTitle: null,
          totalSeconds: null,
          endAt: null,
          remainingSeconds: null,
          notificationId: null,
          isRunning: false,
        });
      },
    }),
    {
      name: "glasstask-focus",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
