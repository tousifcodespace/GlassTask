import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
    Circle,
    Defs,
    Stop,
    LinearGradient as SvgLinearGradient,
} from "react-native-svg";

import { GlassCard } from "@/components/glass-card";

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
  status = "Optimal pace • 4 tasks to hit goal",
}: DailyMomentumCardProps) {
  const offset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <GlassCard style={{ marginBottom: 16, padding: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(124,108,246,0.22)" }}
          >
            <MaterialIcons name="water-drop" size={14} color="#b57bff" />
          </View>
          <Text
            className="text-[14px] font-semibold"
            style={{ color: "#f5f3ff" }}
          >
            Daily Momentum
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.14)",
          }}
        >
          <Text
            className="text-[10px] font-bold tracking-wider"
            style={{ color: "#f5f3ff" }}
          >
            IN FLOW
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-5 mb-4">
        <View style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Defs>
              <SvgLinearGradient id="momentumGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#22d3ee" />
                <Stop offset="1" stopColor="#7c6cf6" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="url(#momentumGrad)"
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
              style={{ color: "#f5f3ff" }}
            >
              {percent}%
            </Text>
            <Text
              className="text-[9px] font-semibold tracking-wider"
              style={{ color: "rgba(245,243,255,0.4)" }}
            >
              DONE
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <Text
            className="text-[17px] font-bold mb-1"
            style={{ color: "#f5f3ff" }}
          >
            {done} of {total} done
          </Text>
          <Text
            className="text-[12px] mb-2.5"
            style={{ color: "rgba(245,243,255,0.5)" }}
          >
            {status}
          </Text>
          <View
            className="self-start flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <MaterialIcons name="bolt" size={13} color="#ffb84d" />
            <Text
              className="text-[11.5px] font-medium"
              style={{ color: "#f5f3ff" }}
            >
              Deep Focus
            </Text>
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#3fe0c5" }}
            />
          </View>
        </View>
      </View>

      <View className="flex-row gap-1.5">
        {[1, 1, 1, 0, 0].map((filled, i) => (
          <View
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{
              backgroundColor: filled
                ? i === 0
                  ? "#22d3ee"
                  : "#7c6cf6"
                : "rgba(255,255,255,0.10)",
            }}
          />
        ))}
      </View>
    </GlassCard>
  );
}
