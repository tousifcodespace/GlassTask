import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";
import { SettingsRow } from "@/components/settings-row";
import { useSettingsStore } from "@/store/settings";
import { formatClockTime } from "@/store/tasks";

/** Parses a "11:00 PM" style label back into a Date (today's date, that time). */
function parseTimeLabel(label: string): Date {
  const match = label.match(/(\d+):(\d+)\s*(AM|PM)/i);
  const d = new Date();
  if (!match) return d;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function SectionLabel({
  icon,
  iconColor,
  label,
  right,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  label: string;
  right?: string;
}) {
  return (
    <View className="flex-row items-center justify-between mb-2.5">
      <View className="flex-row items-center gap-1.5">
        <MaterialIcons name={icon} size={13} color={iconColor} />
        <Text
          className="text-[10.5px] font-bold uppercase tracking-wider"
          style={{ color: "rgba(245,243,255,0.55)" }}
        >
          {label}
        </Text>
      </View>
      {right ? (
        <Text className="text-[10.5px]" style={{ color: "rgba(245,243,255,0.4)" }}>
          {right}
        </Text>
      ) : null}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)" }} />;
}

export default function NotificationsScreen() {
  const router = useRouter();

  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const toggleNotificationsEnabled = useSettingsStore((s) => s.toggleNotificationsEnabled);
  const reminderOffsetMinutes = useSettingsStore((s) => s.reminderOffsetMinutes);
  const cycleReminderOffset = useSettingsStore((s) => s.cycleReminderOffset);
  const reminderSound = useSettingsStore((s) => s.reminderSound);
  const cycleReminderSound = useSettingsStore((s) => s.cycleReminderSound);
  const notificationHapticsEnabled = useSettingsStore((s) => s.notificationHapticsEnabled);
  const toggleNotificationHaptics = useSettingsStore((s) => s.toggleNotificationHaptics);
  const snoozeMinutes = useSettingsStore((s) => s.snoozeMinutes);
  const cycleSnoozeMinutes = useSettingsStore((s) => s.cycleSnoozeMinutes);

  const repeatMissedReminders = useSettingsStore((s) => s.repeatMissedReminders);
  const toggleRepeatMissedReminders = useSettingsStore((s) => s.toggleRepeatMissedReminders);
  const remindUntilCompleted = useSettingsStore((s) => s.remindUntilCompleted);
  const toggleRemindUntilCompleted = useSettingsStore((s) => s.toggleRemindUntilCompleted);
  const showOverdueTasks = useSettingsStore((s) => s.showOverdueTasks);
  const toggleShowOverdueTasks = useSettingsStore((s) => s.toggleShowOverdueTasks);

  const quietHoursEnabled = useSettingsStore((s) => s.quietHoursEnabled);
  const toggleQuietHours = useSettingsStore((s) => s.toggleQuietHours);
  const quietHoursStart = useSettingsStore((s) => s.quietHoursStart);
  const quietHoursEnd = useSettingsStore((s) => s.quietHoursEnd);
  const setQuietHoursStart = useSettingsStore((s) => s.setQuietHoursStart);
  const setQuietHoursEnd = useSettingsStore((s) => s.setQuietHoursEnd);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onChangeStart = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowStartPicker(false);
    if (event.type === "set" && selected) setQuietHoursStart(formatClockTime(selected));
  };

  const onChangeEnd = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowEndPicker(false);
    if (event.type === "set" && selected) setQuietHoursEnd(formatClockTime(selected));
  };

  const sendTestNotification = () => {
    // TODO: wire to a real push once expo-notifications is added — this is a
    // visual stand-in so the screen feels complete without that dependency.
    Alert.alert(
      "Test Notification",
      `${reminderSound} chime · ${notificationHapticsEnabled ? "with haptics" : "no haptics"}`,
    );
  };

  const reminderRowStyle = { opacity: notificationsEnabled ? 1 : 0.45 };
  const quietRowStyle = { opacity: quietHoursEnabled ? 1 : 0.45 };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#2a1f52", "#150f30", "#0a0818"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/profile"))}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
            >
              <MaterialIcons name="chevron-left" size={22} color="#f5f3ff" />
            </TouchableOpacity>

            <View
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
            >
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3fe0c5" }} />
              <Text className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: "rgba(245,243,255,0.7)" }}>
                Alert Engine
              </Text>
            </View>

            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
            >
              <MaterialIcons name="tune" size={17} color="#f5f3ff" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-baseline gap-1.5 mb-1.5">
            <Text className="text-[26px] font-extrabold" style={{ color: "#f5f3ff" }}>
              Notifications
            </Text>
            <Text className="text-[16px] font-medium" style={{ color: "rgba(245,243,255,0.4)" }}>
              / Reminders
            </Text>
          </View>
          <Text className="text-[13px] leading-5 mb-5" style={{ color: "rgba(245,243,255,0.5)" }}>
            Customize how you receive reminders &amp; stay in effortless flow.
          </Text>

          {/* Push delivery / next quiet time */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <GlassCard style={{ flex: 1, padding: 14 }}>
              <View
                className="w-9 h-9 rounded-full items-center justify-center mb-2.5"
                style={{ backgroundColor: "rgba(124,108,246,0.2)" }}
              >
                <MaterialIcons name="notifications-none" size={16} color="#cabeff" />
              </View>
              <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(245,243,255,0.4)" }}>
                Push Delivery
              </Text>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[15px] font-bold" style={{ color: "#f5f3ff" }}>
                  {notificationsEnabled ? "Instant" : "Paused"}
                </Text>
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: notificationsEnabled ? "#3fe0c5" : "rgba(245,243,255,0.3)" }}
                />
              </View>
            </GlassCard>

            <GlassCard style={{ flex: 1, padding: 14 }}>
              <View
                className="w-9 h-9 rounded-full items-center justify-center mb-2.5"
                style={{ backgroundColor: "rgba(63,224,197,0.18)" }}
              >
                <MaterialIcons name="bedtime" size={15} color="#3fe0c5" />
              </View>
              <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(245,243,255,0.4)" }}>
                Next Quiet Time
              </Text>
              <Text className="text-[15px] font-bold" style={{ color: "#f5f3ff" }}>
                {quietHoursEnabled ? quietHoursStart : "Off"}
              </Text>
            </GlassCard>
          </View>

          {/* Reminder Settings */}
          <SectionLabel
            icon="notifications"
            iconColor="#b57bff"
            label="Reminder Settings"
            right={notificationsEnabled ? "Active Profile" : "Paused"}
          />
          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <SettingsRow
              icon="notifications"
              iconColor="#cabeff"
              iconBg="rgba(124,108,246,0.2)"
              title="Enable Notifications"
              subtitle="Allow reminders on this device"
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotificationsEnabled}
                  trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7c6cf6" }}
                  thumbColor="#f5f3ff"
                />
              }
            />
            <Divider />
            <View style={reminderRowStyle}>
              <SettingsRow
                icon="hourglass-empty"
                iconColor="#7dd3fc"
                iconBg="rgba(125,211,252,0.15)"
                title="Default Reminder"
                subtitle="Pre-execution lead alert"
                onPress={notificationsEnabled ? cycleReminderOffset : undefined}
                right={
                  <View className="flex-row items-center gap-1.5">
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <Text className="text-[11px] font-semibold" style={{ color: "rgba(245,243,255,0.75)" }}>
                        {reminderOffsetMinutes} minutes before
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={17} color="rgba(245,243,255,0.35)" />
                  </View>
                }
              />
            </View>
            <Divider />
            <View style={reminderRowStyle}>
              <SettingsRow
                icon="volume-up"
                iconColor="#ffb84d"
                iconBg="rgba(255,184,77,0.15)"
                title="Reminder Sound"
                subtitle="Acoustic glass chime"
                onPress={notificationsEnabled ? cycleReminderSound : undefined}
                right={
                  <View className="flex-row items-center gap-1.5">
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <Text className="text-[11px] font-semibold" style={{ color: "rgba(245,243,255,0.75)" }}>
                        {reminderSound}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={17} color="rgba(245,243,255,0.35)" />
                  </View>
                }
              />
            </View>
            <Divider />
            <View style={reminderRowStyle}>
              <SettingsRow
                icon="vibration"
                iconColor="#3fe0c5"
                iconBg="rgba(63,224,197,0.15)"
                title="Haptic Feedback"
                subtitle="Tactile pulse on task trigger"
                right={
                  <Switch
                    disabled={!notificationsEnabled}
                    value={notificationHapticsEnabled}
                    onValueChange={toggleNotificationHaptics}
                    trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7c6cf6" }}
                    thumbColor="#f5f3ff"
                  />
                }
              />
            </View>
            <Divider />
            <View style={reminderRowStyle}>
              <SettingsRow
                icon="snooze"
                iconColor="#ff6b81"
                iconBg="rgba(255,107,129,0.15)"
                title="Snooze Duration"
                subtitle="Interval for snoozed alerts"
                onPress={notificationsEnabled ? cycleSnoozeMinutes : undefined}
                right={
                  <View className="flex-row items-center gap-1.5">
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <Text className="text-[11px] font-semibold" style={{ color: "rgba(245,243,255,0.75)" }}>
                        {snoozeMinutes} minutes
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={17} color="rgba(245,243,255,0.35)" />
                  </View>
                }
              />
            </View>
          </GlassCard>

          {/* Smart Reminders */}
          <SectionLabel icon="auto-awesome" iconColor="#60a5fa" label="Smart Reminders" right="AI Adaptive Cadence" />
          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <SettingsRow
              icon="repeat"
              iconColor="#7dd3fc"
              iconBg="rgba(125,211,252,0.15)"
              title="Repeat missed reminders"
              subtitle="Follow-up if task isn't acknowledged"
              right={
                <Switch
                  value={repeatMissedReminders}
                  onValueChange={toggleRepeatMissedReminders}
                  trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7c6cf6" }}
                  thumbColor="#f5f3ff"
                />
              }
            />
            <Divider />
            <SettingsRow
              icon="check-circle-outline"
              iconColor="#f5f3ff"
              iconBg="rgba(255,255,255,0.08)"
              title="Remind me until completed"
              subtitle="Periodic nudge every 30 mins"
              right={
                <Switch
                  value={remindUntilCompleted}
                  onValueChange={toggleRemindUntilCompleted}
                  trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7c6cf6" }}
                  thumbColor="#f5f3ff"
                />
              }
            />
            <Divider />
            <SettingsRow
              icon="error-outline"
              iconColor="#ffb84d"
              iconBg="rgba(255,184,77,0.15)"
              title="Show overdue tasks"
              subtitle="Prioritize high-priority backlogs"
              right={
                <Switch
                  value={showOverdueTasks}
                  onValueChange={toggleShowOverdueTasks}
                  trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7c6cf6" }}
                  thumbColor="#f5f3ff"
                />
              }
            />
          </GlassCard>

          {/* Quiet Hours */}
          <SectionLabel icon="bedtime" iconColor="#b57bff" label="Quiet Hours" right="Do Not Disturb" />
          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <SettingsRow
              icon="bedtime"
              iconColor="#cabeff"
              iconBg="rgba(124,108,246,0.2)"
              title="Enable Quiet Hours"
              subtitle="Mute all audible sound and haptics"
              right={
                <Switch
                  value={quietHoursEnabled}
                  onValueChange={toggleQuietHours}
                  trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7c6cf6" }}
                  thumbColor="#f5f3ff"
                />
              }
            />
            <Divider />
            <View style={quietRowStyle}>
              <SettingsRow
                icon="schedule"
                iconColor="rgba(245,243,255,0.7)"
                iconBg="rgba(255,255,255,0.08)"
                title="Start"
                subtitle="Evening wind-down threshold"
                onPress={quietHoursEnabled ? () => setShowStartPicker(true) : undefined}
                right={
                  <View className="flex-row items-center gap-1.5">
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(124,108,246,0.25)" }}>
                      <Text className="text-[11px] font-semibold" style={{ color: "#e4defc" }}>
                        {quietHoursStart}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={17} color="rgba(245,243,255,0.35)" />
                  </View>
                }
              />
            </View>
            <Divider />
            <View style={quietRowStyle}>
              <SettingsRow
                icon="wb-sunny"
                iconColor="rgba(245,243,255,0.7)"
                iconBg="rgba(255,255,255,0.08)"
                title="End"
                subtitle="Morning wake-up boundary"
                onPress={quietHoursEnabled ? () => setShowEndPicker(true) : undefined}
                right={
                  <View className="flex-row items-center gap-1.5">
                    <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(63,224,197,0.2)" }}>
                      <Text className="text-[11px] font-semibold" style={{ color: "#a8f5e6" }}>
                        {quietHoursEnd}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={17} color="rgba(245,243,255,0.35)" />
                  </View>
                }
              />
            </View>
          </GlassCard>

          {showStartPicker &&
            (Platform.OS === "ios" ? (
              <Modal transparent animationType="fade">
                <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10,8,24,0.6)" }}>
                  <View style={{ backgroundColor: "#1a1438", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 }}>
                    <View className="flex-row items-center justify-between px-5 py-3">
                      <Text className="text-[13px] font-semibold" style={{ color: "rgba(245,243,255,0.6)" }}>
                        Quiet Hours Start
                      </Text>
                      <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                        <Text className="text-[13px] font-bold" style={{ color: "#b57bff" }}>
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={parseTimeLabel(quietHoursStart)}
                      mode="time"
                      display="spinner"
                      themeVariant="dark"
                      onChange={onChangeStart}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker value={parseTimeLabel(quietHoursStart)} mode="time" display="default" onChange={onChangeStart} />
            ))}

          {showEndPicker &&
            (Platform.OS === "ios" ? (
              <Modal transparent animationType="fade">
                <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(10,8,24,0.6)" }}>
                  <View style={{ backgroundColor: "#1a1438", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 }}>
                    <View className="flex-row items-center justify-between px-5 py-3">
                      <Text className="text-[13px] font-semibold" style={{ color: "rgba(245,243,255,0.6)" }}>
                        Quiet Hours End
                      </Text>
                      <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                        <Text className="text-[13px] font-bold" style={{ color: "#b57bff" }}>
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={parseTimeLabel(quietHoursEnd)}
                      mode="time"
                      display="spinner"
                      themeVariant="dark"
                      onChange={onChangeEnd}
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker value={parseTimeLabel(quietHoursEnd)} mode="time" display="default" onChange={onChangeEnd} />
            ))}

          {/* Proactive intelligence banner */}
          <GlassCard
            style={{ marginBottom: 20, padding: 14, borderColor: "rgba(63,224,197,0.3)" }}
          >
            <View className="flex-row gap-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: "rgba(63,224,197,0.18)" }}
              >
                <MaterialIcons name="info-outline" size={15} color="#3fe0c5" />
              </View>
              <View style={{ flex: 1 }}>
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Text className="text-[13px] font-bold" style={{ color: "#f5f3ff" }}>
                    Proactive Intelligence
                  </Text>
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3fe0c5" }} />
                </View>
                <Text className="text-[12px] leading-4" style={{ color: "rgba(245,243,255,0.5)" }}>
                  Notifications will help you stay on track without missing important tasks.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Test notification */}
          <TouchableOpacity onPress={sendTestNotification}>
            <View
              className="flex-row items-center justify-center gap-2 py-3.5 rounded-2xl"
              style={{ backgroundColor: "rgba(124,108,246,0.18)", borderWidth: 1, borderColor: "rgba(124,108,246,0.4)" }}
            >
              <MaterialIcons name="send" size={16} color="#cabeff" />
              <Text className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "#cabeff" }}>
                Send Test Notification Chime
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}