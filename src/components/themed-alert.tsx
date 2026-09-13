import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { useAppTheme } from "@/hooks/use-app-theme";
import { AlertType, useAlertStore } from "@/store/alert";

const TYPE_META: Record<
  AlertType,
  { icon: keyof typeof MaterialIcons.glyphMap; colorKey: "accentTeal" | "accentRed" | "accentOrange" | "accentPurple" }
> = {
  success: { icon: "check-circle", colorKey: "accentTeal" },
  error: { icon: "error-outline", colorKey: "accentRed" },
  warning: { icon: "info-outline", colorKey: "accentOrange" },
  info: { icon: "info-outline", colorKey: "accentPurple" },
};

export function ThemedAlert() {
  const theme = useAppTheme();
  const { visible, title, message, type, hide } = useAlertStore();

  const meta = TYPE_META[type];
  const accent = theme[meta.colorKey];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
          backgroundColor: "rgba(10,8,24,0.55)",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 340,
            borderRadius: 24,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.cardBorder,
          }}
        >
          <BlurView
            intensity={50}
            tint={theme.mode === "light" ? "light" : "dark"}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <View
            style={{
              backgroundColor: theme.cardOverlay,
              paddingHorizontal: 24,
              paddingTop: 28,
              paddingBottom: 20,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${accent}26`,
                marginBottom: 14,
              }}
            >
              <MaterialIcons name={meta.icon} size={26} color={accent} />
            </View>

            <Text
              className="text-[16px] font-bold text-center mb-1.5"
              style={{ color: theme.text }}
            >
              {title}
            </Text>

            {!!message && (
              <Text
                className="text-[13px] text-center leading-5 mb-5"
                style={{ color: theme.textFaint }}
              >
                {message}
              </Text>
            )}

            <TouchableOpacity
              onPress={hide}
              style={{
                alignSelf: "stretch",
                marginTop: message ? 0 : 14,
                paddingVertical: 13,
                borderRadius: 100,
                alignItems: "center",
                backgroundColor: accent,
              }}
            >
              <Text
                className="text-[14px] font-bold"
                style={{ color: theme.mode === "light" ? "#ffffff" : "#0a0818" }}
              >
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}