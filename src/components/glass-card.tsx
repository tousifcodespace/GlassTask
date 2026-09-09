import { BlurView } from "expo-blur";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";

type GlassCardProps = ViewProps & {
  radius?: number;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  /** Optional accent wash rendered edge-to-edge under the content, before padding is applied — use this instead of manually placing an absoluteFill child, which would get inset by the card's own padding. */
  overlayColor?: string;
};

const PADDING_KEYS = [
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingHorizontal",
  "paddingVertical",
  "paddingStart",
  "paddingEnd",
] as const;

export function GlassCard({
  children,
  radius = 20,
  intensity = 35,
  style,
  overlayColor,
  ...rest
}: GlassCardProps) {
  const theme = useAppTheme();

  // Split incoming style: layout props (flex, margin, width, borderColor
  // overrides, etc.) stay on the OUTER rounded+clipped view. Padding moves
  // to the INNER content wrapper instead — otherwise padding on the outer
  // view shrinks the area the blur/tint background layers fill, leaving a
  // sharp-cornered rectangle inset inside the rounded card.
  const flatStyle = (StyleSheet.flatten(style) ?? {}) as Record<
    string,
    unknown
  >;
  const innerStyle: Record<string, unknown> = {};
  const outerStyle: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flatStyle)) {
    if ((PADDING_KEYS as readonly string[]).includes(key)) {
      innerStyle[key] = value;
    } else {
      outerStyle[key] = value;
    }
  }

  // expo-blur's BlurView has poor/inconsistent support on web — it can
  // render as a near-solid tint instead of real blur, which (a) looks like
  // an opaque white/black box and (b) is expensive to repaint across many
  // cards at once, causing visible lag on theme switch. On web we skip the
  // blur entirely and just use a slightly stronger translucent background
  // instead, so it still reads as "glass" without either problem. Native
  // (iOS/Android) keeps the real blur.
  const webFallbackOpacity = theme.mode === "light" ? 0.78 : 0.5;
  const webFallbackColor =
    theme.mode === "light"
      ? `rgba(255,255,255,${webFallbackOpacity})`
      : `rgba(20,16,40,${webFallbackOpacity})`;

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.cardBorder,
        },
        outerStyle,
      ]}
      {...rest}
    >
      {Platform.OS === "web" ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: webFallbackColor },
          ]}
        />
      ) : (
        <BlurView
          intensity={intensity}
          tint={theme.mode === "light" ? "light" : "dark"}
          style={StyleSheet.absoluteFill}
        />
      )}
      {overlayColor && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]}
          pointerEvents="none"
        />
      )}
      <View style={[{ backgroundColor: theme.cardOverlay }, innerStyle]}>
        {children}
      </View>
    </View>
  );
}
