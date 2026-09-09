import { MaterialIcons } from "@expo/vector-icons";
import { Image, View } from "react-native";

import { getPresetAvatarSource } from "@/constants/avatars";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useProfileStore } from "@/store/profile";

export function AvatarImage({ size = 40 }: { size?: number }) {
  const theme = useAppTheme();
  const profile = useProfileStore((s) => s.profile);

  if (profile.avatarType === "photo" && profile.avatarUri) {
    return (
      <Image
        source={{ uri: profile.avatarUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  if (profile.avatarType === "preset" && profile.avatarId) {
    return (
      <Image
        source={getPresetAvatarSource(profile.avatarId, theme.mode)}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${theme.accentPurple}40`,
      }}
    >
      <MaterialIcons
        name="person"
        size={Math.round(size * 0.55)}
        color={theme.accentPurpleLight}
      />
    </View>
  );
}
