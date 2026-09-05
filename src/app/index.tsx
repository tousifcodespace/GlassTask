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
import { TAB_ROUTES } from "@/lib/tab-routes";
import { CATEGORY_LABELS, useTaskStore } from "@/store/tasks";

const FILTERS = ["All", "Work", "Personal", "Focus"];

export default function HomeScreen() {
  const router = useRouter();
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);

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
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const activeProjects = new Set(
    tasks.filter((t) => !t.done).map((t) => t.category),
  ).size;

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
          <HeaderBar />

          <Text
            className="text-[26px] font-extrabold mb-1.5"
            style={{ color: "#f5f3ff" }}
          >
            Good Evening, Tousif 👋
          </Text>
          <Text
            className="text-[13px] mb-5"
            style={{ color: "rgba(245,243,255,0.5)" }}
          >
            {total === 0
              ? "No tasks yet — tap + to add your first one"
              : `${remaining} task${remaining === 1 ? "" : "s"} remaining across ${activeProjects} active project${activeProjects === 1 ? "" : "s"}`}
          </Text>

          <DailyMomentumCard percent={percent} done={done} total={total} />

          <View style={{ marginBottom: 20 }}>
            <NextUpStreaksRow />
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-[19px] font-bold"
                style={{ color: "#f5f3ff" }}
              >
                Upcoming
              </Text>
              <View
                className="w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(124,108,246,0.3)" }}
              >
                <Text
                  className="text-[10.5px] font-bold"
                  style={{ color: "#cabeff" }}
                >
                  {filteredTasks.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <Text
                className="text-[11.5px] font-medium"
                style={{ color: "rgba(245,243,255,0.7)" }}
              >
                View All ({total})
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={13}
                color="rgba(245,243,255,0.7)"
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
                        colors={["#7c6cf6", "#b57bff"]}
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
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.12)",
                        }}
                      >
                        <Text
                          className="text-[13px] font-medium"
                          style={{ color: "rgba(245,243,255,0.62)" }}
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
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <MaterialIcons
                name="task-alt"
                size={26}
                color="rgba(245,243,255,0.35)"
              />
              <Text
                className="text-[13px] mt-2"
                style={{ color: "rgba(245,243,255,0.45)" }}
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
                onToggle={() => toggleTask(t.id)}
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
