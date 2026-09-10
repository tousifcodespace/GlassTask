import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";
import { ScreenHeader } from "@/components/screen-header";
import type { AppTheme } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  cancelScheduledNotification,
  scheduleTaskReminder,
} from "@/lib/notifications";
import { useSettingsStore } from "@/store/settings";
import {
  formatClockTime,
  formatDateLabel,
  parseScheduledDateTime,
  RepeatCadence,
  toISODate,
  useTaskStore,
} from "@/store/tasks";

type CategoryKey = "work" | "personal" | "health";
type PriorityKey = "high" | "medium" | "low";

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { key: "work", label: "Work", icon: "laptop-mac" },
  { key: "personal", label: "Personal", icon: "favorite-border" },
  { key: "health", label: "Health", icon: "monitor-heart" },
];

const getPriorities = (
  theme: ReturnType<typeof useAppTheme>,
): {
  key: PriorityKey;
  label: string;
  sub: string;
  color: string;
}[] => [
  { key: "high", label: "High", sub: "Critical", color: theme.accentRed },
  { key: "medium", label: "Medium", sub: "Routine", color: theme.accentOrange },
  { key: "low", label: "Low", sub: "Whenever", color: theme.accentTeal },
];

const REPEAT_OPTIONS: { key: RepeatCadence; label: string }[] = [
  { key: "none", label: "Never" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const REMINDER_PRESETS = [0, 5, 10, 15, 30, 60];

function formatDuration(min: number): string {
  if (min < 60) return `${min}m`;
  return `${min / 60}h`;
}

type Subtask = { id: string; text: string; done: boolean };

const MONTH_NAMES_FULL = [
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
const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * @react-native-community/datetimepicker has no web implementation at
 * all — it renders nothing there, so tapping "Scheduled Date"/"Time &
 * Reminder" silently did nothing on web. This is a from-scratch
 * replacement used only on Platform.OS === "web"; native (iOS/Android)
 * keeps using the real native picker unchanged.
 */
function WebDatePickerModal({
  visible,
  value,
  onClose,
  onSelect,
  theme,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  theme: AppTheme;
}) {
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  useEffect(() => {
    if (visible) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
    // Only re-sync when the modal opens, not on every value change while open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10,8,24,0.6)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <View style={{ width: "100%", maxWidth: 360 }}>
          <GlassCard style={{ padding: 18 }}>
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={goPrevMonth}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.chipBg }}
              >
                <MaterialIcons
                  name="chevron-left"
                  size={18}
                  color={theme.text}
                />
              </TouchableOpacity>
              <Text
                className="text-[14.5px] font-bold"
                style={{ color: theme.text }}
              >
                {MONTH_NAMES_FULL[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity
                onPress={goNextMonth}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: theme.chipBg }}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={18}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-2">
              {WEEKDAY_SHORT.map((w, i) => (
                <Text
                  key={`${w}-${i}`}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "700",
                    color: theme.textFaint,
                  }}
                >
                  {w}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {cells.map((day, idx) => {
                const isSelected =
                  day !== null &&
                  day === value.getDate() &&
                  viewMonth === value.getMonth() &&
                  viewYear === value.getFullYear();
                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={day === null}
                    onPress={() =>
                      day && onSelect(new Date(viewYear, viewMonth, day))
                    }
                    style={{
                      width: `${100 / 7}%`,
                      aspectRatio: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {day !== null && (
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected
                            ? theme.accentPurple
                            : "transparent",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? "800" : "500",
                            color: isSelected ? "#ffffff" : theme.text,
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                marginTop: 14,
                alignItems: "center",
                paddingVertical: 10,
              }}
            >
              <Text
                style={{ color: "#b57bff", fontWeight: "700", fontSize: 13 }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

function WebTimePickerModal({
  visible,
  value,
  onClose,
  onSelect,
  theme,
}: {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
  theme: AppTheme;
}) {
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (visible) {
      const h = value.getHours() % 12 || 12;
      setHour(String(h));
      setMinute(value.getMinutes().toString().padStart(2, "0"));
      setPeriod(value.getHours() >= 12 ? "PM" : "AM");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDone = () => {
    let h = parseInt(hour, 10);
    let m = parseInt(minute, 10);
    if (Number.isNaN(h) || h < 1 || h > 12) h = 12;
    if (Number.isNaN(m) || m < 0 || m > 59) m = 0;
    let hours24 = h % 12;
    if (period === "PM") hours24 += 12;
    const result = new Date(value);
    result.setHours(hours24, m, 0, 0);
    onSelect(result);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(10,8,24,0.6)",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <View style={{ width: "100%", maxWidth: 320 }}>
          <GlassCard style={{ padding: 20 }}>
            <Text
              className="text-[15px] font-extrabold mb-4"
              style={{ color: theme.text }}
            >
              Set Time
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <TextInput
                value={hour}
                onChangeText={(t) =>
                  setHour(t.replace(/[^0-9]/g, "").slice(0, 2))
                }
                keyboardType="number-pad"
                maxLength={2}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: "800",
                  color: theme.text,
                  backgroundColor: theme.chipBg,
                  borderRadius: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              />
              <Text
                style={{ fontSize: 22, fontWeight: "800", color: theme.text }}
              >
                :
              </Text>
              <TextInput
                value={minute}
                onChangeText={(t) =>
                  setMinute(t.replace(/[^0-9]/g, "").slice(0, 2))
                }
                keyboardType="number-pad"
                maxLength={2}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: "800",
                  color: theme.text,
                  backgroundColor: theme.chipBg,
                  borderRadius: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              />
              <View style={{ gap: 6 }}>
                {(["AM", "PM"] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor:
                        period === p ? theme.accentPurple : theme.chipBg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: period === p ? "#ffffff" : theme.textFaint,
                      }}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1 }}>
                <View
                  style={{
                    borderRadius: 100,
                    paddingVertical: 13,
                    alignItems: "center",
                    backgroundColor: theme.chipBg,
                    borderWidth: 1,
                    borderColor: theme.chipBorder,
                  }}
                >
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDone} style={{ flex: 1 }}>
                <LinearGradient
                  colors={["#7c6cf6", "#22d3ee"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 100,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#150f30",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Done
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

export default function NewTaskScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const isEditing = !!taskId;
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const setNotificationId = useTaskStore((s) => s.setNotificationId);
  const reminderOffsetMinutes = useSettingsStore(
    (s) => s.reminderOffsetMinutes,
  );

  const existingTask = isEditing
    ? (useTaskStore.getState().tasks.find((t) => t.id === taskId) ?? null)
    : null;

  const [title, setTitle] = useState(existingTask?.title ?? "");
  const [notes, setNotes] = useState(existingTask?.notes ?? "");
  const [category, setCategory] = useState<CategoryKey>(
    existingTask?.category ?? "work",
  );
  const [priority, setPriority] = useState<PriorityKey>(
    existingTask?.priority ?? "high",
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    existingTask?.subtasks ?? [
      { id: "1", text: "Outline scope and critical deliverables", done: false },
      { id: "2", text: "Sync design tokens with front-end team", done: false },
    ],
  );
  const [scheduledDate, setScheduledDate] = useState(() =>
    existingTask ? parseScheduledDateTime(existingTask) : new Date(),
  );
  const [scheduledTime, setScheduledTime] = useState(() =>
    existingTask ? parseScheduledDateTime(existingTask) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState<RepeatCadence>(
    existingTask?.repeat ?? "none",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    existingTask?.durationMinutes ?? 30,
  );
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(
    existingTask?.reminderMinutesBefore ?? reminderOffsetMinutes,
  );
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDurationText, setCustomDurationText] = useState("");
  const [link, setLink] = useState(existingTask?.link ?? "");
  const PRIORITIES = getPriorities(theme);

  const toggleSubtask = (id: string) =>
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    );

  const removeSubtask = (id: string) =>
    setSubtasks((prev) => prev.filter((s) => s.id !== id));

  const addSubtask = () =>
    setSubtasks((prev) => [
      ...prev,
      { id: Date.now().toString(), text: "New subtask", done: false },
    ]);

  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "set" && selected) setScheduledDate(selected);
  };

  const onChangeTime = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (event.type === "set" && selected) setScheduledTime(selected);
  };

  const handleSave = async () => {
    if (title.trim().length === 0) return;

    const taskInput = {
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      subtasks,
      scheduledDate: formatDateLabel(scheduledDate),
      scheduledDateISO: toISODate(scheduledDate),
      scheduledTime: formatClockTime(scheduledTime),
      durationMinutes,
      reminderMinutesBefore,
      repeat,
      link: link.trim(),
    };

    let id: string;
    if (isEditing && existingTask) {
      id = existingTask.id;
      updateTask(id, taskInput);
      await cancelScheduledNotification(existingTask.notificationId);
    } else {
      id = addTask(taskInput);
    }

    const savedTask = useTaskStore.getState().tasks.find((t) => t.id === id);
    if (savedTask) {
      const notificationId = await scheduleTaskReminder(
        savedTask,
        reminderMinutesBefore,
      );
      setNotificationId(id, notificationId);
    }

    router.canGoBack() ? router.back() : router.replace("/");
  };

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
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={isEditing ? "Edit Task" : "New Task"}
            subtitle="BENTO CANVAS"
            rightSlot={
              <View className="flex-row items-center gap-2">
                <LinearGradient
                  colors={["#7c6cf6", "#b57bff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 100,
                  }}
                >
                  <MaterialIcons name="bolt" size={12} color="#fff" />
                  <Text
                    className="text-[10.5px] font-bold"
                    style={{ color: "#fff" }}
                  >
                    PRO
                  </Text>
                </LinearGradient>
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 1.5,
                    borderColor: `${theme.accentPurple}80`,
                  }}
                >
                  <View
                    className="w-full h-full rounded-full items-center justify-center"
                    style={{ backgroundColor: `${theme.accentPurple}40` }}
                  >
                    <MaterialIcons
                      name="person"
                      size={16}
                      color={theme.accentPurpleLight}
                    />
                  </View>
                </View>
              </View>
            }
          />

          {/* Flow State */}
          <GlassCard style={{ marginBottom: 16, padding: 14 }}>
            <View className="flex-row items-center gap-3">
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: `${theme.accentTeal}29` }}
              >
                <MaterialIcons
                  name="water-drop"
                  size={19}
                  color={theme.accentTeal}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: theme.accentTeal }}
                >
                  Flow State
                </Text>
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: theme.text }}
                >
                  {isEditing ? "Refine Objective" : "Sculpt New Objective"}
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: theme.divider,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: theme.accentTeal }}
                />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: theme.text }}
                >
                  Live Draft
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Task Title */}
          <GlassCard style={{ marginBottom: 16, padding: 14 }}>
            <View className="flex-row items-center justify-between mb-2.5">
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: theme.textFaint }}
              >
                Task Title
              </Text>
              <Text className="text-[11px]" style={{ color: theme.textFaint }}>
                {title.length}/80
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={(t) => setTitle(t.slice(0, 80))}
              placeholder="What do you need to do?"
              placeholderTextColor={theme.textSubtle}
              className="text-[15px]"
              style={{
                color: theme.text,
                borderWidth: 1.5,
                borderColor: `${theme.accentPurple}99`,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 12,
              }}
            />
            <View
              className="flex-row items-center justify-between pt-2.5"
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.divider,
              }}
            >
              <View className="flex-row items-center gap-1.5">
                <MaterialIcons name="auto-awesome" size={13} color="#b57bff" />
                <Text
                  className="text-[11.5px] font-medium"
                  style={{ color: theme.accentPurpleLight }}
                >
                  Auto-detects date, time &amp; tags
                </Text>
              </View>
              <View
                className="px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <Text
                  className="text-[10.5px]"
                  style={{ color: theme.textFaint }}
                >
                  ↵ Enter
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Category Space */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: theme.textFaint }}
            >
              Category Space
            </Text>
            <TouchableOpacity className="flex-row items-center gap-1">
              <MaterialIcons name="add" size={13} color="#b57bff" />
              <Text
                className="text-[11.5px] font-semibold"
                style={{ color: "#b57bff" }}
              >
                New Space
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2 mb-4">
            {CATEGORIES.map((c) => {
              const active = c.key === category;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={{ flex: 1 }}
                >
                  {active ? (
                    <View
                      className="flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl"
                      style={{
                        backgroundColor: `${theme.accentPurple}47`,
                        borderWidth: 1,
                        borderColor: `${theme.accentPurple}80`,
                      }}
                    >
                      <MaterialIcons
                        name={c.icon}
                        size={15}
                        color={theme.text}
                      />
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: theme.text }}
                      >
                        {c.label}
                      </Text>
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: theme.accentTeal }}
                      />
                    </View>
                  ) : (
                    <View
                      className="flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl"
                      style={{
                        backgroundColor: theme.chipBg,
                        borderWidth: 1,
                        borderColor: theme.chipBorder,
                      }}
                    >
                      <MaterialIcons
                        name={c.icon}
                        size={15}
                        color={theme.textMuted}
                      />
                      <Text
                        className="text-[13px] font-medium"
                        style={{ color: theme.textMuted }}
                      >
                        {c.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scheduled date + Time & reminder */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setShowDatePicker(true)}
            >
              <GlassCard style={{ padding: 14 }}>
                <View className="flex-row items-center justify-between mb-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${theme.accentPurple}33` }}
                  >
                    <MaterialIcons
                      name="calendar-today"
                      size={14}
                      color={theme.accentPurpleLight}
                    />
                  </View>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <Text
                      className="text-[10px] font-medium"
                      style={{ color: theme.textMuted }}
                    >
                      Due
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: theme.textFaint }}
                >
                  Scheduled Date
                </Text>
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: theme.text }}
                >
                  {formatDateLabel(scheduledDate)}
                </Text>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => setShowTimePicker(true)}
            >
              <GlassCard style={{ padding: 14 }}>
                <View className="flex-row items-center justify-between mb-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${theme.accentPurple}33` }}
                  >
                    <MaterialIcons
                      name="schedule"
                      size={14}
                      color={theme.accentPurpleLight}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setReminderMinutesBefore(
                        REMINDER_PRESETS[
                          (REMINDER_PRESETS.indexOf(reminderMinutesBefore) +
                            1) %
                            REMINDER_PRESETS.length
                        ],
                      )
                    }
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${theme.accentPurple}38`,
                      borderWidth: 1,
                      borderColor: `${theme.accentPurple}66`,
                    }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: theme.accentPurpleLight }}
                    >
                      {reminderMinutesBefore === 0
                        ? "At time"
                        : `${reminderMinutesBefore}m before`}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: theme.textFaint }}
                >
                  Time &amp; Reminder
                </Text>
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: theme.text }}
                >
                  {formatClockTime(scheduledTime)}
                </Text>
              </GlassCard>
            </TouchableOpacity>
          </View>

          {showDatePicker &&
            (Platform.OS === "ios" ? (
              <Modal transparent animationType="fade">
                <View
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: "rgba(10,8,24,0.6)",
                  }}
                >
                  <View
                    style={{
                      backgroundColor:
                        theme.mode === "dark" ? "#1a1438" : "#ffffff",
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      paddingBottom: 24,
                    }}
                  >
                    <View className="flex-row items-center justify-between px-5 py-3">
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: theme.textMuted }}
                      >
                        Scheduled Date
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text
                          className="text-[13px] font-bold"
                          style={{ color: "#b57bff" }}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={scheduledDate}
                      mode="date"
                      display="inline"
                      themeVariant={theme.mode === "dark" ? "dark" : "light"}
                      onChange={onChangeDate}
                    />
                  </View>
                </View>
              </Modal>
            ) : Platform.OS === "web" ? (
              <WebDatePickerModal
                visible={showDatePicker}
                value={scheduledDate}
                theme={theme}
                onClose={() => setShowDatePicker(false)}
                onSelect={(d) => {
                  setScheduledDate(d);
                  setShowDatePicker(false);
                }}
              />
            ) : (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            ))}

          {showTimePicker &&
            (Platform.OS === "ios" ? (
              <Modal transparent animationType="fade">
                <View
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    backgroundColor: "rgba(10,8,24,0.6)",
                  }}
                >
                  <View
                    style={{
                      backgroundColor:
                        theme.mode === "dark" ? "#1a1438" : "#ffffff",
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      paddingBottom: 24,
                    }}
                  >
                    <View className="flex-row items-center justify-between px-5 py-3">
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: theme.textMuted }}
                      >
                        Time &amp; Reminder
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text
                          className="text-[13px] font-bold"
                          style={{ color: "#b57bff" }}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={scheduledTime}
                      mode="time"
                      display="spinner"
                      themeVariant={theme.mode === "dark" ? "dark" : "light"}
                      onChange={onChangeTime}
                    />
                  </View>
                </View>
              </Modal>
            ) : Platform.OS === "web" ? (
              <WebTimePickerModal
                visible={showTimePicker}
                value={scheduledTime}
                theme={theme}
                onClose={() => setShowTimePicker(false)}
                onSelect={(t) => {
                  setScheduledTime(t);
                  setShowTimePicker(false);
                }}
              />
            ) : (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                display="default"
                onChange={onChangeTime}
              />
            ))}

          {/* Recurrence */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: theme.textFaint }}
            >
              Recurrence Cadence
            </Text>
          </View>
          <View className="flex-row gap-2 mb-4">
            {REPEAT_OPTIONS.map((r) => {
              const active = r.key === repeat;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setRepeat(r.key)}
                  style={{ flex: 1 }}
                >
                  <View
                    className="items-center py-2.5 rounded-2xl"
                    style={{
                      backgroundColor: active
                        ? `${theme.accentPurple}47`
                        : theme.chipBg,
                      borderWidth: 1,
                      borderColor: active
                        ? `${theme.accentPurple}80`
                        : theme.chipBorder,
                    }}
                  >
                    <Text
                      className="text-[12.5px] font-semibold"
                      style={{ color: active ? theme.text : theme.textMuted }}
                    >
                      {r.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Duration */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: theme.textFaint }}
            >
              Estimated Duration
            </Text>
            <Text className="text-[11px]" style={{ color: theme.textFaint }}>
              Powers the in-app focus timer
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: isCustomDuration ? 10 : 16 }}
          >
            <View className="flex-row gap-2">
              {DURATION_OPTIONS.map((min) => {
                const active = !isCustomDuration && min === durationMinutes;
                return (
                  <TouchableOpacity
                    key={min}
                    onPress={() => {
                      setIsCustomDuration(false);
                      setDurationMinutes(min);
                    }}
                  >
                    <View
                      className="px-4 py-2 rounded-full"
                      style={{
                        backgroundColor: active
                          ? `${theme.accentPurple}47`
                          : theme.chipBg,
                        borderWidth: 1,
                        borderColor: active
                          ? `${theme.accentPurple}80`
                          : theme.chipBorder,
                      }}
                    >
                      <Text
                        className="text-[12.5px] font-semibold"
                        style={{ color: active ? theme.text : theme.textMuted }}
                      >
                        {formatDuration(min)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={() => setIsCustomDuration(true)}>
                <View
                  className="flex-row items-center gap-1 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: isCustomDuration
                      ? `${theme.accentPurple}47`
                      : theme.chipBg,
                    borderWidth: 1,
                    borderColor: isCustomDuration
                      ? `${theme.accentPurple}80`
                      : theme.chipBorder,
                  }}
                >
                  <MaterialIcons
                    name="edit"
                    size={13}
                    color={isCustomDuration ? theme.text : theme.textMuted}
                  />
                  <Text
                    className="text-[12.5px] font-semibold"
                    style={{
                      color: isCustomDuration ? theme.text : theme.textMuted,
                    }}
                  >
                    Custom
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {isCustomDuration && (
            <View className="flex-row items-center gap-2 mb-4">
              <TextInput
                value={customDurationText}
                onChangeText={(t) => {
                  const digits = t.replace(/[^0-9]/g, "").slice(0, 3);
                  setCustomDurationText(digits);
                  const n = parseInt(digits, 10);
                  if (!Number.isNaN(n) && n > 0) setDurationMinutes(n);
                }}
                keyboardType="number-pad"
                placeholder="e.g. 25"
                placeholderTextColor={theme.textSubtle}
                style={{
                  color: theme.text,
                  borderWidth: 1.5,
                  borderColor: `${theme.accentPurple}99`,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  width: 90,
                }}
              />
              <Text className="text-[12px]" style={{ color: theme.textFaint }}>
                minutes
              </Text>
            </View>
          )}

          {/* Priority Matrix */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: theme.textFaint }}
            >
              Priority Matrix
            </Text>
            <Text
              className="text-[11px] font-semibold"
              style={{ color: theme.accentRed }}
            >
              Urgent &amp; Important
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {PRIORITIES.map((p) => {
              const active = p.key === priority;
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={{ flex: 1 }}
                >
                  <View
                    className="items-center py-3 rounded-2xl"
                    style={{
                      backgroundColor: active ? `${p.color}22` : theme.chipBg,
                      borderWidth: 1.5,
                      borderColor: active ? p.color : theme.chipBorder,
                    }}
                  >
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <Text
                        className="text-[13px] font-bold"
                        style={{ color: active ? p.color : theme.text }}
                      >
                        {p.label}
                      </Text>
                    </View>
                    <Text
                      className="text-[10.5px]"
                      style={{ color: theme.textFaint }}
                    >
                      {p.sub}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subtasks & Milestones */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: theme.textFaint }}
            >
              Subtasks &amp; Milestones
            </Text>
            <TouchableOpacity
              onPress={addSubtask}
              className="flex-row items-center gap-1"
            >
              <MaterialIcons
                name="add-circle-outline"
                size={14}
                color="#b57bff"
              />
              <Text
                className="text-[11.5px] font-semibold"
                style={{ color: "#b57bff" }}
              >
                Add subtask
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 16 }}>
            {subtasks.map((s) => (
              <GlassCard key={s.id} style={{ marginBottom: 8, padding: 12 }}>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => toggleSubtask(s.id)}
                    className="w-5 h-5 rounded-full items-center justify-center"
                    style={{
                      borderWidth: 1.5,
                      borderColor: s.done ? "transparent" : theme.textSubtle,
                      backgroundColor: s.done
                        ? theme.accentPurple
                        : "transparent",
                    }}
                  >
                    {s.done && (
                      <MaterialIcons name="check" size={12} color="#fff" />
                    )}
                  </TouchableOpacity>
                  <Text
                    className="flex-1 text-[13.5px]"
                    style={{
                      color: s.done ? theme.textFaint : theme.text,
                      textDecorationLine: s.done ? "line-through" : "none",
                    }}
                  >
                    {s.text}
                  </Text>
                  <TouchableOpacity onPress={() => removeSubtask(s.id)}>
                    <MaterialIcons
                      name="close"
                      size={16}
                      color={theme.textFaint}
                    />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Context & Notes */}
          <GlassCard style={{ marginBottom: 16, padding: 14 }}>
            <View className="flex-row items-center justify-between mb-2.5">
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: theme.textFaint }}
              >
                Context &amp; Notes
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.chipBg }}
                >
                  <MaterialIcons
                    name="attach-file"
                    size={14}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.chipBg }}
                >
                  <MaterialIcons
                    name="mic-none"
                    size={14}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add checklist items, links, or specific constraints..."
              placeholderTextColor={theme.textSubtle}
              multiline
              numberOfLines={3}
              className="text-[13.5px]"
              style={{
                color: theme.text,
                borderWidth: 1,
                borderColor: theme.chipBorder,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 72,
                textAlignVertical: "top",
              }}
            />
          </GlassCard>

          {/* Link */}
          <GlassCard style={{ marginBottom: 16, padding: 14 }}>
            <View className="flex-row items-center justify-between mb-2.5">
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider"
                style={{ color: theme.textFaint }}
              >
                Link
              </Text>
              <Text className="text-[10px]" style={{ color: theme.textFaint }}>
                Optional
              </Text>
            </View>
            <View
              className="flex-row items-center gap-2 rounded-xl"
              style={{
                borderWidth: 1,
                borderColor: theme.chipBorder,
                paddingHorizontal: 12,
              }}
            >
              <MaterialIcons name="link" size={16} color={theme.textMuted} />
              <TextInput
                value={link}
                onChangeText={setLink}
                placeholder="Meeting link, doc, or any URL"
                placeholderTextColor={theme.textSubtle}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                className="text-[13.5px]"
                style={{
                  flex: 1,
                  color: theme.text,
                  paddingVertical: 12,
                }}
              />
            </View>
          </GlassCard>

          {/* Deep Focus promo */}
          <GlassCard style={{ marginBottom: 24, padding: 14 }}>
            <View className="flex-row items-center gap-3">
              <LinearGradient
                colors={["rgba(124,108,246,0.4)", "rgba(34,211,238,0.25)"]}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name="bolt"
                  size={18}
                  color={theme.accentPurpleLight}
                />
              </LinearGradient>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text
                    className="text-[13.5px] font-bold"
                    style={{ color: theme.text }}
                  >
                    Deep Focus Session
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${theme.accentTeal}2e` }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: theme.accentTeal }}
                    >
                      45m
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[11.5px] leading-4"
                  style={{ color: theme.textFaint }}
                  numberOfLines={2}
                >
                  1 focus block scheduled. Reduces cognitive drag by binding
                  this task to your evening routine.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Create / Save Task */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={title.trim().length === 0}
          >
            <LinearGradient
              colors={["#7c6cf6", "#b57bff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 15,
                borderRadius: 18,
                opacity: title.trim().length === 0 ? 0.5 : 1,
              }}
            >
              <MaterialIcons name="check-circle" size={18} color="#fff" />
              <Text className="text-[15px] font-bold" style={{ color: "#fff" }}>
                {isEditing ? "Save Changes" : "Create Task"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
