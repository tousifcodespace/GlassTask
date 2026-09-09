import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";
import { ScreenHeader } from "@/components/screen-header";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
    CATEGORY_LABELS,
    CategoryKey,
    Priority,
    Task,
    parseScheduledDateTime,
    toISODate,
    useTaskStore,
} from "@/store/tasks";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const CATEGORY_ICON: Record<CategoryKey, keyof typeof MaterialIcons.glyphMap> =
  {
    work: "work",
    personal: "favorite",
    health: "fitness-center",
  };

const PRIORITY_COLOR: Record<Priority, string> = {
  high: "#ff6b81",
  medium: "#ffb84d",
  low: "#3fe0c5",
};

/** "Today" / "Yesterday" / "Tuesday, Sep 8" / "Tuesday, Sep 8, 2025" (year only when not this year). */
function formatGroupLabel(iso: string, todayISO: string): string {
  if (iso === todayISO) return "Today";

  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(`${todayISO}T00:00:00`);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diffDays === 1) return "Yesterday";
  if (diffDays === -1) return "Tomorrow";

  const base = `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === today.getFullYear()
    ? base
    : `${base}, ${date.getFullYear()}`;
}

type TaskStatus = "done" | "missed" | "pending" | "upcoming";

function getTaskStatus(task: Task, todayISO: string): TaskStatus {
  if (task.done) return "done";
  if (task.scheduledDateISO < todayISO) return "missed";
  if (task.scheduledDateISO === todayISO) return "pending";
  return "upcoming";
}

const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  done: { label: "Completed", color: "#3fe0c5", icon: "check-circle" },
  missed: { label: "Missed", color: "#ff6b81", icon: "cancel" },
  pending: { label: "Pending", color: "#ffb84d", icon: "schedule" },
  upcoming: { label: "Upcoming", color: "#9d8cff", icon: "event" },
};

export default function TimelineScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const { date: focusDate } = useLocalSearchParams<{ date?: string }>();

  const todayISO = useMemo(() => toISODate(new Date()), []);

  const groups = useMemo(() => {
    const byDate: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!byDate[t.scheduledDateISO]) byDate[t.scheduledDateISO] = [];
      byDate[t.scheduledDateISO].push(t);
    }
    return Object.keys(byDate)
      .sort((a, b) => b.localeCompare(a)) // most recent day first
      .map((iso) => {
        const dayTasks = [...byDate[iso]].sort(
          (a, b) =>
            parseScheduledDateTime(a).getTime() -
            parseScheduledDateTime(b).getTime(),
        );
        const doneCount = dayTasks.filter((t) => t.done).length;
        return {
          iso,
          tasks: dayTasks,
          doneCount,
          total: dayTasks.length,
          percent:
            dayTasks.length === 0
              ? 0
              : Math.round((doneCount / dayTasks.length) * 100),
        };
      });
  }, [tasks]);

  const initialExpanded = useMemo(() => {
    const target =
      typeof focusDate === "string" && groups.some((g) => g.iso === focusDate)
        ? focusDate
        : (groups.find((g) => g.iso === todayISO)?.iso ?? groups[0]?.iso);
    return target ? new Set([target]) : new Set<string>();
  }, [focusDate, groups, todayISO]);

  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  const toggle = (iso: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <ScreenHeader title="Timeline" subtitle="Your day-by-day history" />
        </View>

        {groups.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
            }}
          >
            <MaterialIcons
              name="hourglass-empty"
              size={32}
              color={theme.textFaint}
            />
            <Text
              className="text-[13px] mt-3 text-center"
              style={{ color: theme.textFaint }}
            >
              No tasks yet — your timeline will fill in as you add and complete
              tasks.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 40,
              gap: 12,
            }}
            showsVerticalScrollIndicator={false}
          >
            {groups.map((group) => {
              const isOpen = expanded.has(group.iso);
              return (
                <GlassCard key={group.iso} style={{ padding: 0 }}>
                  <TouchableOpacity
                    onPress={() => toggle(group.iso)}
                    className="flex-row items-center justify-between px-4 py-3.5"
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        className="text-[14.5px] font-bold"
                        style={{ color: theme.text }}
                      >
                        {formatGroupLabel(group.iso, todayISO)}
                      </Text>
                      <Text
                        className="text-[11.5px] mt-0.5"
                        style={{ color: theme.textFaint }}
                      >
                        {group.doneCount}/{group.total} done • {group.percent}%
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            group.percent === 100
                              ? "rgba(63,224,197,0.16)"
                              : theme.chipBg,
                          borderWidth: 1,
                          borderColor:
                            group.percent === 100
                              ? "rgba(63,224,197,0.35)"
                              : theme.chipBorder,
                        }}
                      >
                        <Text
                          className="text-[10.5px] font-bold"
                          style={{
                            color:
                              group.percent === 100
                                ? "#3fe0c5"
                                : theme.textFaint,
                          }}
                        >
                          {group.percent}%
                        </Text>
                      </View>
                      <MaterialIcons
                        name={isOpen ? "expand-less" : "expand-more"}
                        size={22}
                        color={theme.textFaint}
                      />
                    </View>
                  </TouchableOpacity>

                  {isOpen && (
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingBottom: 14,
                        gap: 8,
                      }}
                    >
                      {group.tasks.map((task) => {
                        const status = getTaskStatus(task, todayISO);
                        const meta = STATUS_META[status];
                        return (
                          <TouchableOpacity
                            key={task.id}
                            onPress={() =>
                              router.push({
                                pathname: "/new-task",
                                params: { taskId: task.id },
                              })
                            }
                            className="flex-row items-center gap-3 rounded-2xl px-3 py-3"
                            style={{
                              backgroundColor: theme.chipBg,
                              borderWidth: 1,
                              borderColor: theme.chipBorder,
                            }}
                          >
                            <View
                              className="w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: `${meta.color}26` }}
                            >
                              <MaterialIcons
                                name={meta.icon}
                                size={17}
                                color={meta.color}
                              />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text
                                numberOfLines={1}
                                className="text-[13.5px] font-semibold"
                                style={{
                                  color: task.done
                                    ? theme.textFaint
                                    : theme.text,
                                  textDecorationLine: task.done
                                    ? "line-through"
                                    : "none",
                                }}
                              >
                                {task.title}
                              </Text>
                              <View className="flex-row items-center gap-1.5 mt-1">
                                <MaterialIcons
                                  name={CATEGORY_ICON[task.category]}
                                  size={11}
                                  color={theme.textFaint}
                                />
                                <Text
                                  className="text-[10.5px]"
                                  style={{ color: theme.textFaint }}
                                >
                                  {CATEGORY_LABELS[task.category]} •{" "}
                                  {task.scheduledTime}
                                </Text>
                                <View
                                  style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor:
                                      PRIORITY_COLOR[task.priority],
                                  }}
                                />
                              </View>
                            </View>

                            <View
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: `${meta.color}20` }}
                            >
                              <Text
                                className="text-[9.5px] font-bold uppercase tracking-wider"
                                style={{ color: meta.color }}
                              >
                                {meta.label}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
