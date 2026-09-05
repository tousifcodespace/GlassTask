import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
          backgroundColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        <MaterialIcons name="chevron-left" size={22} color="#f5f3ff" />
      </TouchableOpacity>

      <View className="items-center">
        <Text className="text-[16px] font-bold" style={{ color: "#f5f3ff" }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-[9.5px] font-semibold tracking-widest"
            style={{ color: "rgba(245,243,255,0.4)" }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={{ minWidth: 40, alignItems: "flex-end" }}>{rightSlot}</View>
    </View>
  );
}
