import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";
import { ScreenHeader } from "@/components/screen-header";
import { useAppTheme } from "@/hooks/use-app-theme";
import { cancelScheduledNotification } from "@/lib/notifications";
import {
  CATEGORY_LABELS,
  CategoryKey,
  describeRepeat,
  Priority,
  Task,
  useTaskStore,
} from "@/store/tasks";

type StatusFilter = "all" | "active" | "done";
type CategoryFilter = "all" | CategoryKey;

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
];

const CATEGORY_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "work", label: "Work" },
  { key: "personal", label: "Personal" },
  { key: "health", label: "Health" },
];

const CATEGORY_ICON: Record<CategoryKey, keyof typeof MaterialIcons.glyphMap> =
  {
    work: "laptop-mac",
    personal: "favorite-border",
    health: "monitor-heart",
  };

const REPEAT_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  daily: "repeat",
  weekly: "event-repeat",
  monthly: "calendar-month",
};

export default function AllTasksScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const removeTask = useTaskStore((s) => s.removeTask);
  const deleteTaskSeries = useTaskStore((s) => s.deleteTaskSeries);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const PRIORITY_META: Record<Priority, { color: string; label: string }> = {
    high: { color: theme.accentRed, label: "High" },
    medium: { color: theme.accentOrange, label: "Medium" },
    low: { color: theme.accentTeal, label: "Low" },
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (status === "active" && t.done) return false;
        if (status === "done" && !t.done) return false;
        if (categoryFilter !== "all" && t.category !== categoryFilter)
          return false;
        return true;
      })
      .sort((a, b) => {
        const aKey = `${a.scheduledDateISO} ${a.scheduledTime}`;
        const bKey = `${b.scheduledDateISO} ${b.scheduledTime}`;
        return aKey.localeCompare(bKey);
      });
  }, [tasks, status, categoryFilter]);

  const doneCount = tasks.filter((t) => t.done).length;

  const handleEdit = (id: string) => {
    router.push({ pathname: "/new-task", params: { taskId: id } });
  };

  const handleDelete = (task: Task) => setDeleteTarget(task);

  const confirmDeleteOnce = () => {
    if (!deleteTarget) return;
    cancelScheduledNotification(deleteTarget.notificationId);
    removeTask(deleteTarget.id);
    setDeleteTarget(null);
  };

  const confirmEndSeries = () => {
    if (!deleteTarget) return;
    const cancelledIds = deleteTaskSeries(deleteTarget.id);
    cancelledIds.forEach((notifId) => cancelScheduledNotification(notifId));
    setDeleteTarget(null);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <ScreenHeader
            title="All Tasks"
            subtitle={`${tasks.length} total • ${doneCount} done`}
          />

          {/* Status filter */}
          <View
            className="flex-row p-1 rounded-full mb-3"
            style={{
              backgroundColor: theme.chipBg,
              borderWidth: 1,
              borderColor: theme.chipBorder,
            }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const active = opt.key === status;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={{ flex: 1 }}
                  onPress={() => setStatus(opt.key)}
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
                      style={{ color: active ? theme.text : theme.textFaint }}
                    >
                      {opt.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Category filter */}
          <View className="flex-row gap-2 mb-4">
            {CATEGORY_OPTIONS.map((opt) => {
              const active = opt.key === categoryFilter;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setCategoryFilter(opt.key)}
                  className="px-3.5 py-2 rounded-full"
                  style={{
                    backgroundColor: active
                      ? `${theme.accentPurple}33`
                      : theme.chipBg,
                    borderWidth: 1,
                    borderColor: active ? theme.accentPurple : theme.chipBorder,
                  }}
                >
                  <Text
                    className="text-[12px] font-medium"
                    style={{ color: active ? theme.text : theme.textFaint }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View
              className="items-center justify-center rounded-2xl py-12 mt-2"
              style={{
                backgroundColor: theme.cardOverlay,
                borderWidth: 1,
                borderColor: theme.divider,
              }}
            >
              <MaterialIcons name="inbox" size={26} color={theme.textSubtle} />
              <Text
                className="text-[13px] mt-2"
                style={{ color: theme.textFaint }}
              >
                No tasks match this filter
              </Text>
            </View>
          }
          renderItem={({ item: task }) => {
            const p = PRIORITY_META[task.priority];
            const isRecurring = task.repeat !== "none";

            return (
              <GlassCard style={{ marginBottom: 12, padding: 14 }}>
                <View className="flex-row items-start gap-3">
                  <TouchableOpacity
                    onPress={() => toggleTask(task.id)}
                    className="w-6 h-6 rounded-full items-center justify-center mt-0.5"
                    style={{
                      borderWidth: task.done ? 0 : 1.5,
                      borderColor: theme.chipBorder,
                      backgroundColor: task.done
                        ? theme.accentPurple
                        : "transparent",
                    }}
                  >
                    {task.done && (
                      <MaterialIcons name="check" size={13} color="#fff" />
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${p.color}22` }}
                      >
                        <View
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <Text
                          className="text-[9.5px] font-bold uppercase"
                          style={{ color: p.color }}
                        >
                          {p.label}
                        </Text>
                      </View>

                      <View
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: theme.chipBg,
                          borderWidth: 1,
                          borderColor: theme.chipBorder,
                        }}
                      >
                        <MaterialIcons
                          name={CATEGORY_ICON[task.category]}
                          size={10}
                          color={theme.textMuted}
                        />
                        <Text
                          className="text-[10px] font-medium"
                          style={{ color: theme.textMuted }}
                        >
                          {CATEGORY_LABELS[task.category]}
                        </Text>
                      </View>

                      {isRecurring && (
                        <View
                          className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${theme.accentTeal}22` }}
                        >
                          <MaterialIcons
                            name={REPEAT_ICON[task.repeat] ?? "repeat"}
                            size={10}
                            color={theme.accentTeal}
                          />
                          <Text
                            className="text-[10px] font-semibold"
                            style={{ color: theme.accentTeal }}
                          >
                            {describeRepeat(task)}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      numberOfLines={2}
                      className="text-[15px] font-bold mb-1"
                      style={{
                        color: task.done ? theme.textFaint : theme.text,
                        textDecorationLine: task.done ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </Text>

                    <View className="flex-row items-center gap-1.5">
                      <MaterialIcons
                        name="event"
                        size={12}
                        color={theme.textFaint}
                      />
                      <Text
                        className="text-[11.5px]"
                        style={{ color: theme.textFaint }}
                      >
                        {task.scheduledDate} • {task.scheduledTime}
                      </Text>
                    </View>

                    <View
                      className="flex-row items-center gap-4 mt-3 pt-2.5"
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: theme.divider,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleEdit(task.id)}
                        className="flex-row items-center gap-1"
                      >
                        <MaterialIcons
                          name="edit"
                          size={14}
                          color={theme.accentPurpleLight}
                        />
                        <Text
                          className="text-[12px] font-semibold"
                          style={{ color: theme.accentPurpleLight }}
                        >
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(task)}
                        className="flex-row items-center gap-1"
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={14}
                          color={theme.accentRed}
                        />
                        <Text
                          className="text-[12px] font-semibold"
                          style={{ color: theme.accentRed }}
                        >
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </GlassCard>
            );
          }}
        />

        <Modal
          visible={!!deleteTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteTarget(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 28,
            }}
          >
            <View style={{ width: "100%", maxWidth: 380 }}>
              <GlassCard style={{ padding: 20 }}>
                <Text
                  className="text-[16px] font-bold mb-1.5"
                  style={{ color: theme.text }}
                >
                  {deleteTarget?.repeat !== "none"
                    ? "Delete this recurring task?"
                    : "Delete this task?"}
                </Text>
                <Text
                  className="text-[13px] mb-5"
                  style={{ color: theme.textFaint }}
                >
                  {deleteTarget?.repeat !== "none"
                    ? `"${deleteTarget?.title}" repeats. Choose what to delete — either way, days you've already completed stay exactly as they were in your stats and streaks.`
                    : `"${deleteTarget?.title}" will be removed permanently.`}
                </Text>

                {deleteTarget?.repeat !== "none" ? (
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity onPress={confirmDeleteOnce}>
                      <View
                        className="rounded-2xl px-4 py-3.5"
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
                          Delete Just This One
                        </Text>
                        <Text
                          className="text-[11.5px] mt-0.5"
                          style={{ color: theme.textFaint }}
                        >
                          Removes today's task only — it'll come back next time
                          it repeats.
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={confirmEndSeries}>
                      <View
                        className="rounded-2xl px-4 py-3.5"
                        style={{
                          backgroundColor: `${theme.accentRed}1a`,
                          borderWidth: 1,
                          borderColor: `${theme.accentRed}4d`,
                        }}
                      >
                        <Text
                          className="text-[14px] font-bold"
                          style={{ color: theme.accentRed }}
                        >
                          End Recurring Task
                        </Text>
                        <Text
                          className="text-[11.5px] mt-0.5"
                          style={{ color: theme.textFaint }}
                        >
                          Stops it from repeating going forward. Past
                          completed/missed days are kept as-is.
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setDeleteTarget(null)}
                      style={{ alignItems: "center", paddingVertical: 10 }}
                    >
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: theme.textFaint }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => setDeleteTarget(null)}
                      style={{ flex: 1 }}
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
                          Cancel
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={confirmDeleteOnce}
                      style={{ flex: 1 }}
                    >
                      <View
                        className="rounded-2xl px-4 py-3.5 items-center"
                        style={{
                          backgroundColor: `${theme.accentRed}1a`,
                          borderWidth: 1,
                          borderColor: `${theme.accentRed}4d`,
                        }}
                      >
                        <Text
                          className="text-[14px] font-bold"
                          style={{ color: theme.accentRed }}
                        >
                          Delete
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </GlassCard>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
