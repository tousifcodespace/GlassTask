import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuthStore } from "@/store/auth";
import { useTaskStore } from "@/store/tasks";

SplashScreen.preventAutoHideAsync();

const AUTH_ROUTES = ["login", "register", "forgot-password"];

function useProtectedRoute(isAuthenticated: boolean, hasHydrated: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    const current = segments[0] ?? "";

    // A password-recovery link, or an OAuth redirect back from Google,
    // makes the user "authenticated" once Supabase parses the URL token —
    // but both need a moment to do that parsing, and reset-password
    // specifically needs the user to stay put until they set a new
    // password. Keep both fully outside the auth-gate logic; each handles
    // its own missing/invalid-session state internally.
    if (current === "reset-password" || current === "auth-callback") return;

    const inAuthGroup = AUTH_ROUTES.includes(current);

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, hasHydrated, segments, router]);
}

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const init = useAuthStore((s) => s.init);
  const theme = useAppTheme();

  useEffect(() => {
    init();
  }, [init]);

  useProtectedRoute(isAuthenticated, hasHydrated);

  // Auto-generate today's occurrence for any Daily/Weekly/Monthly recurring tasks.
  useEffect(() => {
    useTaskStore.getState().rolloverRecurringTasks();
  }, []);

  // Avoid flashing the wrong screen before the persisted auth state loads.
  if (!hasHydrated) {
    return <View style={{ flex: 1, backgroundColor: theme.bgGradient[2] }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme.mode === "light" ? DefaultTheme : DarkTheme}>
        <StatusBar style={theme.statusBarStyle} />
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
