import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AvatarImage } from "@/components/avatar-image";
import { AvatarPickerModal } from "@/components/avatar-picker-modal";
import { useAppTheme } from "@/hooks/use-app-theme";
import { showAlert } from "@/lib/alert";
import { useProfileStore } from "@/store/profile";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatLongDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

const BIO_MAX_LENGTH = 160;

function FieldShell({
  icon,
  label,
  children,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  children: ReactNode;
}) {
  const theme = useAppTheme();
  return (
    <View
      className="rounded-2xl px-4 py-3 mb-3"
      style={{
        backgroundColor: theme.chipBg,
        borderWidth: 1,
        borderColor: theme.chipBorder,
      }}
    >
      <View className="flex-row items-center gap-1.5 mb-1.5">
        <MaterialIcons name={icon} size={12} color={theme.textFaint} />
        <Text
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: theme.textFaint }}
        >
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);

  const [dobDate, setDobDate] = useState<Date | null>(
    profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
  );
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const onChangeDob = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDobPicker(false);
    if (event.type === "set" && selected) setDobDate(selected);
  };

  const handleSave = async () => {
    const result = await updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim(),
      dateOfBirth: dobDate ? dobDate.toISOString() : "",
    });
    if (!result.ok) {
      showAlert("Couldn't save profile", result.error);
      return;
    }
    router.canGoBack() ? router.back() : router.replace("/profile");
  };

  const handleDiscard = () => {
    router.canGoBack() ? router.back() : router.replace("/profile");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity
                onPress={handleDiscard}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <MaterialIcons name="arrow-back" size={19} color={theme.text} />
              </TouchableOpacity>

              <View style={{ alignItems: "center" }}>
                <Text
                  className="text-[17px] font-bold"
                  style={{ color: theme.text }}
                >
                  Edit Profile
                </Text>
                <Text
                  className="text-[11px]"
                  style={{ color: theme.textFaint }}
                >
                  Update your information
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSave}
                className="px-4 py-2 rounded-full"
                style={{ backgroundColor: "rgba(124,108,246,0.35)" }}
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: "#fff" }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>

            {/* Avatar */}
            <View style={{ alignItems: "center", marginBottom: 10 }}>
              <TouchableOpacity onPress={() => setShowAvatarPicker(true)}>
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: 2,
                    borderColor: theme.accentPurple,
                    padding: 2,
                    marginBottom: 12,
                  }}
                >
                  <AvatarImage size={88} />
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center absolute"
                    style={{
                      bottom: -2,
                      right: -2,
                      backgroundColor: theme.accentCyan,
                      borderWidth: 2,
                      borderColor:
                        theme.mode === "dark" ? "#150f30" : "#ffffff",
                    }}
                  >
                    <MaterialIcons
                      name="photo-camera"
                      size={14}
                      color="#0a0818"
                    />
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center gap-1.5"
                onPress={() => setShowAvatarPicker(true)}
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={13}
                  color={theme.accentPurpleLight}
                />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: theme.accentPurpleLight }}
                >
                  Change Photo
                </Text>
              </TouchableOpacity>
            </View>

            <AvatarPickerModal
              visible={showAvatarPicker}
              onClose={() => setShowAvatarPicker(false)}
            />

            {/* Form */}
            <View style={{ marginTop: 12 }}>
              <FieldShell icon="person-outline" label="Full Name">
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your name"
                  placeholderTextColor={theme.textSubtle}
                  style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="alternate-email" label="Email Address">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textSubtle}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="call" label="Phone Number">
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+880 1XXX XXXXXX"
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="phone-pad"
                  style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="cake" label="Date of Birth">
                <TouchableOpacity
                  className="flex-row items-center justify-between"
                  onPress={() => setShowDobPicker(true)}
                >
                  <Text
                    style={{
                      color: dobDate ? theme.text : theme.textSubtle,
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {dobDate ? formatLongDate(dobDate) : "Select date of birth"}
                  </Text>
                  <MaterialIcons
                    name="unfold-more"
                    size={16}
                    color={theme.textFaint}
                  />
                </TouchableOpacity>
              </FieldShell>

              <FieldShell icon="place" label="Location">
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  placeholderTextColor={theme.textSubtle}
                  style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="edit-note" label="Bio">
                <TextInput
                  value={bio}
                  onChangeText={(t) => setBio(t.slice(0, BIO_MAX_LENGTH))}
                  placeholder="A short line about you"
                  placeholderTextColor={theme.textSubtle}
                  multiline
                  maxLength={BIO_MAX_LENGTH}
                  style={{
                    color: theme.text,
                    fontSize: 14,
                    lineHeight: 20,
                    minHeight: 44,
                    textAlignVertical: "top",
                  }}
                />
                <View className="flex-row items-center justify-between mt-2">
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons
                      name="code"
                      size={11}
                      color={theme.textSubtle}
                    />
                    <Text
                      className="text-[10.5px]"
                      style={{ color: theme.textSubtle }}
                    >
                      Markdown supported
                    </Text>
                  </View>
                  <Text
                    className="text-[10.5px] font-semibold"
                    style={{ color: theme.textFaint }}
                  >
                    {bio.length} / {BIO_MAX_LENGTH}
                  </Text>
                </View>
              </FieldShell>
            </View>

            {/* Save / Discard */}
            <TouchableOpacity onPress={handleSave} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={["#7c6cf6", "#22d3ee"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 15,
                  borderRadius: 100,
                }}
              >
                <MaterialIcons name="check" size={17} color="#150f30" />
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: "#150f30" }}
                >
                  Save Changes
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDiscard} style={{ marginTop: 14 }}>
              <Text
                className="text-[13px] font-medium text-center"
                style={{ color: theme.textFaint }}
              >
                Discard Changes
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showDobPicker &&
        (Platform.OS === "ios" ? (
          <Modal transparent animationType="fade">
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                backgroundColor: "rgba(10,8,24,0.6)",
              }}
            >
              <View
                style={{
                  backgroundColor:
                    theme.mode === "dark" ? "#1a1438" : "#ffffff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingBottom: 24,
                }}
              >
                <View className="flex-row items-center justify-between px-5 py-3">
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: theme.textMuted }}
                  >
                    Date of Birth
                  </Text>
                  <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                    <Text
                      className="text-[13px] font-bold"
                      style={{ color: "#b57bff" }}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dobDate ?? new Date(2000, 0, 1)}
                  mode="date"
                  display="inline"
                  themeVariant={theme.mode === "dark" ? "dark" : "light"}
                  maximumDate={new Date()}
                  onChange={onChangeDob}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={dobDate ?? new Date(2000, 0, 1)}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onChangeDob}
          />
        ))}
    </View>
  );
}
