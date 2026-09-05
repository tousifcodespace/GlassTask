import "../global.css";

import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useAuthStore } from "@/store/auth";

SplashScreen.preventAutoHideAsync();

const AUTH_ROUTES = ["login", "register"];

function useProtectedRoute(isAuthenticated: boolean, hasHydrated: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    const inAuthGroup = AUTH_ROUTES.includes(segments[0] ?? "");

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

  useProtectedRoute(isAuthenticated, hasHydrated);

  // Avoid flashing the wrong screen before the persisted auth state loads.
  if (!hasHydrated) {
    return <View style={{ flex: 1, backgroundColor: "#0a0818" }} />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}