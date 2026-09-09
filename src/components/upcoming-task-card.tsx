import { MaterialIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/glass-card";
import { useAppTheme } from "@/hooks/use-app-theme";

export type UpcomingPriority = "high" | "medium" | "low";

type UpcomingTaskCardProps = {
  priority: UpcomingPriority;
  category: string;
  title: string;
  time: string;
  detail: string;
  done?: boolean;
  overdue?: boolean;
  onToggle?: () => void;
  onMoveToToday?: () => void;
};

export function UpcomingTaskCard({
  priority,
  category,
  title,
  time,
  detail,
  done,
  overdue,
  onToggle,
  onMoveToToday,
}: UpcomingTaskCardProps) {
  const theme = useAppTheme();

  const priorityStyles: Record<
    UpcomingPriority,
    { bg: string; text: string; dot: string; label: string }
  > = {
    high: {
      bg: `${theme.accentRed}29`,
      text: theme.accentRed,
      dot: theme.accentRed,
      label: "High Priority",
    },
    medium: {
      bg: `${theme.accentOrange}29`,
      text: theme.accentOrange,
      dot: theme.accentOrange,
      label: "Medium Priority",
    },
    low: {
      bg: `${theme.accentTeal}29`,
      text: theme.accentTeal,
      dot: theme.accentTeal,
      label: "Low Priority",
    },
  };
  const p = priorityStyles[priority];

  return (
    <GlassCard
      style={
        overdue
          ? {
              marginBottom: 12,
              padding: 16,
              borderColor: `${theme.accentRed}59`,
            }
          : { marginBottom: 12, padding: 16 }
      }
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-2.5">
            <View
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: p.bg }}
            >
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: p.dot }}
              />
              <Text
                className="text-[9.5px] font-bold uppercase tracking-wide"
                style={{ color: p.text }}
              >
                {p.label}
              </Text>
            </View>
            <View
              className="px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: theme.chipBg,
                borderWidth: 1,
                borderColor: theme.chipBorder,
              }}
            >
              <Text
                className="text-[10.5px] font-medium"
                style={{ color: theme.textMuted }}
              >
                {category}
              </Text>
            </View>
          </View>

          <Text
            className="text-[16px] font-bold mb-1.5"
            style={{ color: theme.text }}
          >
            {title}
          </Text>

          <View className="flex-row items-center gap-1.5">
            <MaterialIcons name="schedule" size={13} color={theme.textFaint} />
            <Text className="text-[12px]" style={{ color: theme.textFaint }}>
              {time} • {detail}
            </Text>
          </View>

          {overdue && (
            <View
              className="flex-row items-center justify-between mt-2.5 pt-2.5"
              style={{
                borderTopWidth: 1,
                borderTopColor: `${theme.accentRed}33`,
              }}
            >
              <View className="flex-row items-center gap-1">
                <MaterialIcons
                  name="error-outline"
                  size={13}
                  color={theme.accentRed}
                />
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: theme.accentRed }}
                >
                  Overdue
                </Text>
              </View>
              <TouchableOpacity
                onPress={onMoveToToday}
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${theme.accentPurple}38` }}
              >
                <MaterialIcons
                  name="update"
                  size={12}
                  color={theme.accentPurpleLight}
                />
                <Text
                  className="text-[10.5px] font-semibold"
                  style={{ color: theme.accentPurpleLight }}
                >
                  Move to Today
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onToggle}
          className="w-10 h-10 rounded-full items-center justify-center ml-3"
          style={{
            borderWidth: 2,
            borderColor: done ? "transparent" : theme.chipBorder,
            backgroundColor: done ? theme.accentPurple : "transparent",
          }}
        >
          {done && <MaterialIcons name="check" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}
