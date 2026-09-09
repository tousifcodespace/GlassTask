import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { AvatarImage } from "@/components/avatar-image";
import { useAppTheme } from "@/hooks/use-app-theme";

export function HeaderBar() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View className="flex-row items-center justify-between mb-5">
      <View className="flex-row items-center gap-3">
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ borderWidth: 1.5, borderColor: `${theme.accentPurple}80` }}
        >
          <LinearGradient
            colors={[theme.accentCyan, theme.accentPurple]}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="check" size={18} color="#fff" />
          </LinearGradient>
        </View>
        <View>
          <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
            GlassTask
          </Text>
          <Text
            className="text-[9.5px] font-semibold tracking-widest"
            style={{ color: theme.textSubtle }}
          >
            BENTO OS
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: theme.chipBg,
              borderWidth: 1,
              borderColor: theme.chipBorder,
            }}
          >
            <MaterialIcons
              name="notifications-none"
              size={19}
              color={theme.text}
            />
          </TouchableOpacity>
          <View
            className="w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5"
            style={{
              backgroundColor: theme.accentTeal,
              borderWidth: 1.5,
              borderColor: theme.bgGradient[2],
            }}
          />
        </View>

        {/* Swap the inner View for <Image source={...} /> once a real avatar photo is available */}
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ borderWidth: 1.5, borderColor: `${theme.accentPurple}80` }}
          >
            <AvatarImage size={34} />
          </View>
          <View
            className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5"
            style={{
              backgroundColor: theme.accentTeal,
              borderWidth: 1.5,
              borderColor: theme.bgGradient[2],
            }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
