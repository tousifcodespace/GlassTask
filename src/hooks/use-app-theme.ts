import { useColorScheme } from "react-native";

import { AppTheme, darkTheme, lightTheme } from "@/constants/app-theme";
import { useSettingsStore } from "@/store/settings";

export function useAppTheme(): AppTheme {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const resolved =
    themeMode === "system" ? (systemScheme ?? "dark") : themeMode;

  return resolved === "light" ? lightTheme : darkTheme;
}
