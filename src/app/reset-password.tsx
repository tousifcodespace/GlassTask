import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const session = useAuthStore((s) => s.session);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  // Clicking the emailed link lands here with the recovery token in the
  // URL. supabase-js parses that asynchronously (detectSessionInUrl) and
  // only then does `session` become non-null — so a missing session for a
  // brief moment after mount doesn't necessarily mean the link is invalid.
  // Give it a short grace window before treating it as expired/invalid.
  const [checkingLink, setCheckingLink] = useState(true);
  useEffect(() => {
    if (session) {
      setCheckingLink(false);
      return;
    }
    const timeout = setTimeout(() => setCheckingLink(false), 2500);
    return () => clearTimeout(timeout);
  }, [session]);

  const handleUpdate = async () => {
    if (password.length < 8) {
      showAlert("Password too short", "Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showAlert("Passwords don't match", "Make sure both fields match.");
      return;
    }
    const result = await updatePassword(password);
    if (!result.ok) {
      showAlert("Couldn't update password", result.error);
      return;
    }
    setDone(true);
  };

  const linkInvalid = !checkingLink && !session && hasHydrated;

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
                  name={done ? "check-circle" : "lock-reset"}
                  size={32}
                  color="#7dd3fc"
                />
              </View>
              <Text
                className="text-[22px] font-extrabold"
                style={{ color: theme.text }}
              >
                {done ? "Password Updated" : "Set New Password"}
              </Text>
              {done && (
                <Text
                  className="text-[13px] mt-1 text-center px-4"
                  style={{ color: theme.textFaint }}
                >
                  You're all set. Continue to your dashboard.
                </Text>
              )}
            </View>

            {checkingLink && !session && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <ActivityIndicator color={theme.text} />
                <Text
                  className="text-[13px] mt-3"
                  style={{ color: theme.textFaint }}
                >
                  Verifying your reset link…
                </Text>
              </View>
            )}

            {linkInvalid && !done && (
              <GlassCard style={{ padding: 20 }}>
                <View style={{ alignItems: "center" }}>
                  <MaterialIcons
                    name="error-outline"
                    size={28}
                    color="#ff6b81"
                  />
                  <Text
                    className="text-[14px] font-semibold mt-3 text-center"
                    style={{ color: theme.text }}
                  >
                    This reset link is invalid or has expired.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.replace("/forgot-password")}
                    style={{ marginTop: 16 }}
                  >
                    <Text
                      className="text-[13px] font-bold"
                      style={{ color: "#3fe0c5" }}
                    >
                      Request a new link
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}

            {session && !done && (
              <GlassCard style={{ padding: 20 }}>
                <Text
                  className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: theme.textFaint }}
                >
                  New Password
                </Text>
                <View
                  className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-4"
                  style={{
                    backgroundColor: theme.chipBg,
                    borderWidth: 1,
                    borderColor: theme.chipBorder,
                  }}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={17}
                    color="#cabeff"
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={theme.textSubtle}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, color: theme.text, fontSize: 15 }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={18}
                      color={theme.textFaint}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: theme.textFaint }}
                >
                  Confirm Password
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
                    name="lock-outline"
                    size={17}
                    color="#cabeff"
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor={theme.textSubtle}
                    secureTextEntry={!showPassword}
                    style={{ flex: 1, color: theme.text, fontSize: 15 }}
                  />
                </View>

                <TouchableOpacity onPress={handleUpdate} disabled={isLoading}>
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
                        <MaterialIcons name="check" size={17} color="#150f30" />
                        <Text
                          className="text-[15px] font-bold"
                          style={{ color: "#150f30" }}
                        >
                          Update Password
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </GlassCard>
            )}

            {done && (
              <TouchableOpacity onPress={() => router.replace("/")}>
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
                  }}
                >
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: "#150f30" }}
                  >
                    Continue to Dashboard
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
