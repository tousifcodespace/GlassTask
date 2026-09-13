import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFocusStore } from "@/store/focus";
import { useTaskStore } from "@/store/tasks";

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function FocusTimerScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);

  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const activeTaskTitle = useFocusStore((s) => s.activeTaskTitle);
  const totalSeconds = useFocusStore((s) => s.totalSeconds);
  const endAt = useFocusStore((s) => s.endAt);
  const remainingSeconds = useFocusStore((s) => s.remainingSeconds);
  const isRunning = useFocusStore((s) => s.isRunning);
  const startFocus = useFocusStore((s) => s.startFocus);
  const pauseFocus = useFocusStore((s) => s.pauseFocus);
  const resumeFocus = useFocusStore((s) => s.resumeFocus);
  const addMinutes = useFocusStore((s) => s.addMinutes);
  const cancelFocus = useFocusStore((s) => s.cancelFocus);
  const finishFocus = useFocusStore((s) => s.finishFocus);

  const task = tasks.find((t) => t.id === (taskId ?? activeTaskId));

  // If the requested task isn't already the active focus session, start one.
  useEffect(() => {
    if (task && activeTaskId !== task.id) {
      startFocus(task);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const secondsLeft =
    isRunning && endAt
      ? Math.max(0, Math.round((endAt - Date.now()) / 1000))
      : (remainingSeconds ?? 0);

  const [showComplete, setShowComplete] = useState(false);
  useEffect(() => {
    if (isRunning && secondsLeft === 0) {
      setShowComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isRunning]);

  if (!task) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: theme.textFaint }}>
            No active focus session.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{ marginTop: 16 }}
          >
            <Text style={{ color: "#3fe0c5", fontWeight: "700" }}>Go home</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const progress = totalSeconds ? 1 - secondsLeft / totalSeconds : 0;

  const handleMarkComplete = () => {
    if (!task.done) toggleTask(task.id);
    finishFocus();
    router.replace("/");
  };

  const handleKeepGoing = async () => {
    setShowComplete(false);
    await addMinutes(5);
  };

  const handleCancel = async () => {
    await cancelFocus();
    router.canGoBack() ? router.back() : router.replace("/");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
          <TouchableOpacity
            onPress={handleCancel}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <MaterialIcons name="close" size={20} color={theme.text} />
          </TouchableOpacity>

          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text
              className="text-[13px] font-bold uppercase tracking-wider mb-2"
              style={{ color: theme.textFaint }}
            >
              Focusing on
            </Text>
            <Text
              className="text-[20px] font-extrabold mb-10 text-center px-6"
              style={{ color: theme.text }}
            >
              {task.title}
            </Text>

            <View
              style={{
                width: 260,
                height: 260,
                borderRadius: 130,
                borderWidth: 10,
                borderColor: theme.chipBorder,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  width: 260,
                  height: 260,
                  borderRadius: 130,
                  borderWidth: 10,
                  borderColor: "#7c6cf6",
                  opacity: 0.9,
                  transform: [{ rotate: `${progress * 360}deg` }],
                  borderTopColor: "transparent",
                  borderRightColor: progress > 0.25 ? "#7c6cf6" : "transparent",
                  borderBottomColor: progress > 0.5 ? "#22d3ee" : "transparent",
                  borderLeftColor: progress > 0.75 ? "#22d3ee" : "transparent",
                }}
              />
              <Text
                className="text-[42px] font-extrabold"
                style={{ color: theme.text, fontVariant: ["tabular-nums"] }}
              >
                {formatCountdown(secondsLeft)}
              </Text>
              <Text
                className="text-[12px] mt-1"
                style={{ color: theme.textFaint }}
              >
                {isRunning ? "Running" : "Paused"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 16 }}>
              {isRunning ? (
                <TouchableOpacity onPress={pauseFocus}>
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <MaterialIcons name="pause" size={26} color={theme.text} />
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={resumeFocus}>
                  <LinearGradient
                    colors={["#7c6cf6", "#22d3ee"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons
                      name="play-arrow"
                      size={28}
                      color="#150f30"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {showComplete && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 28,
            }}
          >
            <View style={{ width: "100%", maxWidth: 360 }}>
              <GlassCard style={{ padding: 22, alignItems: "center" }}>
                <MaterialIcons name="check-circle" size={36} color="#3fe0c5" />
                <Text
                  className="text-[17px] font-bold mt-3 mb-1 text-center"
                  style={{ color: theme.text }}
                >
                  Time's up!
                </Text>
                <Text
                  className="text-[13px] text-center mb-6"
                  style={{ color: theme.textFaint }}
                >
                  Did you finish "{task.title}"?
                </Text>
                <TouchableOpacity
                  onPress={handleMarkComplete}
                  style={{ width: "100%", marginBottom: 10 }}
                >
                  <LinearGradient
                    colors={["#7c6cf6", "#22d3ee"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 100,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      className="text-[14px] font-bold"
                      style={{ color: "#150f30" }}
                    >
                      Yes, Mark Complete
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleKeepGoing}
                  style={{ width: "100%" }}
                >
                  <View
                    className="rounded-2xl px-4 py-3.5 items-center"
                    style={{
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <Text
                      className="text-[14px] font-bold"
                      style={{ color: theme.text }}
                    >
                      Need 5 More Minutes
                    </Text>
                  </View>
                </TouchableOpacity>
              </GlassCard>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
