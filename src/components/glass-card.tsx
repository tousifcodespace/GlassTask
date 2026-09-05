import { BlurView } from 'expo-blur';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

type GlassCardProps = ViewProps & {
  radius?: number;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
};

export function GlassCard({
  children,
  radius = 20,
  intensity = 35,
  style,
  ...rest
}: GlassCardProps) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        },
        style,
      ]}
      {...rest}
    >
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>{children}</View>
    </View>
  );
}