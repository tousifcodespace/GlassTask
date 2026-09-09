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
import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";

import { BottomTabBar, TabKey } from "@/components/bottom-tab-bar";
import { GlassCard } from "@/components/glass-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import { TAB_ROUTES } from "@/lib/tab-routes";
import { Task, toISODate, useTaskStore } from "@/store/tasks";

type Period = "today" | "week" | "month" | "year";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

const PERIOD_TITLE: Record<Period, string> = {
  today: "Today's Velocity",
  week: "Weekly Velocity",
  month: "Monthly Velocity",
  year: "Yearly Velocity",
};

const WEEKDAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTH_NAMES = [
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

/** Mon=0 ... Sun=6, unlike Date#getDay's Sun=0 ... Sat=6. */
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - mondayIndex(d));
  return d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

function rangeForPeriod(period: Period, anchor: Date): [string, string] {
  switch (period) {
    case "today": {
      const iso = toISODate(anchor);
      return [iso, iso];
    }
    case "week": {
      const start = startOfWeek(anchor);
      return [toISODate(start), toISODate(addDays(start, 6))];
    }
    case "month":
      return [toISODate(startOfMonth(anchor)), toISODate(endOfMonth(anchor))];
    case "year":
      return [toISODate(startOfYear(anchor)), toISODate(endOfYear(anchor))];
  }
}

/** The equivalent-length period immediately before the given range. */
function previousRange(period: Period, anchor: Date): [string, string] {
  switch (period) {
    case "today": {
      const prev = addDays(anchor, -1);
      const iso = toISODate(prev);
      return [iso, iso];
    }
    case "week": {
      const start = addDays(startOfWeek(anchor), -7);
      return [toISODate(start), toISODate(addDays(start, 6))];
    }
    case "month": {
      const prevMonthAnchor = new Date(
        anchor.getFullYear(),
        anchor.getMonth() - 1,
        1,
      );
      return [
        toISODate(startOfMonth(prevMonthAnchor)),
        toISODate(endOfMonth(prevMonthAnchor)),
      ];
    }
    case "year": {
      const prevYearAnchor = new Date(anchor.getFullYear() - 1, 0, 1);
      return [
        toISODate(startOfYear(prevYearAnchor)),
        toISODate(endOfYear(prevYearAnchor)),
      ];
    }
  }
}

function inRange(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

function CircularProgress({ percent }: { percent: number }) {
  const theme = useAppTheme();
  const size = 100;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference * (1 - clamped / 100);

  const label =
    clamped >= 80
      ? "OPTIMAL"
      : clamped >= 50
        ? "GOOD"
        : clamped > 0
          ? "LOW"
          : "—";

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7c6cf6" />
            <Stop offset="100%" stopColor="#22d3ee" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.divider}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <MaterialIcons name="bolt" size={18} color="#3fe0c5" />
        <Text
          className="text-[9px] font-bold mt-0.5"
          style={{ color: theme.textMuted }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const tasks = useTaskStore((s) => s.tasks);

  const [activeTab, setActiveTab] = useState<TabKey>("stats");
  const [period, setPeriod] = useState<Period>("week");

  const handlePressTab = (key: TabKey) => {
    setActiveTab(key);
    const route = TAB_ROUTES[key];
    if (route) router.push(route);
  };

  const today = useMemo(() => new Date(), []);
  const todayISO = toISODate(today);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!map[t.scheduledDateISO]) map[t.scheduledDateISO] = [];
      map[t.scheduledDateISO].push(t);
    }
    return map;
  }, [tasks]);

  const [rangeStart, rangeEnd] = rangeForPeriod(period, today);
  const periodTasks = useMemo(
    () =>
      tasks.filter((t) => inRange(t.scheduledDateISO, rangeStart, rangeEnd)),
    [tasks, rangeStart, rangeEnd],
  );
  const doneCount = periodTasks.filter((t) => t.done).length;
  const totalCount = periodTasks.length;
  const percent =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const pendingCount = totalCount - doneCount;

  const [prevStart, prevEnd] = previousRange(period, today);
  const prevTasks = useMemo(
    () => tasks.filter((t) => inRange(t.scheduledDateISO, prevStart, prevEnd)),
    [tasks, prevStart, prevEnd],
  );
  const prevDone = prevTasks.filter((t) => t.done).length;
  const prevPercent =
    prevTasks.length === 0
      ? null
      : Math.round((prevDone / prevTasks.length) * 100);
  const trendDelta = prevPercent === null ? null : percent - prevPercent;

  const completedToday = tasks.filter(
    (t) => t.scheduledDateISO === todayISO && t.done,
  ).length;

  // Weekday bar chart always reflects the current Mon–Sun week, regardless
  // of the period tab selected above — matching the reference design.
  const weekStart = startOfWeek(today);
  const weekCounts = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const iso = toISODate(addDays(weekStart, i));
      return (tasksByDate[iso] ?? []).filter((t) => t.done).length;
    });
  }, [tasksByDate, weekStart]);
  const maxWeekCount = Math.max(...weekCounts, 1);
  const peakDayIndex = weekCounts.indexOf(Math.max(...weekCounts));
  const avgPerDay = (weekCounts.reduce((a, b) => a + b, 0) / 7).toFixed(1);

  // Streak: consecutive days up to and including today with >=1 completed task.
  const streak = useMemo(() => {
    let count = 0;
    let cursor = today;
    while (true) {
      const iso = toISODate(cursor);
      const doneHere = (tasksByDate[iso] ?? []).filter((t) => t.done).length;
      if (doneHere === 0) break;
      count++;
      cursor = addDays(cursor, -1);
    }
    return count;
  }, [tasksByDate, today]);

  // Best day: weekday with the most completed tasks across all-time data.
  const bestDay = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    for (const t of tasks) {
      if (!t.done) continue;
      const d = new Date(`${t.scheduledDateISO}T00:00:00`);
      totals[mondayIndex(d)]++;
    }
    const max = Math.max(...totals);
    if (max === 0) return null;
    return { name: WEEKDAY_NAMES[totals.indexOf(max)], count: max };
  }, [tasks]);

  const dateLabel = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
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
            <View className="flex-row items-center gap-2.5" style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/")
                }
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <MaterialIcons name="arrow-back" size={19} color={theme.text} />
              </TouchableOpacity>
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#3fe0c5" }}
              />
              <Text
                className="text-[17px] font-bold"
                style={{ color: theme.text }}
                numberOfLines={1}
              >
                Productivity Insights
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <MaterialIcons name="more-vert" size={18} color={theme.text} />
              </TouchableOpacity>
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

          {/* Live metrics banner */}
          <View className="flex-row items-center justify-between mb-5">
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#3fe0c5" }}
                />
                <Text
                  className="text-[10.5px] font-bold uppercase tracking-wider"
                  style={{ color: "#3fe0c5" }}
                >
                  Live Metrics • Realtime
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mb-1">
                <Text
                  className="text-[26px] font-extrabold"
                  style={{ color: theme.text }}
                >
                  Productivity
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: theme.divider }}
                >
                  <Text
                    className="text-[10.5px] font-semibold"
                    style={{ color: theme.textMuted }}
                  >
                    v2.4
                  </Text>
                </View>
              </View>
              <Text className="text-[13px]" style={{ color: theme.textFaint }}>
                Track your progress and stay consistent
              </Text>
            </View>

            <View
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
              style={{
                backgroundColor: theme.chipBg,
                borderWidth: 1,
                borderColor: theme.chipBorder,
              }}
            >
              <MaterialIcons name="calendar-today" size={13} color="#cabeff" />
              <Text
                className="text-[12.5px] font-semibold"
                style={{ color: theme.text }}
              >
                {dateLabel}
              </Text>
            </View>
          </View>

          {/* Period tabs */}
          <View
            className="flex-row p-1 rounded-full mb-5"
            style={{
              backgroundColor: theme.chipBg,
              borderWidth: 1,
              borderColor: theme.chipBorder,
            }}
          >
            {PERIODS.map((p) => {
              const active = p.key === period;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPeriod(p.key)}
                  style={{ flex: 1 }}
                >
                  {active ? (
                    <LinearGradient
                      colors={["#7c6cf6", "#4f8ef7"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        paddingVertical: 9,
                        borderRadius: 100,
                        alignItems: "center",
                      }}
                    >
                      <Text className="text-[13px] font-semibold text-white">
                        {p.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={{ paddingVertical: 9, alignItems: "center" }}>
                      <Text
                        className="text-[13px] font-medium"
                        style={{ color: theme.textMuted }}
                      >
                        {p.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Weekly velocity card */}
          <GlassCard style={{ marginBottom: 16, padding: 18 }}>
            <View className="flex-row items-center justify-between">
              <View style={{ flex: 1 }}>
                <View className="flex-row items-center gap-1.5 mb-2">
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#3fe0c5" }}
                  />
                  <Text
                    className="text-[10.5px] font-bold uppercase tracking-wider"
                    style={{ color: "#3fe0c5" }}
                  >
                    {PERIOD_TITLE[period]}
                  </Text>
                </View>
                <Text
                  className="text-[38px] font-extrabold mb-1"
                  style={{ color: theme.text }}
                >
                  {percent}%
                </Text>
                <Text
                  className="text-[13px] mb-3"
                  style={{ color: theme.textFaint }}
                >
                  {doneCount} of {totalCount} task{totalCount === 1 ? "" : "s"}{" "}
                  complete
                </Text>
                {trendDelta !== null && (
                  <View
                    className="flex-row items-center gap-1.5 self-start px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        trendDelta >= 0
                          ? "rgba(63,224,197,0.14)"
                          : "rgba(255,107,129,0.14)",
                    }}
                  >
                    <MaterialIcons
                      name={trendDelta >= 0 ? "trending-up" : "trending-down"}
                      size={13}
                      color={trendDelta >= 0 ? "#3fe0c5" : "#ff6b81"}
                    />
                    <Text
                      className="text-[11.5px] font-semibold"
                      style={{ color: trendDelta >= 0 ? "#3fe0c5" : "#ff6b81" }}
                    >
                      {trendDelta >= 0 ? "+" : ""}
                      {trendDelta}% vs last {period}
                    </Text>
                  </View>
                )}
              </View>

              <CircularProgress percent={percent} />
            </View>
          </GlassCard>

          {/* Completed / Pending cards */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <GlassCard
              style={{
                flex: 1,
                padding: 14,
                borderColor: "rgba(63,224,197,0.18)",
              }}
              overlayColor="rgba(63,224,197,0.08)"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "rgba(63,224,197,0.15)",
                    borderWidth: 1,
                    borderColor: "rgba(63,224,197,0.35)",
                  }}
                >
                  <MaterialIcons
                    name="check-circle-outline"
                    size={15}
                    color="#3fe0c5"
                  />
                </View>
                {completedToday > 0 && (
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(63,224,197,0.15)" }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: "#3fe0c5" }}
                    >
                      +{completedToday} today
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="text-[26px] font-extrabold mb-0.5"
                style={{ color: theme.text }}
              >
                {doneCount}
              </Text>
              <Text
                className="text-[12.5px]"
                style={{ color: theme.textFaint }}
              >
                Completed Tasks
              </Text>
            </GlassCard>

            <GlassCard
              style={{
                flex: 1,
                padding: 14,
                borderColor: "rgba(124,108,246,0.22)",
              }}
              overlayColor="rgba(124,108,246,0.1)"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "rgba(124,108,246,0.18)",
                    borderWidth: 1,
                    borderColor: "rgba(124,108,246,0.4)",
                  }}
                >
                  <MaterialIcons name="schedule" size={15} color="#cabeff" />
                </View>
                {pendingCount > 0 && (
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(124,108,246,0.18)" }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: "#cabeff" }}
                    >
                      Due soon
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className="text-[26px] font-extrabold mb-0.5"
                style={{ color: theme.text }}
              >
                {pendingCount}
              </Text>
              <Text
                className="text-[12.5px]"
                style={{ color: theme.textFaint }}
              >
                Pending Tasks
              </Text>
            </GlassCard>
          </View>

          {/* Task completion bar chart */}
          <GlassCard style={{ marginBottom: 16, padding: 16 }}>
            <View className="flex-row items-start justify-between mb-5">
              <View>
                <Text
                  className="text-[16px] font-bold mb-0.5"
                  style={{ color: theme.text }}
                >
                  Task Completion
                </Text>
                <Text
                  className="text-[12px]"
                  style={{ color: theme.textFaint }}
                >
                  Daily velocity breakdown
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                style={{ backgroundColor: theme.chipBg }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#3fe0c5" }}
                />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: theme.textMuted }}
                >
                  Avg: {avgPerDay} / day
                </Text>
              </View>
            </View>

            <View
              className="flex-row items-end justify-between"
              style={{ height: 120 }}
            >
              {weekCounts.map((count, i) => {
                const isPeak = i === peakDayIndex && count > 0;
                const BAR_MAX_HEIGHT = 90;
                const barHeight =
                  count === 0
                    ? 4
                    : Math.max(
                        4,
                        Math.round((count / maxWeekCount) * BAR_MAX_HEIGHT),
                      );
                return (
                  <View
                    key={i}
                    style={{
                      alignItems: "center",
                      flex: 1,
                      justifyContent: "flex-end",
                      height: "100%",
                    }}
                  >
                    {isPeak ? (
                      <MaterialIcons
                        name="star"
                        size={12}
                        color={theme.text}
                        style={{ marginBottom: 2 }}
                      />
                    ) : (
                      <Text
                        className="text-[11px] font-semibold mb-1"
                        style={{ color: theme.textMuted }}
                      >
                        {count}
                      </Text>
                    )}
                    <View
                      style={{
                        width: 18,
                        height: barHeight,
                        borderRadius: 9,
                        overflow: "hidden",
                        backgroundColor: isPeak
                          ? undefined
                          : `${theme.accentPurple}59`,
                      }}
                    >
                      {isPeak && (
                        <LinearGradient
                          colors={["#22d3ee", "#7c6cf6"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={{ width: "100%", height: "100%" }}
                        />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-2">
              {WEEKDAY_SHORT.map((w, i) => (
                <Text
                  key={i}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: i === peakDayIndex ? "700" : "500",
                    color: i === peakDayIndex ? "#3fe0c5" : theme.textFaint,
                  }}
                >
                  {w}
                </Text>
              ))}
            </View>
          </GlassCard>

          {/* Streak card */}
          <GlassCard
            style={{
              marginBottom: 12,
              padding: 14,
              borderColor: "rgba(255,107,129,0.2)",
            }}
            overlayColor="rgba(255,107,129,0.07)"
          >
            <TouchableOpacity className="flex-row items-center gap-3">
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(255,107,129,0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(255,107,129,0.35)",
                }}
              >
                <MaterialIcons
                  name="local-fire-department"
                  size={20}
                  color="#ff6b81"
                />
              </View>
              <View style={{ flex: 1 }}>
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: theme.text }}
                  >
                    {streak} Day Streak
                  </Text>
                  {streak >= 3 && (
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#ff6b81" }}
                    >
                      <Text className="text-[9.5px] font-bold text-white">
                        HOT
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  className="text-[12px]"
                  style={{ color: theme.textFaint }}
                >
                  {streak === 0
                    ? "Complete a task today to start a streak."
                    : "Keep going! You're doing great."}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={theme.textFaint}
              />
            </TouchableOpacity>
          </GlassCard>

          {/* Best day card */}
          <GlassCard
            style={{
              padding: 14,
              borderColor: "rgba(63,224,197,0.2)",
            }}
            overlayColor="rgba(63,224,197,0.07)"
          >
            <TouchableOpacity className="flex-row items-center gap-3">
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(63,224,197,0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(63,224,197,0.35)",
                }}
              >
                <MaterialIcons name="emoji-events" size={20} color="#3fe0c5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  className="text-[10.5px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: theme.textFaint }}
                >
                  Your Best Day
                </Text>
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: theme.text }}
                  >
                    {bestDay ? bestDay.name : "Not enough data"}
                  </Text>
                  {bestDay && (
                    <Text
                      className="text-[12.5px] font-semibold"
                      style={{ color: "#3fe0c5" }}
                    >
                      • {bestDay.count} task{bestDay.count === 1 ? "" : "s"}
                    </Text>
                  )}
                </View>
                <Text
                  className="text-[12px]"
                  style={{ color: theme.textFaint }}
                >
                  {bestDay
                    ? "Your most productive weekday overall"
                    : "Complete a few tasks to see a pattern"}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={18}
                color={theme.textFaint}
              />
            </TouchableOpacity>
          </GlassCard>
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
