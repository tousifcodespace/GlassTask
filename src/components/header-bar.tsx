import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity, View } from "react-native";

export function HeaderBar() {
  return (
    <View className="flex-row items-center justify-between mb-5">
      <View className="flex-row items-center gap-3">
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ borderWidth: 1.5, borderColor: "rgba(124,108,246,0.5)" }}
        >
          <LinearGradient
            colors={["#22d3ee", "#7c6cf6"]}
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
          <Text className="text-[16px] font-bold" style={{ color: "#f5f3ff" }}>
            Liquid Task
          </Text>
          <Text
            className="text-[9.5px] font-semibold tracking-widest"
            style={{ color: "rgba(245,243,255,0.4)" }}
          >
            BENTO OS
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
            }}
          >
            <MaterialIcons
              name="notifications-none"
              size={19}
              color="#f5f3ff"
            />
          </TouchableOpacity>
          <View
            className="w-2.5 h-2.5 rounded-full absolute -top-0.5 -right-0.5"
            style={{
              backgroundColor: "#3fe0c5",
              borderWidth: 1.5,
              borderColor: "#0a0818",
            }}
          />
        </View>

        {/* Swap the inner View for <Image source={...} /> once a real avatar photo is available */}
        <View>
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ borderWidth: 1.5, borderColor: "rgba(124,108,246,0.5)" }}
          >
            <View
              className="w-full h-full rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(124,108,246,0.25)" }}
            >
              <MaterialIcons name="person" size={18} color="#cabeff" />
            </View>
          </View>
          <View
            className="w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5"
            style={{
              backgroundColor: "#3fe0c5",
              borderWidth: 1.5,
              borderColor: "#0a0818",
            }}
          />
        </View>
      </View>
    </View>
  );
}
