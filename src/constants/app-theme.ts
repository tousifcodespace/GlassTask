/**
 * GlassTask's real theme tokens — used by the app's own screens.
 * (This is separate from src/constants/theme.ts, which is unused leftover
 * scaffolding from the default Expo template that only the leftover
 * explore/app-tabs/themed-* boilerplate screens reference.)
 */

export type AppTheme = {
  mode: "light" | "dark";
  /** Full-screen background gradient, top → bottom. */
  bgGradient: readonly [string, string, string];
  text: string;
  textMuted: string;
  textFaint: string;
  textSubtle: string;
  accentPurple: string;
  accentPurpleLight: string;
  accentCyan: string;
  accentTeal: string;
  accentRed: string;
  accentOrange: string;
  cardBorder: string;
  cardOverlay: string;
  chipBg: string;
  chipBorder: string;
  divider: string;
  statusBarStyle: "light" | "dark";
};

export const darkTheme: AppTheme = {
  mode: "dark",
  bgGradient: ["#2a1f52", "#150f30", "#0a0818"],
  text: "#f5f3ff",
  textMuted: "rgba(245,243,255,0.7)",
  textFaint: "rgba(245,243,255,0.5)",
  textSubtle: "rgba(245,243,255,0.35)",
  accentPurple: "#7c6cf6",
  accentPurpleLight: "#cabeff",
  accentCyan: "#22d3ee",
  accentTeal: "#3fe0c5",
  accentRed: "#ff6b81",
  accentOrange: "#ffb84d",
  cardBorder: "rgba(255,255,255,0.12)",
  cardOverlay: "rgba(255,255,255,0.04)",
  chipBg: "rgba(255,255,255,0.06)",
  chipBorder: "rgba(255,255,255,0.12)",
  divider: "rgba(255,255,255,0.08)",
  statusBarStyle: "light",
};

export const lightTheme: AppTheme = {
  mode: "light",
  bgGradient: ["#eef0ff", "#e6e9fb", "#f8f8ff"],
  text: "#1c1a2e",
  textMuted: "rgba(28,26,46,0.65)",
  textFaint: "rgba(28,26,46,0.5)",
  textSubtle: "rgba(28,26,46,0.35)",
  accentPurple: "#6d54f0",
  accentPurpleLight: "#5b3fd6",
  accentCyan: "#0891b2",
  accentTeal: "#0d9488",
  accentRed: "#e11d48",
  accentOrange: "#c2680a",
  cardBorder: "rgba(28,26,46,0.1)",
  cardOverlay: "rgba(255,255,255,0.55)",
  chipBg: "rgba(28,26,46,0.05)",
  chipBorder: "rgba(28,26,46,0.1)",
  divider: "rgba(28,26,46,0.08)",
  statusBarStyle: "dark",
};
