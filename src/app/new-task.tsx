import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useSettingsStore } from "@/store/settings";
import {
  formatClockTime,
  formatDateLabel,
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

const PRIORITIES: {
  key: PriorityKey;
  label: string;
  sub: string;
  color: string;
}[] = [
  { key: "high", label: "High", sub: "Critical", color: "#ff6b81" },
  { key: "medium", label: "Medium", sub: "Routine", color: "#ffb84d" },
  { key: "low", label: "Low", sub: "Whenever", color: "#3fe0c5" },
];

type Subtask = { id: string; text: string; done: boolean };

export default function NewTaskScreen() {
  const router = useRouter();
  const addTask = useTaskStore((s) => s.addTask);
  const reminderOffsetMinutes = useSettingsStore(
    (s) => s.reminderOffsetMinutes,
  );

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<CategoryKey>("work");
  const [priority, setPriority] = useState<PriorityKey>("high");
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    { id: "1", text: "Outline scope and critical deliverables", done: false },
    { id: "2", text: "Sync design tokens with front-end team", done: false },
  ]);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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

  const handleCreate = () => {
    if (title.trim().length === 0) return;

    addTask({
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      subtasks,
      scheduledDate: formatDateLabel(scheduledDate),
      scheduledDateISO: toISODate(scheduledDate),
      scheduledTime: formatClockTime(scheduledTime),
    });

    router.canGoBack() ? router.back() : router.replace("/");
  };

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
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="New Task"
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
                    borderColor: "rgba(124,108,246,0.5)",
                  }}
                >
                  <View
                    className="w-full h-full rounded-full items-center justify-center"
                    style={{ backgroundColor: "rgba(124,108,246,0.25)" }}
                  >
                    <MaterialIcons name="person" size={16} color="#cabeff" />
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
                style={{ backgroundColor: "rgba(63,224,197,0.16)" }}
              >
                <MaterialIcons name="water-drop" size={19} color="#3fe0c5" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: "#3fe0c5" }}
                >
                  Flow State
                </Text>
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: "#f5f3ff" }}
                >
                  Sculpt New Objective
                </Text>
              </View>
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.14)",
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#3fe0c5" }}
                />
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: "#f5f3ff" }}
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
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Task Title
              </Text>
              <Text
                className="text-[11px]"
                style={{ color: "rgba(245,243,255,0.4)" }}
              >
                {title.length}/80
              </Text>
            </View>
            <TextInput
              value={title}
              onChangeText={(t) => setTitle(t.slice(0, 80))}
              placeholder="What do you need to do?"
              placeholderTextColor="rgba(245,243,255,0.35)"
              className="text-[15px]"
              style={{
                color: "#f5f3ff",
                borderWidth: 1.5,
                borderColor: "rgba(124,108,246,0.6)",
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
                borderTopColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View className="flex-row items-center gap-1.5">
                <MaterialIcons name="auto-awesome" size={13} color="#b57bff" />
                <Text
                  className="text-[11.5px] font-medium"
                  style={{ color: "#cabeff" }}
                >
                  Auto-detects date, time &amp; tags
                </Text>
              </View>
              <View
                className="px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <Text
                  className="text-[10.5px]"
                  style={{ color: "rgba(245,243,255,0.5)" }}
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
              style={{ color: "rgba(245,243,255,0.5)" }}
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
                        backgroundColor: "rgba(124,108,246,0.28)",
                        borderWidth: 1,
                        borderColor: "rgba(124,108,246,0.5)",
                      }}
                    >
                      <MaterialIcons name={c.icon} size={15} color="#f5f3ff" />
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: "#f5f3ff" }}
                      >
                        {c.label}
                      </Text>
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "#3fe0c5" }}
                      />
                    </View>
                  ) : (
                    <View
                      className="flex-row items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      <MaterialIcons
                        name={c.icon}
                        size={15}
                        color="rgba(245,243,255,0.55)"
                      />
                      <Text
                        className="text-[13px] font-medium"
                        style={{ color: "rgba(245,243,255,0.55)" }}
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
                    style={{ backgroundColor: "rgba(124,108,246,0.2)" }}
                  >
                    <MaterialIcons
                      name="calendar-today"
                      size={14}
                      color="#cabeff"
                    />
                  </View>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.12)",
                    }}
                  >
                    <Text
                      className="text-[10px] font-medium"
                      style={{ color: "rgba(245,243,255,0.6)" }}
                    >
                      Due
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: "rgba(245,243,255,0.4)" }}
                >
                  Scheduled Date
                </Text>
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: "#f5f3ff" }}
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
                    style={{ backgroundColor: "rgba(124,108,246,0.2)" }}
                  >
                    <MaterialIcons name="schedule" size={14} color="#cabeff" />
                  </View>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.12)",
                    }}
                  >
                    <Text
                      className="text-[10px] font-medium"
                      style={{ color: "rgba(245,243,255,0.6)" }}
                    >
                      {reminderOffsetMinutes}m before
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[10px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: "rgba(245,243,255,0.4)" }}
                >
                  Time &amp; Reminder
                </Text>
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: "#f5f3ff" }}
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
                      backgroundColor: "#1a1438",
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      paddingBottom: 24,
                    }}
                  >
                    <View className="flex-row items-center justify-between px-5 py-3">
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: "rgba(245,243,255,0.6)" }}
                      >
                        Scheduled Date
                      </Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
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
                      themeVariant="dark"
                      onChange={onChangeDate}
                    />
                  </View>
                </View>
              </Modal>
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
                      backgroundColor: "#1a1438",
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      paddingBottom: 24,
                    }}
                  >
                    <View className="flex-row items-center justify-between px-5 py-3">
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: "rgba(245,243,255,0.6)" }}
                      >
                        Time &amp; Reminder
                      </Text>
                      <TouchableOpacity onPress={() => setShowTimePicker(false)}>
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
                      themeVariant="dark"
                      onChange={onChangeTime}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={scheduledTime}
                mode="time"
                display="default"
                onChange={onChangeTime}
              />
            ))}

          {/* Recurrence */}
          <TouchableOpacity>
            <GlassCard style={{ marginBottom: 16, padding: 14 }}>
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <MaterialIcons
                    name="repeat"
                    size={16}
                    color="rgba(245,243,255,0.6)"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: "rgba(245,243,255,0.4)" }}
                  >
                    Recurrence Cadence
                  </Text>
                  <Text
                    className="text-[14.5px] font-bold"
                    style={{ color: "#f5f3ff" }}
                  >
                    Does not repeat
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color="rgba(245,243,255,0.4)"
                />
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Priority Matrix */}
          <View className="flex-row items-center justify-between mb-2.5">
            <Text
              className="text-[10.5px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(245,243,255,0.5)" }}
            >
              Priority Matrix
            </Text>
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#ff6b81" }}
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
                      backgroundColor: active
                        ? `${p.color}22`
                        : "rgba(255,255,255,0.05)",
                      borderWidth: 1.5,
                      borderColor: active ? p.color : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <Text
                        className="text-[13px] font-bold"
                        style={{ color: active ? p.color : "#f5f3ff" }}
                      >
                        {p.label}
                      </Text>
                    </View>
                    <Text
                      className="text-[10.5px]"
                      style={{ color: "rgba(245,243,255,0.45)" }}
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
              style={{ color: "rgba(245,243,255,0.5)" }}
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
                      borderColor: s.done
                        ? "transparent"
                        : "rgba(255,255,255,0.3)",
                      backgroundColor: s.done ? "#7c6cf6" : "transparent",
                    }}
                  >
                    {s.done && (
                      <MaterialIcons name="check" size={12} color="#fff" />
                    )}
                  </TouchableOpacity>
                  <Text
                    className="flex-1 text-[13.5px]"
                    style={{
                      color: s.done ? "rgba(245,243,255,0.4)" : "#f5f3ff",
                      textDecorationLine: s.done ? "line-through" : "none",
                    }}
                  >
                    {s.text}
                  </Text>
                  <TouchableOpacity onPress={() => removeSubtask(s.id)}>
                    <MaterialIcons
                      name="close"
                      size={16}
                      color="rgba(245,243,255,0.4)"
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
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Context &amp; Notes
              </Text>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <MaterialIcons
                    name="attach-file"
                    size={14}
                    color="rgba(245,243,255,0.55)"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <MaterialIcons
                    name="mic-none"
                    size={14}
                    color="rgba(245,243,255,0.55)"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add checklist items, links, or specific constraints..."
              placeholderTextColor="rgba(245,243,255,0.35)"
              multiline
              numberOfLines={3}
              className="text-[13.5px]"
              style={{
                color: "#f5f3ff",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 72,
                textAlignVertical: "top",
              }}
            />
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
                <MaterialIcons name="bolt" size={18} color="#cabeff" />
              </LinearGradient>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text
                    className="text-[13.5px] font-bold"
                    style={{ color: "#f5f3ff" }}
                  >
                    Deep Focus Session
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(63,224,197,0.18)" }}
                  >
                    <Text
                      className="text-[10px] font-semibold"
                      style={{ color: "#3fe0c5" }}
                    >
                      45m
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[11.5px] leading-4"
                  style={{ color: "rgba(245,243,255,0.45)" }}
                  numberOfLines={2}
                >
                  1 focus block scheduled. Reduces cognitive drag by binding
                  this task to your evening routine.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Create Task */}
          <TouchableOpacity
            onPress={handleCreate}
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
                Create Task
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}