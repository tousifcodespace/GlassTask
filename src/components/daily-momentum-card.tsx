import { MaterialIcons } from "@expo/vector-icons";
import { useId } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

import { GlassCard } from "@/components/glass-card";
import { useAppTheme } from "@/hooks/use-app-theme";

const SIZE = 108;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type DailyMomentumCardProps = {
  percent: number;
  done: number;
  total: number;
  status?: string;
};

export function DailyMomentumCard({
  percent,
  done,
  total,
  status,
}: DailyMomentumCardProps) {
  const theme = useAppTheme();
  const gradId = `momentumGrad-${useId()}`;
  const offset = CIRCUMFERENCE * (1 - percent / 100);
  const filledSegments =
    total === 0 ? 0 : Math.max(1, Math.round((percent / 100) * 5));
  const statusLabel =
    status ??
    (total === 0
      ? "No tasks yet"
      : percent >= 100
        ? "Perfect day — everything's done"
        : percent >= 50
          ? `Good pace • ${total - done} task${total - done === 1 ? "" : "s"} left`
          : `Getting started • ${total - done} task${total - done === 1 ? "" : "s"} left`);
  const flowLabel =
    percent >= 100 ? "COMPLETE" : percent >= 50 ? "IN FLOW" : "STARTING";

  return (
    <GlassCard style={{ marginBottom: 16, padding: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: `${theme.accentPurple}38` }}
          >
            <MaterialIcons
              name="water-drop"
              size={14}
              color={theme.accentPurpleLight}
            />
          </View>
          <Text
            className="text-[14px] font-semibold"
            style={{ color: theme.text }}
          >
            Daily Momentum
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: theme.chipBg,
            borderWidth: 1,
            borderColor: theme.chipBorder,
          }}
        >
          <Text
            className="text-[10px] font-bold tracking-wider"
            style={{ color: theme.text }}
          >
            {flowLabel}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-5 mb-4">
        <View style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Defs>
              <SvgLinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={theme.accentCyan} />
                <Stop offset="1" stopColor={theme.accentPurple} />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={theme.divider}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={`url(#${gradId})`}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Text
              className="text-[22px] font-extrabold"
              style={{ color: theme.text }}
            >
              {percent}%
            </Text>
            <Text
              className="text-[9px] font-semibold tracking-wider"
              style={{ color: theme.textSubtle }}
            >
              DONE
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <Text
            className="text-[17px] font-bold mb-1"
            style={{ color: theme.text }}
          >
            {done} of {total} done
          </Text>
          <Text
            className="text-[12px] mb-2.5"
            style={{ color: theme.textFaint }}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{
              backgroundColor:
                i < filledSegments
                  ? i === 0
                    ? theme.accentCyan
                    : theme.accentPurple
                  : theme.divider,
            }}
          />
        ))}
      </View>
    </GlassCard>
  );
}
