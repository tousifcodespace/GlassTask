import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useId, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
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

import { AvatarImage } from "@/components/avatar-image";
import { BottomTabBar, TabKey } from "@/components/bottom-tab-bar";
import { GlassCard } from "@/components/glass-card";
import { SettingsRow } from "@/components/settings-row";
import type { AppTheme } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { TAB_ROUTES } from "@/lib/tab-routes";
import { useAuthStore } from "@/store/auth";
import { useProfileStore } from "@/store/profile";
import { ThemeMode, useSettingsStore } from "@/store/settings";
import { computeCurrentStreak, useTaskStore } from "@/store/tasks";

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: "dark", label: "Dark" },
  { key: "light", label: "Light" },
  { key: "system", label: "System" },
];

function StreakRing({
  streak,
  theme,
  goal = 30,
}: {
  streak: number;
  theme: AppTheme;
  goal?: number;
}) {
  const size = 92;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradId = `streakGrad-${useId()}`;
  const percent = Math.min(100, (streak / goal) * 100);
  const dashOffset = circumference * (1 - percent / 100);

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
          <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.accentTeal} />
            <Stop offset="100%" stopColor={theme.accentPurple} />
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
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text
          className="text-[20px] font-extrabold"
          style={{ color: theme.text }}
        >
          {streak}d
        </Text>
        <Text
          className="text-[8.5px] font-bold uppercase tracking-wider"
          style={{ color: theme.textFaint }}
        >
          Streak
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const profile = useProfileStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const reminderOffsetMinutes = useSettingsStore(
    (s) => s.reminderOffsetMinutes,
  );
  const cycleReminderOffset = useSettingsStore((s) => s.cycleReminderOffset);
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

  const streak = useMemo(() => computeCurrentStreak(tasks), [tasks]);

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
            <View className="flex-row items-center gap-2.5">
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
              <Text
                className="text-[19px] font-bold"
                style={{ color: theme.text }}
              >
                Profile
              </Text>
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.accentTeal }}
              />
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
                <MaterialIcons name="settings" size={17} color={theme.text} />
              </TouchableOpacity>
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ borderWidth: 1.5, borderColor: theme.accentTeal }}
              >
                <AvatarImage size={32} />
              </View>
            </View>
          </View>

          {/* Identity + streak cards */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <GlassCard style={{ flex: 1.1, padding: 16 }}>
              <TouchableOpacity
                onPress={() => router.push("/edit-profile")}
                className="w-16 h-16 rounded-2xl items-center justify-center mb-3 overflow-hidden"
                style={{
                  borderWidth: 1.5,
                  borderColor: theme.accentPurple,
                  backgroundColor: `${theme.accentPurple}26`,
                }}
              >
                <AvatarImage size={60} />
              </TouchableOpacity>
              <Text
                className="text-[16px] font-bold mb-0.5"
                style={{ color: theme.text }}
              >
                {profile.fullName || "Add your name"}
              </Text>
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-2"
                style={{ color: theme.accentTeal }}
              >
                Quantum Node
              </Text>
              <Text
                className="text-[12px] mb-3"
                style={{ color: theme.textFaint }}
              >
                {profile.bio || "Add a short bio"}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/edit-profile")}
                className="flex-row items-center justify-center gap-1.5 py-2.5 rounded-full"
                style={{ backgroundColor: theme.chipBg }}
              >
                <MaterialIcons name="edit" size={13} color={theme.textMuted} />
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: theme.textMuted }}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard style={{ flex: 0.9, padding: 16, alignItems: "center" }}>
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
                style={{ backgroundColor: `${theme.accentPurple}40` }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: theme.accentPurpleLight }}
                />
                <Text
                  className="text-[9.5px] font-bold"
                  style={{
                    color:
                      theme.mode === "light" ? theme.accentPurple : "#e4defc",
                  }}
                >
                  FLOW MASTER
                </Text>
              </View>

              <StreakRing streak={streak} theme={theme} />

              <TouchableOpacity
                className="flex-row items-center gap-1.5 mt-3 px-3 py-2 rounded-full"
                style={{ backgroundColor: theme.chipBg }}
              >
                <MaterialIcons name="bolt" size={12} color={theme.accentTeal} />
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: theme.textMuted }}
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
                    style={{ color: theme.textFaint }}
                  >
                    Completed
                  </Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text
                      className="text-[24px] font-extrabold"
                      style={{ color: theme.accentTeal }}
                    >
                      {totalCompleted}
                    </Text>
                    <Text
                      className="text-[12px] font-medium"
                      style={{ color: theme.textFaint }}
                    >
                      tasks
                    </Text>
                  </View>
                </View>
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 1.5,
                    borderColor: `${theme.accentTeal}80`,
                  }}
                >
                  <MaterialIcons
                    name="check"
                    size={16}
                    color={theme.accentTeal}
                  />
                </View>
              </View>
            </GlassCard>

            <GlassCard style={{ flex: 1, padding: 14 }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: theme.textFaint }}
                  >
                    Flow Rate
                  </Text>
                  <Text
                    className="text-[24px] font-extrabold"
                    style={{ color: theme.accentPurpleLight }}
                  >
                    {flowRate}%
                  </Text>
                </View>
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 1.5,
                    borderColor: `${theme.accentPurple}80`,
                  }}
                >
                  <MaterialIcons
                    name="insights"
                    size={16}
                    color={theme.accentPurpleLight}
                  />
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Preferences */}
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: theme.accentTeal }}
            >
              Preferences
            </Text>
            <Text className="text-[11px]" style={{ color: theme.textSubtle }}>
              Active Configuration
            </Text>
          </View>

          <GlassCard style={{ marginBottom: 24, paddingHorizontal: 16 }}>
            <View className="py-3.5">
              <View className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.chipBg }}
                >
                  <MaterialIcons name="palette" size={17} color={theme.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    className="text-[14.5px] font-bold"
                    style={{ color: theme.text }}
                  >
                    Appearance
                  </Text>
                  <Text
                    className="text-[11.5px] mt-0.5"
                    style={{ color: theme.textFaint }}
                  >
                    Dark, Light, or follow System
                  </Text>
                </View>
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: theme.chipBg }}
                >
                  <Text
                    className="text-[10px] font-semibold"
                    style={{ color: theme.textMuted }}
                  >
                    Active
                  </Text>
                </View>
              </View>

              <View
                className="flex-row p-1 rounded-full"
                style={{ backgroundColor: theme.chipBg }}
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
                            ? `${theme.accentPurple}59`
                            : "transparent",
                        }}
                      >
                        <Text
                          className="text-[12.5px] font-semibold"
                          style={{
                            color: active ? theme.text : theme.textFaint,
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

            <View style={{ height: 1, backgroundColor: theme.divider }} />

            <SettingsRow
              icon="notifications"
              iconColor={theme.accentTeal}
              iconBg={`${theme.accentTeal}26`}
              title="Reminders & Notifications"
              subtitle="Manage proactive alerts"
              onPress={() => router.push("/notifications")}
              right={
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: theme.accentTeal }}
                  />
                  <MaterialIcons
                    name="chevron-right"
                    size={17}
                    color={theme.textSubtle}
                  />
                </View>
              }
            />

            <View style={{ height: 1, backgroundColor: theme.divider }} />

            <SettingsRow
              icon="schedule"
              title="Default Reminder"
              subtitle="Standard task prompt offset"
              onPress={cycleReminderOffset}
              right={
                <View className="flex-row items-center gap-2">
                  <View
                    className="px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${theme.accentPurple}40` }}
                  >
                    <Text
                      className="text-[11px] font-semibold"
                      style={{ color: theme.text }}
                    >
                      {reminderOffsetMinutes} min
                    </Text>
                  </View>
                  <MaterialIcons
                    name="unfold-more"
                    size={17}
                    color={theme.textSubtle}
                  />
                </View>
              }
            />

            <View style={{ height: 1, backgroundColor: theme.divider }} />

            <SettingsRow
              icon="graphic-eq"
              title="Sound & Haptics"
              subtitle="Acoustic & tactile feedback"
              right={
                <Switch
                  value={soundHapticsEnabled}
                  onValueChange={toggleSoundHaptics}
                  trackColor={{ false: theme.divider, true: theme.accentTeal }}
                  thumbColor={theme.mode === "light" ? "#ffffff" : theme.text}
                />
              }
            />
          </GlassCard>

          {/* App environment */}
          <Text
            className="text-[11px] font-bold uppercase tracking-wider mb-3"
            style={{ color: theme.textSubtle }}
          >
            App Environment
          </Text>

          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <SettingsRow
              icon="lock-outline"
              iconBg={theme.chipBg}
              iconColor={theme.text}
              title="Privacy & Security"
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color={theme.textSubtle}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: theme.divider }} />
            <SettingsRow
              icon="help-outline"
              iconBg={theme.chipBg}
              iconColor={theme.text}
              title="Help & Community"
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color={theme.textSubtle}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: theme.divider }} />
            <SettingsRow
              icon="invert-colors"
              iconBg={theme.chipBg}
              iconColor={theme.text}
              title="About GlassTask"
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color={theme.textSubtle}
                />
              }
            />
          </GlassCard>

          <TouchableOpacity
            onPress={logout}
            className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl mb-4"
            style={{
              backgroundColor: `${theme.accentRed}26`,
              borderWidth: 1,
              borderColor: `${theme.accentRed}4d`,
            }}
          >
            <MaterialIcons name="logout" size={16} color={theme.accentRed} />
            <Text
              className="text-[14px] font-semibold"
              style={{ color: theme.accentRed }}
            >
              Log Out of Workspace
            </Text>
          </TouchableOpacity>

          <Text
            className="text-[11px] text-center"
            style={{ color: theme.textSubtle }}
          >
            Version 1.0.0 • GlassTask Quantum Engine
          </Text>
          <Text
            className="text-[10.5px] text-center mt-0.5"
            style={{ color: theme.textSubtle }}
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
