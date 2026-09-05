import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Priority = "high" | "medium" | "low";
export type CategoryKey = "work" | "personal" | "health";

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

type NewTaskInput = {
  title: string;
  notes: string;
  category: CategoryKey;
  priority: Priority;
  subtasks: Subtask[];
  scheduledDate?: string;
  scheduledDateISO?: string;
  scheduledTime?: string;
};

type TaskStore = {
  tasks: Task[];
  addTask: (input: NewTaskInput) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
};

function makeId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (input) =>
        set((state) => ({
          tasks: [
            {
              id: makeId(),
              title: input.title,
              notes: input.notes,
              category: input.category,
              priority: input.priority,
              subtasks: input.subtasks,
              scheduledDate: input.scheduledDate ?? formatTodayLabel(),
              scheduledDateISO: input.scheduledDateISO ?? toISODate(new Date()),
              scheduledTime: input.scheduledTime ?? formatClockTime(),
              done: false,
              createdAt: Date.now(),
            },
            ...state.tasks,
          ],
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
    }),
    {
      name: "glasstask-tasks",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
