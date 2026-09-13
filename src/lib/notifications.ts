import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { parseScheduledDateTime, Task } from "@/store/tasks";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("task-reminders", {
    name: "Task reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

/**
 * Schedules the "time to start" alert for a task, `offsetMinutes` before its
 * scheduled time. Returns the notification id (store it on the task so it
 * can be cancelled/rescheduled later), or null if permission was denied or
 * the resulting time is already in the past.
 */
export async function scheduleTaskReminder(
  task: Task,
  offsetMinutesBefore: number,
): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;
  await ensureAndroidChannel();

  const dueAt = parseScheduledDateTime(task);
  const fireAt = new Date(dueAt.getTime() - offsetMinutesBefore * 60_000);
  if (fireAt.getTime() <= Date.now()) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body:
        offsetMinutesBefore > 0
          ? `Starts in ${offsetMinutesBefore} minutes — ${task.scheduledTime}`
          : "It's time to start this task.",
      sound: "default",
      data: { taskId: task.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: "task-reminders",
    },
  });

  return id;
}

export async function cancelScheduledNotification(
  notificationId: string | null,
) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Schedules the exact-start-time alert for a task — separate from the
 * "before" reminder above, this fires right when the scheduled time
 * arrives, regardless of what reminder offset the user picked.
 */
export async function scheduleTaskStartNotification(
  task: Task,
): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;
  await ensureAndroidChannel();

  const dueAt = parseScheduledDateTime(task);
  if (dueAt.getTime() <= Date.now()) return null;

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time to start: ${task.title}`,
      body: "Open GlassTask to start your focus timer.",
      sound: "default",
      data: { taskId: task.id, kind: "task-start" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueAt,
      channelId: "task-reminders",
    },
  });
}

/** Fired when an in-app focus timer finishes. */
export async function notifyTimerComplete(taskTitle: string) {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time's up",
      body: `Your focus session for "${taskTitle}" has ended.`,
      sound: "default",
    },
    trigger: null, // fire immediately
  });
}

/**
 * Schedules the completion alert for a running focus session, `seconds`
 * from now. Scheduled as a real OS notification (not just an in-app
 * timer) so it still fires if the app is backgrounded or closed.
 */
export async function scheduleFocusCompleteNotification(
  taskTitle: string,
  seconds: number,
): Promise<string | null> {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;
  await ensureAndroidChannel();

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time's up",
      body: `Your focus session for "${taskTitle}" has ended.`,
      sound: "default",
      data: { kind: "focus-complete" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
      channelId: "task-reminders",
    },
  });
}
