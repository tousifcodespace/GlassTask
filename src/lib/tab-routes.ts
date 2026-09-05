import type { TabKey } from "@/components/bottom-tab-bar";

/**
 * Maps bottom-tab keys to their route. Tabs without a screen yet (stats,
 * profile) are left out on purpose — tapping them just highlights locally
 * until that screen exists, instead of navigating to a 404.
 */
export const TAB_ROUTES: Partial<
  Record<TabKey, "/" | "/calendar" | "/stats" | "/profile">
> = {
  home: "/",
  calendar: "/calendar",
  stats: "/stats",
  profile: "/profile",
};