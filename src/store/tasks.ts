import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Priority = "high" | "medium" | "low";
export type CategoryKey = "work" | "personal" | "health";
export type RepeatCadence = "none" | "daily" | "weekly" | "monthly";

export type Subtask = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  notes: string;
  category: CategoryKey;
  priority: Priority;
  subtasks: Subtask[];
  scheduledDate: string;
  scheduledDateISO: string;
  scheduledTime: string;
  done: boolean;
  createdAt: number;
  /** How long the task is expected to take — drives the in-app focus timer. */
  durationMinutes: number;
  /** Minutes before the scheduled time to fire the "time to start" alert — per-task override. */
  reminderMinutesBefore: number;
  repeat: RepeatCadence;
  /** Fixed reference date used to match weekly/monthly repeat patterns — never changes after creation. */
  repeatAnchorISO: string;
  /** Id of the original recurring task this was auto-generated from. Null for one-off tasks and for the root task itself. */
  templateId: string | null;
  /**
   * Whether this recurring series is still generating new occurrences.
   * Set to false on every existing occurrence (past and current) when the
   * user ends the series — rollover checks this on the most recent
   * occurrence before creating tomorrow's. Always true for one-off tasks.
   * Past occurrences keep their real `done` history either way; this only
   * stops *future* generation, it never rewrites history.
   */
  seriesActive: boolean;
  /** expo-notifications identifier for the scheduled due-time alert, so it can be cancelled/rescheduled. */
  notificationId: string | null;
  /** Optional URL (meeting link, doc, etc.) shown as a quick-open action on the task. */
  link: string;
};

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  work: "Work",
  personal: "Personal",
  health: "Health",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** e.g. "Today, Sep 4" — matches the static placeholder used in the New Task screen. */
export function formatTodayLabel(date: Date = new Date()): string {
  return `Today, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Local (not UTC) "YYYY-MM-DD" — used to group tasks by calendar day. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formats any picked date relative to today:
 * "Today, Sep 4" / "Tomorrow, Sep 5" / "Mon, Sep 8"
 */
export function formatDateLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDay(date, today)) {
    return formatTodayLabel(date);
  }
  if (isSameDay(date, tomorrow)) {
    return `Tomorrow, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
  }
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** e.g. "8:05 PM" */
export function formatClockTime(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

/** Combines a task's scheduledDateISO + scheduledTime ("8:00 PM") into a real Date. */
export function parseScheduledDateTime(task: Task): Date {
  const [y, m, d] = task.scheduledDateISO.split("-").map(Number);
  const match = task.scheduledTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hours = 0;
  let minutes = 0;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }
  return new Date(y || 1970, (m || 1) - 1, d || 1, hours, minutes, 0, 0);
}

/** "in 25m" / "in 2h 5m" / "now" / "45m overdue" */
export function formatRelativeToNow(
  target: Date,
  from: Date = new Date(),
): string {
  const diffMin = Math.round((target.getTime() - from.getTime()) / 60000);
  if (diffMin <= 0) {
    const overdueMin = Math.abs(diffMin);
    if (overdueMin === 0) return "now";
    if (overdueMin < 60) return `${overdueMin}m overdue`;
    const h = Math.floor(overdueMin / 60);
    return `${h}h overdue`;
  }
  if (diffMin < 60) return `in ${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

/** The soonest not-done task by real scheduled datetime, or null if none remain. */
export function getNextUpTask(tasks: Task[]): Task | null {
  const notDone = tasks.filter((t) => !t.done);
  if (notDone.length === 0) return null;
  return notDone.reduce<Task | null>((soonest, t) => {
    if (!soonest) return t;
    return parseScheduledDateTime(t) < parseScheduledDateTime(soonest)
      ? t
      : soonest;
  }, null);
}

/** Consecutive days up to and including today with at least one completed task. */
export function computeCurrentStreak(
  tasks: Task[],
  today: Date = new Date(),
): number {
  const tasksByDate: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!tasksByDate[t.scheduledDateISO]) tasksByDate[t.scheduledDateISO] = [];
    tasksByDate[t.scheduledDateISO].push(t);
  }
  let count = 0;
  let cursor = today;
  while (true) {
    const iso = toISODate(cursor);
    const doneHere = (tasksByDate[iso] ?? []).filter((t) => t.done).length;
    if (doneHere === 0) break;
    count++;
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() - 1,
    );
  }
  return count;
}

/** Longest historical run of consecutive days with at least one completed task. */
export function computeBestStreak(tasks: Task[]): number {
  const doneDates = new Set<string>();
  for (const t of tasks) {
    if (t.done) doneDates.add(t.scheduledDateISO);
  }
  if (doneDates.size === 0) return 0;

  const sorted = Array.from(doneDates).sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round(
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) /
        86400000,
    );
    if (diffDays === 1) {
      current++;
      best = Math.max(best, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }
  return best;
}

/** Real completed/total count for tasks scheduled today — replaces any fake "focus time" stat. */
export function getTodayProgress(
  tasks: Task[],
  today: Date = new Date(),
): { done: number; total: number } {
  const iso = toISODate(today);
  const todays = tasks.filter((t) => t.scheduledDateISO === iso);
  return { done: todays.filter((t) => t.done).length, total: todays.length };
}

/** True when a task's scheduled day has passed and it's still not done. */
export function isTaskOverdue(task: Task, today: Date = new Date()): boolean {
  if (task.done) return false;
  return task.scheduledDateISO < toISODate(today);
}

const WEEKDAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** "Daily" / "Weekly on Monday" / "Monthly on the 14th" / "One-time" */
export function describeRepeat(
  task: Pick<Task, "repeat" | "repeatAnchorISO">,
): string {
  if (task.repeat === "none") return "One-time";
  if (task.repeat === "daily") return "Daily";
  const anchor = new Date(`${task.repeatAnchorISO}T00:00:00`);
  if (task.repeat === "weekly")
    return `Weekly on ${WEEKDAYS_FULL[anchor.getDay()]}`;
  return `Monthly on the ${ordinal(anchor.getDate())}`;
}

type NewTaskInput = {
  title: string;
  notes: string;
  category: CategoryKey;
  priority: Priority;
  subtasks: Subtask[];
  scheduledDate?: string;
  scheduledDateISO?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  reminderMinutesBefore?: number;
  repeat?: RepeatCadence;
  link?: string;
};

type TaskStore = {
  tasks: Task[];
  addTask: (input: NewTaskInput) => string;
  updateTask: (id: string, patch: Partial<NewTaskInput>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  /**
   * Permanently stops a recurring series: deletes today's and any
   * future-dated occurrences (they haven't happened, nothing to preserve),
   * but keeps every past occurrence and its real done/undone history
   * exactly as it was, and flags the series so rollover never generates a
   * new occurrence for it again. For a one-off (non-repeating) task this
   * just behaves like removeTask. Returns the ids of any occurrences that
   * had a scheduled notification, so the caller can cancel them.
   */
  deleteTaskSeries: (id: string) => string[];
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  moveTaskToToday: (id: string) => void;
  setNotificationId: (id: string, notificationId: string | null) => void;
  rolloverRecurringTasks: () => void;
};

function shouldGenerateOccurrence(sample: Task, todayISO: string): boolean {
  if (sample.repeat === "daily") return true;
  if (sample.repeat === "none") return false;

  const anchor = new Date(sample.repeatAnchorISO);
  const today = new Date(todayISO);
  if (sample.repeat === "weekly") return anchor.getDay() === today.getDay();
  if (sample.repeat === "monthly") return anchor.getDate() === today.getDate();
  return false;
}

function makeId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (input) => {
        const id = makeId();
        const scheduledDateISO =
          input.scheduledDateISO ?? toISODate(new Date());
        set((state) => ({
          tasks: [
            {
              id,
              title: input.title,
              notes: input.notes,
              category: input.category,
              priority: input.priority,
              subtasks: input.subtasks,
              scheduledDate: input.scheduledDate ?? formatTodayLabel(),
              scheduledDateISO,
              scheduledTime: input.scheduledTime ?? formatClockTime(),
              done: false,
              createdAt: Date.now(),
              durationMinutes: input.durationMinutes ?? 30,
              reminderMinutesBefore: input.reminderMinutesBefore ?? 10,
              repeat: input.repeat ?? "none",
              repeatAnchorISO: scheduledDateISO,
              templateId: null,
              seriesActive: true,
              notificationId: null,
              link: input.link?.trim() ?? "",
            },
            ...state.tasks,
          ],
        }));
        return id;
      },

      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              ...(patch.title !== undefined && { title: patch.title }),
              ...(patch.notes !== undefined && { notes: patch.notes }),
              ...(patch.category !== undefined && { category: patch.category }),
              ...(patch.priority !== undefined && { priority: patch.priority }),
              ...(patch.subtasks !== undefined && { subtasks: patch.subtasks }),
              ...(patch.scheduledDate !== undefined && {
                scheduledDate: patch.scheduledDate,
              }),
              ...(patch.scheduledDateISO !== undefined && {
                scheduledDateISO: patch.scheduledDateISO,
              }),
              ...(patch.scheduledTime !== undefined && {
                scheduledTime: patch.scheduledTime,
              }),
              ...(patch.durationMinutes !== undefined && {
                durationMinutes: patch.durationMinutes,
              }),
              ...(patch.reminderMinutesBefore !== undefined && {
                reminderMinutesBefore: patch.reminderMinutesBefore,
              }),
              ...(patch.repeat !== undefined && { repeat: patch.repeat }),
              ...(patch.link !== undefined && { link: patch.link }),
            };
          }),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t,
          ),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      deleteTaskSeries: (id) => {
        const state = get();
        const target = state.tasks.find((t) => t.id === id);
        if (!target) return [];

        if (target.repeat === "none") {
          set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
          return target.notificationId ? [target.notificationId] : [];
        }

        const rootId = target.templateId ?? target.id;
        const todayISO = toISODate(new Date());
        const cancelledNotificationIds: string[] = [];

        set((s) => ({
          tasks: s.tasks.reduce<Task[]>((acc, t) => {
            const belongsToSeries = t.id === rootId || t.templateId === rootId;
            if (!belongsToSeries) {
              acc.push(t);
              return acc;
            }
            // Today's and future occurrences haven't happened yet — safe
            // to drop entirely, nothing there to preserve.
            if (t.scheduledDateISO >= todayISO) {
              if (t.notificationId) cancelledNotificationIds.push(t.notificationId);
              return acc;
            }
            // Past occurrences keep their real done/undone status; just
            // mark the series inactive so rollover stops generating more.
            acc.push({ ...t, seriesActive: false });
            return acc;
          }, []),
        }));

        return cancelledNotificationIds;
      },

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s,
                  ),
                }
              : t,
          ),
        })),

      moveTaskToToday: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  scheduledDate: formatTodayLabel(),
                  scheduledDateISO: toISODate(new Date()),
                }
              : t,
          ),
        })),

      setNotificationId: (id, notificationId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, notificationId } : t,
          ),
        })),

      rolloverRecurringTasks: () =>
        set((state) => {
          const todayISO = toISODate(new Date());
          const sources = state.tasks.filter((t) => t.repeat !== "none");
          if (sources.length === 0) return state;

          // Pick the most recently created occurrence per recurring "root" as the template to clone.
          const roots = new Map<string, Task>();
          for (const t of sources) {
            const rootId = t.templateId ?? t.id;
            const existing = roots.get(rootId);
            if (!existing || t.createdAt > existing.createdAt)
              roots.set(rootId, t);
          }

          const newOccurrences: Task[] = [];
          for (const [rootId, sample] of roots) {
            if (sample.seriesActive === false) continue;
            if (!shouldGenerateOccurrence(sample, todayISO)) continue;
            const alreadyExists = state.tasks.some(
              (t) =>
                (t.templateId === rootId || t.id === rootId) &&
                t.scheduledDateISO === todayISO,
            );
            if (alreadyExists) continue;

            newOccurrences.push({
              id: makeId(),
              title: sample.title,
              notes: sample.notes,
              category: sample.category,
              priority: sample.priority,
              subtasks: sample.subtasks.map((s) => ({ ...s, done: false })),
              scheduledDate: formatTodayLabel(),
              scheduledDateISO: todayISO,
              scheduledTime: sample.scheduledTime,
              done: false,
              createdAt: Date.now(),
              durationMinutes: sample.durationMinutes,
              reminderMinutesBefore: sample.reminderMinutesBefore,
              repeat: sample.repeat,
              repeatAnchorISO: sample.repeatAnchorISO,
              templateId: rootId,
              seriesActive: true,
              notificationId: null,
              link: sample.link,
            });
          }

          return newOccurrences.length > 0
            ? { tasks: [...newOccurrences, ...state.tasks] }
            : state;
        }),
    }),
    {
      name: "glasstask-tasks",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);