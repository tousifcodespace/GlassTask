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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      showAlert("Missing email", "Enter the email you registered with.");
      return;
    }
    const result = await sendPasswordReset(email);
    if (!result.ok) {
      showAlert("Couldn't send reset link", result.error);
      return;
    }
    setSent(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFill}
      />

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
            <TouchableOpacity
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/login")
              }
              className="w-10 h-10 rounded-full items-center justify-center mb-6"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <MaterialIcons name="chevron-left" size={22} color={theme.text} />
            </TouchableOpacity>

            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View
                className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
                style={{
                  backgroundColor: "rgba(124,108,246,0.18)",
                  borderWidth: 1.5,
                  borderColor: "rgba(124,108,246,0.5)",
                  shadowColor: "#7c6cf6",
                  shadowOpacity: 0.6,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <MaterialIcons
                  name={sent ? "mark-email-read" : "lock-reset"}
                  size={32}
                  color="#7dd3fc"
                />
              </View>
              <Text
                className="text-[22px] font-extrabold"
                style={{ color: theme.text }}
              >
                {sent ? "Check your email" : "Reset Password"}
              </Text>
              <Text
                className="text-[13px] mt-1 text-center px-4"
                style={{ color: theme.textFaint }}
              >
                {sent
                  ? "We've sent a password reset link to your email. Follow it to set a new password."
                  : "Enter the email tied to your account and we'll send you a reset link."}
              </Text>
            </View>

            {!sent && (
              <GlassCard style={{ padding: 20 }}>
                <Text
                  className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: theme.textFaint }}
                >
                  Email Address
                </Text>
                <View
                  className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-5"
                  style={{
                    backgroundColor: theme.chipBg,
                    borderWidth: 1,
                    borderColor: theme.chipBorder,
                  }}
                >
                  <MaterialIcons
                    name="mail-outline"
                    size={17}
                    color="#cabeff"
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textSubtle}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={{ flex: 1, color: theme.text, fontSize: 15 }}
                  />
                </View>

                <TouchableOpacity onPress={handleSend} disabled={isLoading}>
                  <LinearGradient
                    colors={["#7c6cf6", "#22d3ee"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingVertical: 15,
                      borderRadius: 100,
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#150f30" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={17} color="#150f30" />
                        <Text
                          className="text-[15px] font-bold"
                          style={{ color: "#150f30" }}
                        >
                          Send Reset Link
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </GlassCard>
            )}

            <TouchableOpacity
              onPress={() => router.replace("/login")}
              style={{ marginTop: 20 }}
            >
              <Text
                className="text-[13px] text-center"
                style={{ color: theme.textFaint }}
              >
                Remembered it?{" "}
                <Text style={{ color: "#3fe0c5", fontWeight: "700" }}>
                  Log In
                </Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
