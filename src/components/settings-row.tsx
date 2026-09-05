import { MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export function SettingsRow({
  icon,
  iconColor = "#cabeff",
  iconBg = "rgba(124,108,246,0.18)",
  title,
  subtitle,
  right,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 py-3.5"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <MaterialIcons name={icon} size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-[14.5px] font-bold" style={{ color: "#f5f3ff" }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            className="text-[11.5px] mt-0.5"
            style={{ color: "rgba(245,243,255,0.45)" }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </TouchableOpacity>
  );
}