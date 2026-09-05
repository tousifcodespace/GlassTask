import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
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
import { useAuthStore } from "@/store/auth";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const hasAccount = useAuthStore((s) => s.account !== null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = () => {
    if (!hasAccount) {
      Alert.alert(
        "No account yet",
        "There's no account on this device yet — create one first.",
      );
      return;
    }
    const result = login(email, password);
    if (!result.ok) {
      Alert.alert("Couldn't log in", result.error);
      return;
    }
    router.replace("/");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#2a1f52", "#150f30", "#0a0818"]}
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
                  style={{ color: "#f5f3ff" }}
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
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Stay focused. Get things done.
              </Text>
            </View>

            {/* Form */}
            <GlassCard style={{ padding: 20 }}>
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Email Address
              </Text>
              <View
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <MaterialIcons name="mail-outline" size={17} color="#cabeff" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ flex: 1, color: "#f5f3ff", fontSize: 15 }}
                />
              </View>

              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Password
              </Text>
              <View
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <MaterialIcons name="lock-outline" size={17} color="#cabeff" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, color: "#f5f3ff", fontSize: 15 }}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={18}
                    color="rgba(245,243,255,0.45)"
                  />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center gap-2.5">
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7c6cf6" }}
                    thumbColor="#f5f3ff"
                  />
                  <Text
                    className="text-[13px] font-medium"
                    style={{ color: "rgba(245,243,255,0.7)" }}
                  >
                    Remember me
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      "Not wired up yet",
                      "There's no email delivery for password resets in this local build.",
                    )
                  }
                >
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: "#b57bff" }}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleLogin}>
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
                  <MaterialIcons name="login" size={17} color="#150f30" />
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: "#150f30" }}
                  >
                    Log In
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View className="flex-row items-center gap-3 my-5">
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                <Text
                  className="text-[10.5px] font-semibold"
                  style={{ color: "rgba(245,243,255,0.35)" }}
                >
                  OR
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
              </View>

              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Not wired up yet",
                    "Google sign-in isn't connected in this local build.",
                  )
                }
                className="flex-row items-center justify-center gap-2.5 py-3.5 rounded-2xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <MaterialIcons name="g-translate" size={16} color="rgba(245,243,255,0.7)" />
                <Text
                  className="text-[14px] font-semibold"
                  style={{ color: "rgba(245,243,255,0.85)" }}
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
                style={{ color: "rgba(245,243,255,0.5)" }}
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