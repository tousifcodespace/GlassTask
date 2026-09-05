import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from "react-native-svg";

import { BottomTabBar, TabKey } from "@/components/bottom-tab-bar";
import { GlassCard } from "@/components/glass-card";
import { SettingsRow } from "@/components/settings-row";
import { TAB_ROUTES } from "@/lib/tab-routes";
import { ThemeMode, useSettingsStore } from "@/store/settings";
import { toISODate, useTaskStore } from "@/store/tasks";

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: "dark", label: "Dark" },
  { key: "fluid", label: "Fluid" },
  { key: "system", label: "System" },
];

/** Consecutive days up to and including today with at least one completed task. */
function computeStreak(
  tasksByDate: Record<string, { done: boolean }[]>,
  today: Date,
): number {
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

function StreakRing({ streak, goal = 30 }: { streak: number; goal?: number }) {
  const size = 92;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, (streak / goal) * 100);
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3fe0c5" />
            <Stop offset="100%" stopColor="#7c6cf6" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#streakGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text className="text-[20px] font-extrabold" style={{ color: "#f5f3ff" }}>
          {streak}d
        </Text>
        <Text
          className="text-[8.5px] font-bold uppercase tracking-wider"
          style={{ color: "rgba(245,243,255,0.5)" }}
        >
          Streak
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const tasks = useTaskStore((s) => s.tasks);

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const reminderOffsetMinutes = useSettingsStore((s) => s.reminderOffsetMinutes);
  const soundHapticsEnabled = useSettingsStore((s) => s.soundHapticsEnabled);
  const toggleSoundHaptics = useSettingsStore((s) => s.toggleSoundHaptics);

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const handlePressTab = (key: TabKey) => {
    setActiveTab(key);
    const route = TAB_ROUTES[key];
    if (route) router.push(route);
  };

  const totalCompleted = tasks.filter((t) => t.done).length;
  const flowRate =
    tasks.length === 0
      ? 0
      : Math.round((totalCompleted / tasks.length) * 1000) / 10;

  const streak = useMemo(() => {
    const tasksByDate: Record<string, { done: boolean }[]> = {};
    for (const t of tasks) {
      if (!tasksByDate[t.scheduledDateISO]) tasksByDate[t.scheduledDateISO] = [];
      tasksByDate[t.scheduledDateISO].push({ done: t.done });
    }
    return computeStreak(tasksByDate, new Date());
  }, [tasks]);

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
                Profile
              </Text>
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#3fe0c5" }}
              />
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
                <MaterialIcons name="settings" size={17} color="#f5f3ff" />
              </TouchableOpacity>
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ borderWidth: 1.5, borderColor: "#3fe0c5" }}
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

          {/* Identity + streak cards */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <GlassCard style={{ flex: 1.1, padding: 16 }}>
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                style={{
                  borderWidth: 1.5,
                  borderColor: "#7c6cf6",
                  backgroundColor: "rgba(124,108,246,0.15)",
                }}
              >
                <MaterialIcons name="person" size={28} color="#cabeff" />
              </View>
              <Text
                className="text-[16px] font-bold mb-0.5"
                style={{ color: "#f5f3ff" }}
              >
                Tousif
              </Text>
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-2"
                style={{ color: "#3fe0c5" }}
              >
                Quantum Node
              </Text>
              <Text
                className="text-[12px] mb-3"
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Stay focused. Get things done.
              </Text>
              <TouchableOpacity
                className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                <MaterialIcons name="edit" size={13} color="rgba(245,243,255,0.75)" />
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: "rgba(245,243,255,0.75)" }}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard style={{ flex: 0.9, padding: 16, alignItems: "center" }}>
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
                style={{ backgroundColor: "rgba(124,108,246,0.25)" }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#cabeff" }}
                />
                <Text
                  className="text-[9.5px] font-bold"
                  style={{ color: "#e4defc" }}
                >
                  FLOW MASTER
                </Text>
              </View>

              <StreakRing streak={streak} />

              <TouchableOpacity
                className="flex-row items-center gap-1.5 mt-3 px-3 py-2 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                <MaterialIcons name="bolt" size={12} color="#3fe0c5" />
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: "rgba(245,243,255,0.75)" }}
                >
                  Peak Focus
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* Stat cards */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <GlassCard style={{ flex: 1, padding: 14 }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: "rgba(245,243,255,0.45)" }}
                  >
                    Completed
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text
                      className="text-[24px] font-extrabold"
                      style={{ color: "#3fe0c5" }}
                    >
                      {totalCompleted}
                    </Text>
                    <Text
                      className="text-[12px] font-medium"
                      style={{ color: "rgba(245,243,255,0.45)" }}
                    >
                      tasks
                    </Text>
                  </View>
                </View>
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 1.5,
                    borderColor: "rgba(63,224,197,0.5)",
                  }}
                >
                  <MaterialIcons name="check" size={16} color="#3fe0c5" />
                </View>
              </View>
            </GlassCard>

            <GlassCard style={{ flex: 1, padding: 14 }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: "rgba(245,243,255,0.45)" }}
                  >
                    Flow Rate
                  </Text>
                  <Text
                    className="text-[24px] font-extrabold"
                    style={{ color: "#cabeff" }}
                  >
                    {flowRate}%
                  </Text>
                </View>
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 1.5,
                    borderColor: "rgba(124,108,246,0.5)",
                  }}
                >
                  <MaterialIcons name="insights" size={16} color="#cabeff" />
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Preferences */}
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "#3fe0c5" }}
            >
              Preferences
            </Text>
            <Text
              className="text-[11px]"
              style={{ color: "rgba(245,243,255,0.4)" }}
            >
              Active Configuration
            </Text>
          </View>

          <GlassCard style={{ marginBottom: 24, paddingHorizontal: 16 }}>
            <View className="py-3.5">
              <View className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                >
                  <MaterialIcons name="palette" size={17} color="#f5f3ff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    className="text-[14.5px] font-bold"
                    style={{ color: "#f5f3ff" }}
                  >
                    Appearance
                  </Text>
                  <Text
                    className="text-[11.5px] mt-0.5"
                    style={{ color: "rgba(245,243,255,0.45)" }}
                  >
                    Liquid, Dark, or Adaptive
                  </Text>
                </View>
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <Text
                    className="text-[10px] font-semibold"
                    style={{ color: "rgba(245,243,255,0.6)" }}
                  >
                    Active
                  </Text>
                </View>
              </View>

              <View
                className="flex-row p-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                {THEME_OPTIONS.map((opt) => {
                  const active = opt.key === themeMode;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={{ flex: 1 }}
                      onPress={() => setThemeMode(opt.key)}
                    >
                      <View
                        style={{
                          paddingVertical: 8,
                          borderRadius: 100,
                          alignItems: "center",
                          backgroundColor: active
                            ? "rgba(124,108,246,0.35)"
                            : "transparent",
                        }}
                      >
                        <Text
                          className="text-[12.5px] font-semibold"
                          style={{
                            color: active ? "#fff" : "rgba(245,243,255,0.5)",
                          }}
                        >
                          {opt.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />

            <SettingsRow
              icon="notifications"
              iconColor="#3fe0c5"
              iconBg="rgba(63,224,197,0.15)"
              title="Reminders & Notifications"
              subtitle="Manage proactive alerts"
              onPress={() => router.push("/notifications")}
              right={
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#3fe0c5" }}
                  />
                  <MaterialIcons
                    name="chevron-right"
                    size={17}
                    color="rgba(245,243,255,0.35)"
                  />
                </View>
              }
            />

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />

            <SettingsRow
              icon="schedule"
              title="Default Reminder"
              subtitle="Standard task prompt offset"
              onPress={() => router.push("/notifications")}
              right={
                <View className="flex-row items-center gap-2">
                  <View
                    className="px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(124,108,246,0.25)" }}
                  >
                    <Text
                      className="text-[11px] font-semibold"
                      style={{ color: "#e4defc" }}
                    >
                      {reminderOffsetMinutes} min
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={17}
                    color="rgba(245,243,255,0.35)"
                  />
                </View>
              }
            />

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />

            <SettingsRow
              icon="graphic-eq"
              title="Sound & Haptics"
              subtitle="Acoustic & tactile feedback"
              right={
                <Switch
                  value={soundHapticsEnabled}
                  onValueChange={toggleSoundHaptics}
                  trackColor={{ false: "rgba(255,255,255,0.15)", true: "#3fe0c5" }}
                  thumbColor="#f5f3ff"
                />
              }
            />
          </GlassCard>

          {/* App environment */}
          <Text
            className="text-[11px] font-bold uppercase tracking-wider mb-3"
            style={{ color: "rgba(245,243,255,0.4)" }}
          >
            App Environment
          </Text>

          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <SettingsRow
              icon="lock-outline"
              iconBg="rgba(255,255,255,0.07)"
              iconColor="#f5f3ff"
              title="Privacy & Security"
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color="rgba(245,243,255,0.35)"
                />
              }
            />
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <SettingsRow
              icon="help-outline"
              iconBg="rgba(255,255,255,0.07)"
              iconColor="#f5f3ff"
              title="Help & Community"
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color="rgba(245,243,255,0.35)"
                />
              }
            />
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />
            <SettingsRow
              icon="invert-colors"
              iconBg="rgba(255,255,255,0.07)"
              iconColor="#f5f3ff"
              title="About GlassTask"
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color="rgba(245,243,255,0.35)"
                />
              }
            />
          </GlassCard>

          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl mb-4"
            style={{
              backgroundColor: "rgba(180,40,50,0.15)",
              borderWidth: 1,
              borderColor: "rgba(255,107,129,0.3)",
            }}
          >
            <MaterialIcons name="logout" size={16} color="#ff9494" />
            <Text className="text-[14px] font-semibold" style={{ color: "#ff9494" }}>
              Log Out of Workspace
            </Text>
          </TouchableOpacity>

          <Text
            className="text-[11px] text-center"
            style={{ color: "rgba(245,243,255,0.3)" }}
          >
            Version 1.0.0 • GlassTask Quantum Engine
          </Text>
          <Text
            className="text-[10.5px] text-center mt-0.5"
            style={{ color: "rgba(245,243,255,0.22)" }}
          >
            Encrypted Silica Sync Enabled
          </Text>
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