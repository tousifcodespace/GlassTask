import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabBar, TabKey } from "@/components/bottom-tab-bar";
import { GlassCard } from "@/components/glass-card";
import { TAB_ROUTES } from "@/lib/tab-routes";
import {
  CATEGORY_LABELS,
  CategoryKey,
  Priority,
  Task,
  toISODate,
  useTaskStore,
} from "@/store/tasks";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
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

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: "HIGH", color: "#ff6b81" },
  medium: { label: "MED", color: "#ffb84d" },
  low: { label: "LOW", color: "#3fe0c5" },
};

const CATEGORY_ICON: Record<CategoryKey, keyof typeof MaterialIcons.glyphMap> = {
  work: "work",
  personal: "favorite",
  health: "fitness-center",
};

type DayCell = { date: Date; inMonth: boolean };

function buildMonthGrid(viewDate: Date): DayCell[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      inMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }
  return cells;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarScreen() {
  const router = useRouter();
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);

  const [activeTab, setActiveTab] = useState<TabKey>("calendar");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const handlePressTab = (key: TabKey) => {
    setActiveTab(key);
    const route = TAB_ROUTES[key] as Parameters<typeof router.push>[0] | undefined;
    if (route) router.push(route);
  };

  const grid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!map[t.scheduledDateISO]) map[t.scheduledDateISO] = [];
      map[t.scheduledDateISO].push(t);
    }
    return map;
  }, [tasks]);

  const today = new Date();
  const selectedISO = toISODate(selectedDate);
  const selectedDayTasks = tasksByDate[selectedISO] ?? [];
  const selectedDoneCount = selectedDayTasks.filter((t) => t.done).length;
  const selectedPercent =
    selectedDayTasks.length === 0
      ? 0
      : Math.round((selectedDoneCount / selectedDayTasks.length) * 100);

  const monthTaskCount = grid
    .filter((c) => c.inMonth)
    .reduce(
      (sum, c) => sum + (tasksByDate[toISODate(c.date)]?.length ?? 0),
      0,
    );

  const goPrevMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const selectedLabel = isSameDay(selectedDate, today)
    ? `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, Today`
    : `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}`;

  const dotSlotCount = Math.min(Math.max(selectedDayTasks.length, 3), 8);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#2a1f52", "#150f30", "#0a0818"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 110,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center gap-2.5">
              <TouchableOpacity
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/")
                }
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <MaterialIcons name="arrow-back" size={19} color="#f5f3ff" />
              </TouchableOpacity>
              <Text
                className="text-[19px] font-bold"
                style={{ color: "#f5f3ff" }}
              >
                Calendar
              </Text>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(124,108,246,0.35)" }}
              >
                <Text
                  className="text-[10.5px] font-bold"
                  style={{ color: "#e4defc" }}
                >
                  PRO
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <MaterialIcons name="search" size={17} color="#f5f3ff" />
              </TouchableOpacity>
              <View>
                <TouchableOpacity
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  <MaterialIcons
                    name="notifications-none"
                    size={17}
                    color="#f5f3ff"
                  />
                </TouchableOpacity>
                <View
                  className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5"
                  style={{
                    backgroundColor: "#3fe0c5",
                    borderWidth: 1.5,
                    borderColor: "#0a0818",
                  }}
                />
              </View>
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ borderWidth: 1.5, borderColor: "#7c6cf6" }}
              >
                <View
                  className="w-full h-full rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(124,108,246,0.25)" }}
                >
                  <MaterialIcons name="person" size={16} color="#cabeff" />
                </View>
              </View>
            </View>
          </View>

          {/* Obsidian Schedule banner */}
          <GlassCard style={{ marginBottom: 14, padding: 16 }}>
            <View className="flex-row items-center justify-between">
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  className="text-[10.5px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: "#3fe0c5" }}
                >
                  Obsidian Schedule
                </Text>
                <Text
                  className="text-[13px] leading-[18px]"
                  style={{ color: "rgba(245,243,255,0.6)" }}
                >
                  Plan your cycles with tactile obsidian precision
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#3fe0c5" }}
                />
                <Text
                  className="text-[12px] font-medium"
                  style={{ color: "#f5f3ff" }}
                >
                  Sync Active
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Stat cards */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <GlassCard style={{ flex: 1, padding: 14 }}>
              <View className="flex-row items-center justify-between mb-2.5">
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "rgba(245,243,255,0.5)" }}
                >
                  Focus Flow
                </Text>
                <MaterialIcons name="bolt" size={15} color="#b57bff" />
              </View>
              <View className="flex-row items-baseline gap-1.5 mb-2.5">
                <Text
                  className="text-[22px] font-extrabold"
                  style={{ color: "#f5f3ff" }}
                >
                  4.5h
                </Text>
                <Text
                  className="text-[11.5px] font-semibold"
                  style={{ color: "#3fe0c5" }}
                >
                  +18% today
                </Text>
              </View>
              <View
                style={{
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#7c6cf6", "#22d3ee"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: "70%", height: "100%", borderRadius: 3 }}
                />
              </View>
            </GlassCard>

            <GlassCard style={{ flex: 1, padding: 14 }}>
              <View className="flex-row items-center justify-between mb-2.5">
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "rgba(245,243,255,0.5)" }}
                >
                  Schedule
                </Text>
                <MaterialIcons name="donut-large" size={15} color="#b57bff" />
              </View>
              <View className="flex-row items-baseline gap-1 mb-2.5">
                <Text
                  className="text-[22px] font-extrabold"
                  style={{ color: "#f5f3ff" }}
                >
                  {selectedDoneCount}
                </Text>
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(245,243,255,0.5)" }}
                >
                  {" "}
                  / {selectedDayTasks.length} Tasks
                </Text>
              </View>
              <View className="flex-row gap-1.5">
                {Array.from({ length: dotSlotCount }).map((_, i) => (
                  <View
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        i < selectedDoneCount
                          ? "#7c6cf6"
                          : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </View>
            </GlassCard>
          </View>

          {/* Calendar */}
          <GlassCard style={{ marginBottom: 16, padding: 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={goPrevMonth}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <MaterialIcons
                  name="chevron-left"
                  size={18}
                  color="rgba(245,243,255,0.7)"
                />
              </TouchableOpacity>

              <View className="flex-row items-center gap-1.5">
                <Text
                  className="text-[16px] font-bold"
                  style={{ color: "#f5f3ff" }}
                >
                  {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </Text>
                <MaterialIcons
                  name="expand-more"
                  size={16}
                  color="rgba(245,243,255,0.5)"
                />
              </View>

              <TouchableOpacity
                onPress={goNextMonth}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={18}
                  color="rgba(245,243,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between mb-2.5">
              {WEEKDAY_LABELS.map((w, i) => (
                <Text
                  key={`${w}-${i}`}
                  style={{
                    width: 34,
                    textAlign: "center",
                    color: "rgba(245,243,255,0.4)",
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  {w}
                </Text>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {grid.map(({ date, inMonth }, idx) => {
                const iso = toISODate(date);
                const dayTasks = tasksByDate[iso] ?? [];
                const selected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedDate(date)}
                    style={{
                      width: `${100 / 7}%`,
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected ? "#7c6cf6" : "transparent",
                        borderWidth: !selected && isToday ? 1 : 0,
                        borderColor: "rgba(124,108,246,0.6)",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: selected ? "700" : "500",
                          color: !inMonth
                            ? "rgba(245,243,255,0.25)"
                            : selected
                              ? "#fff"
                              : "#f5f3ff",
                        }}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                    <View className="flex-row gap-0.5 mt-1" style={{ height: 4 }}>
                      {dayTasks.slice(0, 3).map((t) => (
                        <View
                          key={t.id}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: PRIORITY_META[t.priority].color,
                          }}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              className="flex-row items-center justify-between pt-3.5 mt-1"
              style={{
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View className="flex-row items-center gap-1.5">
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#3fe0c5" }}
                />
                <Text
                  className="text-[12px]"
                  style={{ color: "rgba(245,243,255,0.55)" }}
                >
                  {monthTaskCount} Scheduled Task{monthTaskCount === 1 ? "" : "s"}
                </Text>
              </View>
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text
                  className="text-[12.5px] font-semibold"
                  style={{ color: "#b57bff" }}
                >
                  Month Summary
                </Text>
                <MaterialIcons name="chevron-right" size={14} color="#b57bff" />
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Selected day header */}
          <View className="flex-row items-center justify-between mb-4 flex-wrap gap-2">
            <Text className="text-[18px] font-bold" style={{ color: "#f5f3ff" }}>
              {selectedLabel}
            </Text>
            <View className="flex-row items-center gap-2">
              {selectedDayTasks.length > 0 && (
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(63,224,197,0.16)" }}
                >
                  <Text
                    className="text-[11px] font-bold"
                    style={{ color: "#3fe0c5" }}
                  >
                    {selectedDayTasks.length} TASK
                    {selectedDayTasks.length === 1 ? "" : "S"} • {selectedPercent}%
                  </Text>
                </View>
              )}
              <TouchableOpacity className="flex-row items-center gap-1">
                <Text
                  className="text-[12.5px] font-semibold"
                  style={{ color: "#b57bff" }}
                >
                  Timeline
                </Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={13}
                  color="#b57bff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Task list for the selected day */}
          {selectedDayTasks.length === 0 ? (
            <View
              className="items-center justify-center rounded-2xl py-10"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <MaterialIcons
                name="event-available"
                size={26}
                color="rgba(245,243,255,0.35)"
              />
              <Text
                className="text-[13px] mt-2"
                style={{ color: "rgba(245,243,255,0.45)" }}
              >
                Nothing scheduled this day
              </Text>
            </View>
          ) : (
            selectedDayTasks.map((t) => (
              <GlassCard key={t.id} style={{ marginBottom: 12, padding: 14 }}>
                <View className="flex-row items-start gap-3">
                  <View style={{ flex: 1 }}>
                    <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${PRIORITY_META[t.priority].color}22`,
                        }}
                      >
                        <View
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: PRIORITY_META[t.priority].color,
                          }}
                        />
                        <Text
                          className="text-[10px] font-bold"
                          style={{ color: PRIORITY_META[t.priority].color }}
                        >
                          {PRIORITY_META[t.priority].label}
                        </Text>
                      </View>

                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      >
                        <MaterialIcons
                          name={CATEGORY_ICON[t.category]}
                          size={11}
                          color="rgba(245,243,255,0.6)"
                        />
                        <Text
                          className="text-[10.5px] font-medium"
                          style={{ color: "rgba(245,243,255,0.6)" }}
                        >
                          {CATEGORY_LABELS[t.category]}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-1">
                        <MaterialIcons
                          name="schedule"
                          size={11}
                          color="rgba(245,243,255,0.45)"
                        />
                        <Text
                          className="text-[10.5px]"
                          style={{ color: "rgba(245,243,255,0.45)" }}
                        >
                          {t.scheduledTime}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className="text-[15px] font-bold mb-1"
                      style={{
                        color: t.done ? "rgba(245,243,255,0.4)" : "#f5f3ff",
                        textDecorationLine: t.done ? "line-through" : "none",
                      }}
                    >
                      {t.title}
                    </Text>
                    <Text
                      className="text-[12.5px]"
                      style={{ color: "rgba(245,243,255,0.45)" }}
                      numberOfLines={2}
                    >
                      {t.notes.trim() ||
                        (t.subtasks.length > 0
                          ? `${t.subtasks.length} subtask${t.subtasks.length === 1 ? "" : "s"}`
                          : CATEGORY_LABELS[t.category])}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleTask(t.id)}
                    className="w-6 h-6 rounded-full items-center justify-center"
                    style={{
                      borderWidth: t.done ? 0 : 1.5,
                      borderColor: "rgba(255,255,255,0.3)",
                      backgroundColor: t.done ? "#7c6cf6" : "transparent",
                    }}
                  >
                    {t.done && (
                      <MaterialIcons name="check" size={13} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomTabBar
        active={activeTab}
        onPressTab={handlePressTab}
        onPressAdd={() => router.push("/new-task")}
      />
    </View>
  );
}