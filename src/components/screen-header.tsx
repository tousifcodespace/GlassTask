import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
};

export function ScreenHeader({
  title,
  subtitle,
  rightSlot,
  onBack,
}: ScreenHeaderProps) {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View className="flex-row items-center justify-between mb-5">
      <TouchableOpacity
        onPress={
          onBack ??
          (() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          })
        }
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: theme.chipBg,
          borderWidth: 1,
          borderColor: theme.chipBorder,
        }}
      >
        <MaterialIcons name="chevron-left" size={22} color={theme.text} />
      </TouchableOpacity>

      <View className="items-center">
        <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-[9.5px] font-semibold tracking-widest"
            style={{ color: theme.textFaint }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ minWidth: 40, alignItems: "flex-end" }}>{rightSlot}</View>
    </View>
  );
}
