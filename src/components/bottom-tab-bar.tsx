import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";

export type TabKey = "home" | "calendar" | "stats" | "profile";

const tabs: {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { key: "home", label: "Home", icon: "grid-view" },
  { key: "calendar", label: "Calendar", icon: "calendar-today" },
  { key: "stats", label: "Stats", icon: "insights" },
  { key: "profile", label: "Profile", icon: "person" },
];

type BottomTabBarProps = {
  active: TabKey;
  onPressTab: (key: TabKey) => void;
  onPressAdd: () => void;
};

const FAB_SIZE = 46;

export function BottomTabBar({
  active,
  onPressTab,
  onPressAdd,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  return (
    <View
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: insets.bottom + 12,
      }}
    >
      <GlassCard radius={28} intensity={45}>
        <View className="flex-row items-center justify-between px-4 py-2.5">
          {leftTabs.map((tab) => (
            <TabItem
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              active={active === tab.key}
              onPress={() => onPressTab(tab.key)}
            />
          ))}

          {/* Spacer — keeps the left/right groups apart, leaving room for the floating add button above */}
          <View style={{ width: FAB_SIZE }} />

          {rightTabs.map((tab) => (
            <TabItem
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              active={active === tab.key}
              onPress={() => onPressTab(tab.key)}
            />
          ))}
        </View>
      </GlassCard>

      {/* Floating add button — a sibling of GlassCard, NOT a child, so its overflow:hidden never clips it */}
      <TouchableOpacity
        onPress={onPressAdd}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          top: -(FAB_SIZE / 2),
          left: "50%",
          marginLeft: -(FAB_SIZE / 2),
        }}
      >
        <LinearGradient
          colors={["#7c6cf6", "#b57bff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: "rgba(21,15,48,0.9)",
            shadowColor: "#7c6cf6",
            shadowOpacity: 0.5,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function TabItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? "#ffffff" : "rgba(245,243,255,0.4)";
  return (
    <TouchableOpacity onPress={onPress} className="items-center gap-0.5">
      <MaterialIcons name={icon} size={20} color={color} />
      <Text className="text-[9.5px] font-medium" style={{ color }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
