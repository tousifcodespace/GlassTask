import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Modal, Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/glass-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuthStore } from "@/store/auth";
import { useFocusStore } from "@/store/focus";
import {
    parseScheduledDateTime,
    Task,
    toISODate,
    useTaskStore,
} from "@/store/tasks";

function findDueTask(tasks: Task[], activeTaskId: string | null): Task | null {
  const now = Date.now();
  const todayISO = toISODate(new Date());
  const candidates = tasks
    .filter((t) => !t.done)
    .filter((t) => t.scheduledDateISO === todayISO)
    .filter((t) => t.id !== activeTaskId)
    .filter((t) => parseScheduledDateTime(t).getTime() <= now)
    .sort(
      (a, b) =>
        parseScheduledDateTime(a).getTime() -
        parseScheduledDateTime(b).getTime(),
    );
  return candidates[0] ?? null;
}

export function FocusPromptModal() {
  const router = useRouter();
  const theme = useAppTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mfaRequired = useAuthStore((s) => s.mfaRequired);
  const tasks = useTaskStore((s) => s.tasks);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const startFocus = useFocusStore((s) => s.startFocus);

  const [promptTask, setPromptTask] = useState<Task | null>(null);
  // Dismissed-for-this-session ids, so declining a prompt doesn't
  // immediately re-show it every time this effect re-runs — it'll still
  // reappear on the next fresh app open, matching "whenever I open the
  // app" behavior without being a nag loop within one open session.
  const dismissedRef = useRef<Set<string>>(new Set());

  const checkForDueTask = () => {
    if (!isAuthenticated || mfaRequired) return;
    const due = findDueTask(tasks, activeTaskId);
    if (due && !dismissedRef.current.has(due.id)) {
      setPromptTask(due);
    }
  };

  useEffect(() => {
    checkForDueTask();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkForDueTask();
    });
    // Also re-check periodically in case a task's time arrives while the
    // app is already open in the foreground.
    const interval = setInterval(checkForDueTask, 30_000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, activeTaskId, isAuthenticated, mfaRequired]);

  if (!promptTask) return null;

  const handleDismiss = () => {
    dismissedRef.current.add(promptTask.id);
    setPromptTask(null);
  };

  const handleStart = async () => {
    const task = promptTask;
    setPromptTask(null);
    await startFocus(task);
    router.push({ pathname: "/focus-timer", params: { taskId: task.id } });
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 28,
        }}
      >
        <View style={{ width: "100%", maxWidth: 380 }}>
          <GlassCard style={{ padding: 22, alignItems: "center" }}>
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-4"
              style={{
                backgroundColor: "rgba(124,108,246,0.18)",
                borderWidth: 1.5,
                borderColor: "rgba(124,108,246,0.5)",
              }}
            >
              <MaterialIcons name="timer" size={24} color="#7dd3fc" />
            </View>
            <Text
              className="text-[16px] font-bold mb-1.5 text-center"
              style={{ color: theme.text }}
            >
              Time to start
            </Text>
            <Text
              className="text-[14px] font-semibold mb-1 text-center"
              style={{ color: theme.text }}
            >
              {promptTask.title}
            </Text>
            <Text
              className="text-[12.5px] mb-6 text-center"
              style={{ color: theme.textFaint }}
            >
              Scheduled for {promptTask.scheduledTime} — start a{" "}
              {promptTask.durationMinutes}-minute focus timer now?
            </Text>

            <TouchableOpacity
              onPress={handleStart}
              style={{ width: "100%", marginBottom: 10 }}
            >
              <LinearGradient
                colors={["#7c6cf6", "#22d3ee"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderRadius: 100,
                  paddingVertical: 14,
                }}
              >
                <MaterialIcons name="play-arrow" size={18} color="#150f30" />
                <Text
                  className="text-[14px] font-bold"
                  style={{ color: "#150f30" }}
                >
                  Start Focus Timer
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDismiss} style={{ width: "100%" }}>
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
                  Not Now
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}
