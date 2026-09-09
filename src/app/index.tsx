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
import { DailyMomentumCard } from "@/components/daily-momentum-card";
import { HeaderBar } from "@/components/header-bar";
import { NextUpStreaksRow } from "@/components/next-up-streaks-row";
import { UpcomingTaskCard } from "@/components/upcoming-task-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  cancelScheduledNotification,
  scheduleTaskReminder,
} from "@/lib/notifications";
import { TAB_ROUTES } from "@/lib/tab-routes";
import { useProfileStore } from "@/store/profile";
import {
  CATEGORY_LABELS,
  getTodayProgress,
  isTaskOverdue,
  useTaskStore,
} from "@/store/tasks";

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

const FILTERS = ["All", "Work", "Personal", "Focus"];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const moveTaskToToday = useTaskStore((s) => s.moveTaskToToday);
  const setNotificationId = useTaskStore((s) => s.setNotificationId);

  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    toggleTask(id);
    // Marking done: cancel the pending "time to start" alert, it's no longer needed.
    if (task && !task.done) {
      cancelScheduledNotification(task.notificationId);
      setNotificationId(id, null);
    }
  };

  const handleMoveToToday = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) await cancelScheduledNotification(task.notificationId);
    moveTaskToToday(id);
    const updated = useTaskStore.getState().tasks.find((t) => t.id === id);
    if (updated) {
      const notificationId = await scheduleTaskReminder(
        updated,
        updated.reminderMinutesBefore,
      );
      setNotificationId(id, notificationId);
    }
  };
  const profile = useProfileStore((s) => s.profile);

  const greeting = useMemo(() => getGreeting(new Date()), []);

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTab, setActiveTab] = useState<TabKey>("home");

  const handlePressTab = (key: TabKey) => {
    setActiveTab(key);
    const route = TAB_ROUTES[key];
    if (route) router.push(route);
  };

  const filteredTasks = useMemo(
    () =>
      activeFilter === "All"
        ? tasks
        : tasks.filter((t) => CATEGORY_LABELS[t.category] === activeFilter),
    [tasks, activeFilter],
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const remaining = total - done;
  const todayProgress = getTodayProgress(tasks);
  const percent =
    todayProgress.total === 0
      ? 0
      : Math.round((todayProgress.done / todayProgress.total) * 100);
  const activeProjects = new Set(
    tasks.filter((t) => !t.done).map((t) => t.category),
  ).size;

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
          <HeaderBar />

          <Text
            className="text-[26px] font-extrabold mb-1.5"
            style={{ color: theme.text }}
          >
            {greeting}, {profile.fullName || "there"} 👋
          </Text>
          <Text className="text-[13px] mb-5" style={{ color: theme.textFaint }}>
            {total === 0
              ? "No tasks yet — tap + to add your first one"
              : `${remaining} task${remaining === 1 ? "" : "s"} remaining across ${activeProjects} active project${activeProjects === 1 ? "" : "s"}`}
          </Text>

          <DailyMomentumCard
            percent={percent}
            done={todayProgress.done}
            total={todayProgress.total}
          />

          <View style={{ marginBottom: 20 }}>
            <NextUpStreaksRow />
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-[19px] font-bold"
                style={{ color: theme.text }}
              >
                Upcoming
              </Text>
              <View
                className="w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: `${theme.accentPurple}4d` }}
              >
                <Text
                  className="text-[10.5px] font-bold"
                  style={{ color: theme.accentPurpleLight }}
                >
                  {filteredTasks.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/all-tasks")}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: theme.chipBg,
                borderWidth: 1,
                borderColor: theme.chipBorder,
              }}
            >
              <Text
                className="text-[11.5px] font-medium"
                style={{ color: theme.textMuted }}
              >
                View All ({total})
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={13}
                color={theme.textMuted}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            <View className="flex-row gap-2">
              {FILTERS.map((f) => {
                const active = f === activeFilter;
                return (
                  <TouchableOpacity key={f} onPress={() => setActiveFilter(f)}>
                    {active ? (
                      <LinearGradient
                        colors={[theme.accentPurple, theme.accentPurpleLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 100,
                        }}
                      >
                        <Text className="text-[13px] font-semibold text-white">
                          {f}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        className="px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: theme.chipBg,
                          borderWidth: 1,
                          borderColor: theme.chipBorder,
                        }}
                      >
                        <Text
                          className="text-[13px] font-medium"
                          style={{ color: theme.textMuted }}
                        >
                          {f}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {filteredTasks.length === 0 ? (
            <View
              className="items-center justify-center rounded-2xl py-10"
              style={{
                backgroundColor: theme.cardOverlay,
                borderWidth: 1,
                borderColor: theme.divider,
              }}
            >
              <MaterialIcons
                name="task-alt"
                size={26}
                color={theme.textSubtle}
              />
              <Text
                className="text-[13px] mt-2"
                style={{ color: theme.textFaint }}
              >
                {total === 0 ? "No tasks yet" : "Nothing in this filter"}
              </Text>
            </View>
          ) : (
            filteredTasks.map((t) => (
              <UpcomingTaskCard
                key={t.id}
                priority={t.priority}
                category={CATEGORY_LABELS[t.category]}
                title={t.title}
                time={t.scheduledTime}
                detail={
                  t.notes.trim() ||
                  (t.subtasks.length > 0
                    ? `${t.subtasks.length} subtask${t.subtasks.length === 1 ? "" : "s"}`
                    : CATEGORY_LABELS[t.category])
                }
                done={t.done}
                overdue={isTaskOverdue(t)}
                onToggle={() => handleToggleTask(t.id)}
                onMoveToToday={() => handleMoveToToday(t.id)}
              />
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
