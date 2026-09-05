import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
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
import { useAuthStore } from "@/store/auth";
import { useProfileStore } from "@/store/profile";

const STRENGTH_META = [
  { label: "Too short", color: "#ff6b81" },
  { label: "Weak", color: "#ffb84d" },
  { label: "Good", color: "#22d3ee" },
  { label: "Strong", color: "#7c6cf6" },
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: "", color: "rgba(255,255,255,0.15)" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const meta = STRENGTH_META[score];
  return { score, label: meta.label, color: meta.color };
}

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleCreateAccount = () => {
    if (!agreedToTerms) {
      Alert.alert(
        "Almost there",
        "Please agree to the Terms of Service and Privacy Policy first.",
      );
      return;
    }
    const result = register(fullName, email, password);
    if (!result.ok) {
      Alert.alert("Couldn't create account", result.error);
      return;
    }
    updateProfile({ fullName: fullName.trim(), email: email.trim().toLowerCase() });
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
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))}
              className="w-10 h-10 rounded-full items-center justify-center mb-4"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
              }}
            >
              <MaterialIcons name="chevron-left" size={22} color="#f5f3ff" />
            </TouchableOpacity>

            {/* Logo */}
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
                <MaterialIcons name="task-alt" size={36} color="#7dd3fc" />
              </View>
              <View className="flex-row">
                <Text
                  className="text-[24px] font-extrabold"
                  style={{ color: "#f5f3ff" }}
                >
                  Create{" "}
                </Text>
                <Text
                  className="text-[24px] font-extrabold"
                  style={{ color: "#7dd3fc" }}
                >
                  Account
                </Text>
              </View>
              <Text
                className="text-[13px] mt-1"
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Start organizing your day with GlassTask
              </Text>
            </View>

            {/* Form */}
            <GlassCard style={{ padding: 20 }}>
              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Full Name
              </Text>
              <View
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <MaterialIcons name="person-outline" size={17} color="#cabeff" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your name"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  style={{ flex: 1, color: "#f5f3ff", fontSize: 15 }}
                />
              </View>

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
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-2"
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
                  placeholder="At least 8 characters"
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

              {/* Strength meter */}
              <View className="flex-row gap-1.5 mb-2">
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor:
                        i <= strength.score && password.length > 0
                          ? strength.color
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </View>

              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-row items-center gap-1.5">
                  <MaterialIcons
                    name={password.length >= 8 ? "check-circle" : "radio-button-unchecked"}
                    size={13}
                    color={password.length >= 8 ? "#3fe0c5" : "rgba(245,243,255,0.3)"}
                  />
                  <Text
                    className="text-[11.5px]"
                    style={{
                      color: password.length >= 8 ? "#3fe0c5" : "rgba(245,243,255,0.4)",
                    }}
                  >
                    Use at least 8 characters
                  </Text>
                </View>
                {password.length > 0 && (
                  <Text
                    className="text-[11.5px] font-bold"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setAgreedToTerms((v) => !v)}
                className="flex-row items-center gap-2.5 mb-5"
              >
                <View
                  className="w-5 h-5 rounded items-center justify-center"
                  style={{
                    backgroundColor: agreedToTerms ? "#3fe0c5" : "transparent",
                    borderWidth: 1.5,
                    borderColor: agreedToTerms ? "#3fe0c5" : "rgba(255,255,255,0.25)",
                  }}
                >
                  {agreedToTerms && (
                    <MaterialIcons name="check" size={13} color="#0a0818" />
                  )}
                </View>
                <Text
                  className="text-[12.5px] flex-1"
                  style={{ color: "rgba(245,243,255,0.6)" }}
                >
                  I agree to the{" "}
                  <Text style={{ color: "#3fe0c5", fontWeight: "600" }}>
                    Terms of Service
                  </Text>{" "}
                  and{" "}
                  <Text style={{ color: "#3fe0c5", fontWeight: "600" }}>
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleCreateAccount}>
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
                  <MaterialIcons name="person-add" size={17} color="#150f30" />
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: "#150f30" }}
                  >
                    Create Account
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
              onPress={() => router.replace("/login")}
              style={{ marginTop: 20 }}
            >
              <Text
                className="text-[13px] text-center"
                style={{ color: "rgba(245,243,255,0.5)" }}
              >
                Already have an account?{" "}
                <Text style={{ color: "#3fe0c5", fontWeight: "700" }}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}