import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/glass-card";

export function NextUpStreaksRow() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {/* Next Up tile */}
      <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }}>
        <GlassCard style={{ flex: 1, padding: 14 }}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-1">
              <Animated.View
                style={{
                  transform: [{ scale: pulse }],
                  opacity: pulse.interpolate({
                    inputRange: [1, 1.8],
                    outputRange: [1, 0],
                  }),
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#ff6b81",
                }}
              />
              <Text
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "#cabeff" }}
              >
                Next Up
              </Text>
            </View>
            <View
              className="px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(255,107,129,0.18)",
                borderWidth: 1,
                borderColor: "rgba(255,107,129,0.3)",
              }}
            >
              <Text
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: "#ff6b81" }}
              >
                High
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={2}
            className="text-[15px] font-bold"
            style={{ color: "#f5f3ff" }}
          >
            Team Meeting
          </Text>

          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center gap-1">
              <MaterialIcons
                name="schedule"
                size={14}
                color="rgba(245,243,255,0.5)"
              />
              <Text
                className="text-[11px] font-semibold"
                style={{ color: "#f5f3ff" }}
              >
                8:00 PM
              </Text>
            </View>
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(124,108,246,0.2)" }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color: "#cabeff" }}
              >
                in 25m
              </Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Streaks & Focus tile */}
      <TouchableOpacity activeOpacity={0.85} style={{ flex: 1 }}>
        <GlassCard style={{ flex: 1, padding: 14 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(245,243,255,0.62)" }}
            >
              Streaks
            </Text>
            <Text className="text-sm">🔥</Text>
          </View>

          <Text
            className="text-[22px] font-extrabold"
            style={{ color: "#f5f3ff" }}
          >
            4 Days
          </Text>
          <Text className="text-[11px] mt-0.5" style={{ color: "#3fe0c5" }}>
            Record: 12 days
          </Text>

          <View
            className="flex-row items-center justify-between mt-3 pt-2"
            style={{
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.08)",
            }}
          >
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="timer" size={13} color="#c3c0ff" />
              <Text
                className="text-[11px]"
                style={{ color: "rgba(245,243,255,0.62)" }}
              >
                Focus:
              </Text>
            </View>
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#f5f3ff" }}
            >
              2.5h
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </View>
  );
}
