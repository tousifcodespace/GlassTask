import { MaterialIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/glass-card";

export type UpcomingPriority = "high" | "medium" | "low";

const priorityStyles: Record<
  UpcomingPriority,
  { bg: string; text: string; dot: string; label: string }
> = {
  high: {
    bg: "rgba(255,107,129,0.16)",
    text: "#ff6b81",
    dot: "#ff6b81",
    label: "High Priority",
  },
  medium: {
    bg: "rgba(255,184,77,0.16)",
    text: "#ffb84d",
    dot: "#ffb84d",
    label: "Medium Priority",
  },
  low: {
    bg: "rgba(63,224,197,0.16)",
    text: "#3fe0c5",
    dot: "#3fe0c5",
    label: "Low Priority",
  },
};

type UpcomingTaskCardProps = {
  priority: UpcomingPriority;
  category: string;
  title: string;
  time: string;
  detail: string;
  done?: boolean;
  onToggle?: () => void;
};

export function UpcomingTaskCard({
  priority,
  category,
  title,
  time,
  detail,
  done,
  onToggle,
}: UpcomingTaskCardProps) {
  const p = priorityStyles[priority];

  return (
    <GlassCard style={{ marginBottom: 12, padding: 16 }}>
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
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <Text
                className="text-[10.5px] font-medium"
                style={{ color: "rgba(245,243,255,0.62)" }}
              >
                {category}
              </Text>
            </View>
          </View>

          <Text
            className="text-[16px] font-bold mb-1.5"
            style={{ color: "#f5f3ff" }}
          >
            {title}
          </Text>

          <View className="flex-row items-center gap-1.5">
            <MaterialIcons
              name="schedule"
              size={13}
              color="rgba(245,243,255,0.45)"
            />
            <Text
              className="text-[12px]"
              style={{ color: "rgba(245,243,255,0.45)" }}
            >
              {time} • {detail}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onToggle}
          className="w-10 h-10 rounded-full items-center justify-center ml-3"
          style={{
            borderWidth: 2,
            borderColor: done ? "transparent" : "rgba(255,255,255,0.18)",
            backgroundColor: done ? "#7c6cf6" : "transparent",
          }}
        >
          {done && <MaterialIcons name="check" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}
