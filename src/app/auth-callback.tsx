import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuthStore } from "@/store/auth";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const session = useAuthStore((s) => s.session);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // Google redirects the browser back here with the session token in the
  // URL. supabase-js parses that asynchronously (detectSessionInUrl), so
  // `session` can take a beat to become non-null after this screen mounts.
  // Give it a short grace window, same idea as reset-password.tsx.
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/");
      return;
    }
    const timeout = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(timeout);
  }, [session, router]);

  const failed = timedOut && !session && hasHydrated;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        {!failed ? (
          <>
            <ActivityIndicator color={theme.text} size="large" />
            <Text
              className="text-[14px] mt-4"
              style={{ color: theme.textFaint }}
            >
              Finishing sign-in…
            </Text>
          </>
        ) : (
          <View style={{ alignItems: "center", paddingHorizontal: 32 }}>
            <MaterialIcons name="error-outline" size={28} color="#ff6b81" />
            <Text
              className="text-[14px] font-semibold mt-3 text-center"
              style={{ color: theme.text }}
            >
              Couldn't complete Google sign-in.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/login")}
              style={{ marginTop: 16 }}
            >
              <Text
                className="text-[13px] font-bold"
                style={{ color: "#3fe0c5" }}
              >
                Back to Log In
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
