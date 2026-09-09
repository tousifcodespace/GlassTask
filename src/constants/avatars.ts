/**
 * Preset avatar registry. Each avatar has a stable `id` (e.g. "male-3") that
 * stays the same across both themes — only the underlying image swaps when
 * the app's dark/light theme changes, so a person's chosen avatar always
 * matches the current theme automatically.
 */

export type AvatarGender = "male" | "female";
export type AvatarId = `${AvatarGender}-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export const MALE_AVATAR_IDS: AvatarId[] = [
  "male-1",
  "male-2",
  "male-3",
  "male-4",
  "male-5",
  "male-6",
  "male-7",
  "male-8",
];

export const FEMALE_AVATAR_IDS: AvatarId[] = [
  "female-1",
  "female-2",
  "female-3",
  "female-4",
  "female-5",
  "female-6",
  "female-7",
  "female-8",
];

export const DARK_AVATARS: Record<AvatarId, number> = {
  "male-1": require("../../assets/images/avatars/dark/male-1.png"),
  "male-2": require("../../assets/images/avatars/dark/male-2.png"),
  "male-3": require("../../assets/images/avatars/dark/male-3.png"),
  "male-4": require("../../assets/images/avatars/dark/male-4.png"),
  "male-5": require("../../assets/images/avatars/dark/male-5.png"),
  "male-6": require("../../assets/images/avatars/dark/male-6.png"),
  "male-7": require("../../assets/images/avatars/dark/male-7.png"),
  "male-8": require("../../assets/images/avatars/dark/male-8.png"),
  "female-1": require("../../assets/images/avatars/dark/female-1.png"),
  "female-2": require("../../assets/images/avatars/dark/female-2.png"),
  "female-3": require("../../assets/images/avatars/dark/female-3.png"),
  "female-4": require("../../assets/images/avatars/dark/female-4.png"),
  "female-5": require("../../assets/images/avatars/dark/female-5.png"),
  "female-6": require("../../assets/images/avatars/dark/female-6.png"),
  "female-7": require("../../assets/images/avatars/dark/female-7.png"),
  "female-8": require("../../assets/images/avatars/dark/female-8.png"),
};

export const LIGHT_AVATARS: Record<AvatarId, number> = {
  "male-1": require("../../assets/images/avatars/light/male-1.png"),
  "male-2": require("../../assets/images/avatars/light/male-2.png"),
  "male-3": require("../../assets/images/avatars/light/male-3.png"),
  "male-4": require("../../assets/images/avatars/light/male-4.png"),
  "male-5": require("../../assets/images/avatars/light/male-5.png"),
  "male-6": require("../../assets/images/avatars/light/male-6.png"),
  "male-7": require("../../assets/images/avatars/light/male-7.png"),
  "male-8": require("../../assets/images/avatars/light/male-8.png"),
  "female-1": require("../../assets/images/avatars/light/female-1.png"),
  "female-2": require("../../assets/images/avatars/light/female-2.png"),
  "female-3": require("../../assets/images/avatars/light/female-3.png"),
  "female-4": require("../../assets/images/avatars/light/female-4.png"),
  "female-5": require("../../assets/images/avatars/light/female-5.png"),
  "female-6": require("../../assets/images/avatars/light/female-6.png"),
  "female-7": require("../../assets/images/avatars/light/female-7.png"),
  "female-8": require("../../assets/images/avatars/light/female-8.png"),
};

export function getPresetAvatarSource(
  id: AvatarId,
  themeMode: "dark" | "light",
): number {
  return themeMode === "light" ? LIGHT_AVATARS[id] : DARK_AVATARS[id];
}
