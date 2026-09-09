import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Linking, Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/glass-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  Priority,
  computeBestStreak,
  computeCurrentStreak,
  formatRelativeToNow,
  getNextUpTask,
  getTodayProgress,
  parseScheduledDateTime,
  useTaskStore,
} from "@/store/tasks";

export function NextUpStreaksRow() {
  const theme = useAppTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const pulse = useRef(new Animated.Value(1)).current;

  const PRIORITY_STYLE: Record<Priority, { color: string; label: string }> = {
    high: { color: theme.accentRed, label: "High" },
    medium: { color: theme.accentOrange, label: "Medium" },
    low: { color: theme.accentTeal, label: "Low" },
  };

  // Ticks every 30s so "in 25m" counts down without needing a manual refresh.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const nextUp = useMemo(() => getNextUpTask(tasks), [tasks]);
  const currentStreak = useMemo(() => computeCurrentStreak(tasks), [tasks]);
  const bestStreak = useMemo(() => computeBestStreak(tasks), [tasks]);
  const todayProgress = useMemo(() => getTodayProgress(tasks), [tasks]);

  const priorityStyle = nextUp
    ? PRIORITY_STYLE[nextUp.priority]
    : PRIORITY_STYLE.medium;
  const relativeLabel = nextUp
    ? formatRelativeToNow(parseScheduledDateTime(nextUp))
    : "";

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {/* Next Up tile */}
      <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }}>
        <GlassCard style={{ flex: 1, padding: 14 }}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1">
              <Animated.View
                style={{
                  transform: [{ scale: pulse }],
                  opacity: pulse.interpolate({
                    inputRange: [1, 1.8],
                    outputRange: [1, 0],
                  }),
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: priorityStyle.color,
                }}
              />
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: theme.accentPurpleLight }}
              >
                Next Up
              </Text>
            </View>
            {nextUp && (
              <View
                className="px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${priorityStyle.color}2e`,
                  borderWidth: 1,
                  borderColor: `${priorityStyle.color}4d`,
                }}
              >
                <Text
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: priorityStyle.color }}
                >
                  {priorityStyle.label}
                </Text>
              </View>
            )}
          </View>

          {nextUp ? (
            <>
              <Text
                numberOfLines={2}
                className="text-[15px] font-bold"
                style={{ color: theme.text }}
              >
                {nextUp.title}
              </Text>

              <View className="flex-row items-center justify-between mt-3">
                <View className="flex-row items-center gap-1">
                  <MaterialIcons
                    name="schedule"
                    size={14}
                    color={theme.textFaint}
                  />
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: theme.text }}
                  >
                    {nextUp.scheduledTime}
                  </Text>
                </View>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${theme.accentPurple}33` }}
                >
                  <Text
                    className="text-[10px] font-semibold"
                    style={{ color: theme.accentPurpleLight }}
                  >
                    {relativeLabel}
                  </Text>
                </View>
              </View>

              {!!nextUp.link && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(nextUp.link)}
                  className="flex-row items-center gap-1.5 mt-2.5 pt-2.5"
                  style={{ borderTopWidth: 1, borderTopColor: theme.divider }}
                >
                  <MaterialIcons
                    name="link"
                    size={13}
                    color={theme.accentPurpleLight}
                  />
                  <Text
                    numberOfLines={1}
                    className="text-[11px] font-semibold flex-1"
                    style={{ color: theme.accentPurpleLight }}
                  >
                    {nextUp.link.replace(/^https?:\/\//, "")}
                  </Text>
                  <MaterialIcons
                    name="open-in-new"
                    size={12}
                    color={theme.accentPurpleLight}
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="mt-1">
              <Text
                className="text-[14px] font-bold"
                style={{ color: theme.text }}
              >
                All caught up 🎉
              </Text>
              <Text
                className="text-[11px] mt-1"
                style={{ color: theme.textFaint }}
              >
                No pending tasks
              </Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>

      {/* Streaks & Today tile */}
      <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }}>
        <GlassCard style={{ flex: 1, padding: 14 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: theme.textMuted }}
            >
              Streaks
            </Text>
            <Text className="text-sm">🔥</Text>
          </View>

          <Text
            className="text-[22px] font-extrabold"
            style={{ color: theme.text }}
          >
            {currentStreak} {currentStreak === 1 ? "Day" : "Days"}
          </Text>
          <Text
            className="text-[11px] mt-0.5"
            style={{ color: theme.accentTeal }}
          >
            Record: {bestStreak} {bestStreak === 1 ? "day" : "days"}
          </Text>

          <View
            className="flex-row items-center justify-between mt-3 pt-2"
            style={{ borderTopWidth: 1, borderTopColor: theme.divider }}
          >
            <View className="flex-row items-center gap-1">
              <MaterialIcons
                name="today"
                size={13}
                color={theme.accentPurpleLight}
              />
              <Text className="text-[11px]" style={{ color: theme.textMuted }}>
                Today:
              </Text>
            </View>
            <Text
              className="text-[11px] font-semibold"
              style={{ color: theme.text }}
            >
              {todayProgress.done}/{todayProgress.total} done
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </View>
  );
}
