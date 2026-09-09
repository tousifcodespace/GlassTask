import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    AvatarId,
    FEMALE_AVATAR_IDS,
    getPresetAvatarSource,
    MALE_AVATAR_IDS,
} from "@/constants/avatars";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useProfileStore } from "@/store/profile";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AvatarPickerModal({ visible, onClose }: Props) {
  const theme = useAppTheme();
  const profile = useProfileStore((s) => s.profile);
  const setPresetAvatar = useProfileStore((s) => s.setPresetAvatar);
  const setPhotoAvatar = useProfileStore((s) => s.setPhotoAvatar);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickPreset = (id: AvatarId) => {
    setPresetAvatar(id);
    onClose();
  };

  const handleUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "GlassTask needs access to your photos to set a profile picture.",
      );
      return;
    }

    setIsUploading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    setIsUploading(false);

    if (!result.canceled && result.assets[0]) {
      setPhotoAvatar(result.assets[0].uri);
      onClose();
    }
  };

  const AvatarSection = ({
    label,
    ids,
  }: {
    label: string;
    ids: AvatarId[];
  }) => (
    <View style={{ marginBottom: 20 }}>
      <Text
        className="text-[11px] font-bold uppercase tracking-wider mb-3"
        style={{ color: theme.textFaint }}
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 14 }}>
        {ids.map((id) => {
          const selected =
            profile.avatarType === "preset" && profile.avatarId === id;
          return (
            <TouchableOpacity key={id} onPress={() => handlePickPreset(id)}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  padding: selected ? 2.5 : 0,
                  borderWidth: selected ? 2.5 : 0,
                  borderColor: theme.accentPurple,
                }}
              >
                <Image
                  source={getPresetAvatarSource(id, theme.mode)}
                  style={{ width: "100%", height: "100%", borderRadius: 32 }}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(10,8,24,0.6)",
        }}
      >
        <View
          style={{
            backgroundColor: theme.mode === "dark" ? "#1a1438" : "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "85%",
          }}
        >
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Text
              className="text-[17px] font-bold"
              style={{ color: theme.text }}
            >
              Choose Avatar
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={22} color={theme.textFaint} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleUploadPhoto}
            disabled={isUploading}
            className="flex-row items-center gap-3 mx-5 mb-5 px-4 py-3.5 rounded-2xl"
            style={{
              backgroundColor: `${theme.accentPurple}22`,
              borderWidth: 1,
              borderColor: `${theme.accentPurple}55`,
              opacity: isUploading ? 0.6 : 1,
            }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${theme.accentPurple}40` }}
            >
              <MaterialIcons
                name="add-a-photo"
                size={18}
                color={theme.accentPurpleLight}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                className="text-[14px] font-bold"
                style={{ color: theme.text }}
              >
                {isUploading ? "Uploading..." : "Upload Your Own Photo"}
              </Text>
              <Text
                className="text-[11.5px] mt-0.5"
                style={{ color: theme.textFaint }}
              >
                Pick from your gallery
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={18}
              color={theme.textSubtle}
            />
          </TouchableOpacity>

          <Text
            className="text-[11px] px-5 mb-1"
            style={{ color: theme.textSubtle }}
          >
            Or pick a preset — matches your current{" "}
            {theme.mode === "dark" ? "dark" : "light"} theme automatically
          </Text>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            <AvatarSection label="Male Avatars" ids={MALE_AVATAR_IDS} />
            <AvatarSection label="Female Avatars" ids={FEMALE_AVATAR_IDS} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
