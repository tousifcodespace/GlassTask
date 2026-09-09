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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassCard } from "@/components/glass-card";
import { GoogleIcon } from "@/components/google-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { showAlert } from "@/lib/alert";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const login = useAuthStore((s) => s.login);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showAlert("Missing info", "Enter both email and password.");
      return;
    }
    const result = await login(email, password);
    if (!result.ok) {
      showAlert("Couldn't log in", result.error);
      return;
    }
    router.replace("/");
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
            {/* Logo */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
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
                <MaterialIcons name="task-alt" size={36} color="#7dd3fc" />
              </View>
              <View className="flex-row">
                <Text
                  className="text-[28px] font-extrabold"
                  style={{ color: theme.text }}
                >
                  Glass
                </Text>
                <Text
                  className="text-[28px] font-extrabold"
                  style={{ color: "#7dd3fc" }}
                >
                  Task
                </Text>
              </View>
              <Text
                className="text-[13px] mt-1"
                style={{ color: theme.textFaint }}
              >
                Stay focused. Get things done.
              </Text>
            </View>

            {/* Form */}
            <GlassCard style={{ padding: 20 }}>
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: theme.textFaint }}
              >
                Email Address
              </Text>
              <View
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-4"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <MaterialIcons name="mail-outline" size={17} color="#cabeff" />
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

              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: theme.textFaint }}
              >
                Password
              </Text>
              <View
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-4"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <MaterialIcons name="lock-outline" size={17} color="#cabeff" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
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

              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center gap-2.5">
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{
                      false: "rgba(255,255,255,0.15)",
                      true: "#7c6cf6",
                    }}
                    thumbColor={theme.text}
                  />
                  <Text
                    className="text-[13px] font-medium"
                    style={{ color: theme.textMuted }}
                  >
                    Remember me
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: "#b57bff" }}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
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
                      <MaterialIcons name="login" size={17} color="#150f30" />
                      <Text
                        className="text-[15px] font-bold"
                        style={{ color: "#150f30" }}
                      >
                        Log In
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View className="flex-row items-center gap-3 my-5">
                <View
                  style={{ flex: 1, height: 1, backgroundColor: theme.divider }}
                />
                <Text
                  className="text-[10.5px] font-semibold"
                  style={{ color: theme.textSubtle }}
                >
                  OR
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: theme.divider }}
                />
              </View>

              <TouchableOpacity
                onPress={async () => {
                  const result = await signInWithGoogle();
                  if (!result.ok) {
                    showAlert("Couldn't sign in with Google", result.error);
                  }
                  // On success, the browser is already navigating to
                  // Google — there's nothing further to do here.
                }}
                className="flex-row items-center justify-center gap-2.5 py-3.5 rounded-2xl"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <GoogleIcon size={16} />
                <Text
                  className="text-[14px] font-semibold"
                  style={{ color: theme.text }}
                >
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity
              onPress={() => router.push("/register")}
              style={{ marginTop: 20 }}
            >
              <Text
                className="text-[13px] text-center"
                style={{ color: theme.textFaint }}
              >
                Don&apos;t have an account?{" "}
                <Text style={{ color: "#3fe0c5", fontWeight: "700" }}>
                  Create Account
                </Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
