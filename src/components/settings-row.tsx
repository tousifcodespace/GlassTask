import { MaterialIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

export function SettingsRow({
  icon,
  iconColor,
  iconBg,
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
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 py-3.5"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: iconBg ?? `${theme.accentPurple}2e` }}
      >
        <MaterialIcons
          name={icon}
          size={17}
          color={iconColor ?? theme.accentPurpleLight}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-[14.5px] font-bold" style={{ color: theme.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            className="text-[11.5px] mt-0.5"
            style={{ color: theme.textFaint }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </TouchableOpacity>
  );
}
