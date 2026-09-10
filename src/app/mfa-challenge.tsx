import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import { showAlert } from "@/lib/alert";
import { useAuthStore } from "@/store/auth";

export default function MfaChallengeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const verifyMfaChallenge = useAuthStore((s) => s.verifyMfaChallenge);
  const logout = useAuthStore((s) => s.logout);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      showAlert("Enter the full code", "Your authenticator app shows a 6-digit code.");
      return;
    }
    setVerifying(true);
    const result = await verifyMfaChallenge(code);
    setVerifying(false);
    if (!result.ok) {
      showAlert("Couldn't verify code", result.error);
      setCode("");
      return;
    }
    router.replace("/");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              justifyContent: "center",
              paddingVertical: 40,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View
                className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
                style={{
                  backgroundColor: "rgba(124,108,246,0.18)",
                  borderWidth: 1.5,
                  borderColor: "rgba(124,108,246,0.5)",
                }}
              >
                <MaterialIcons name="verified-user" size={32} color="#7dd3fc" />
              </View>
              <Text className="text-[22px] font-extrabold" style={{ color: theme.text }}>
                Two-Factor Check
              </Text>
              <Text
                className="text-[13px] mt-1 text-center px-4"
                style={{ color: theme.textFaint }}
              >
                Enter the 6-digit code from your authenticator app to
                finish signing in.
              </Text>
            </View>

            <GlassCard style={{ padding: 20 }}>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={theme.textSubtle}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={{
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: "800",
                  letterSpacing: 8,
                  color: theme.text,
                  backgroundColor: theme.chipBg,
                  borderRadius: 16,
                  paddingVertical: 16,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                  marginBottom: 18,
                }}
              />

              <TouchableOpacity onPress={handleVerify} disabled={verifying}>
                <LinearGradient
                  colors={["#7c6cf6", "#22d3ee"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 100,
                    paddingVertical: 15,
                    alignItems: "center",
                    opacity: verifying ? 0.7 : 1,
                  }}
                >
                  {verifying ? (
                    <ActivityIndicator color="#150f30" />
                  ) : (
                    <Text className="text-[15px] font-bold" style={{ color: "#150f30" }}>
                      Verify
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity
              onPress={async () => {
                await logout();
                router.replace("/login");
              }}
              style={{ marginTop: 20 }}
            >
              <Text
                className="text-[13px] text-center"
                style={{ color: theme.textFaint }}
              >
                Not you, or lost your device?{" "}
                <Text style={{ color: "#ff8899", fontWeight: "700" }}>
                  Log out
                </Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}