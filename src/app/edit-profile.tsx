import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    Alert,
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
  return (
    <View
      className="rounded-2xl px-4 py-3 mb-3"
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <View className="flex-row items-center gap-1.5 mb-1.5">
        <MaterialIcons name={icon} size={12} color="rgba(245,243,255,0.5)" />
        <Text
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "rgba(245,243,255,0.5)" }}
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

  const onChangeDob = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDobPicker(false);
    if (event.type === "set" && selected) setDobDate(selected);
  };

  const handleSave = () => {
    updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim(),
      dateOfBirth: dobDate ? dobDate.toISOString() : "",
    });
    router.canGoBack() ? router.back() : router.replace("/profile");
  };

  const handleDiscard = () => {
    router.canGoBack() ? router.back() : router.replace("/profile");
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#2a1f52", "#150f30", "#0a0818"]}
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
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <MaterialIcons name="arrow-back" size={19} color="#f5f3ff" />
              </TouchableOpacity>

              <View style={{ alignItems: "center" }}>
                <Text
                  className="text-[17px] font-bold"
                  style={{ color: "#f5f3ff" }}
                >
                  Edit Profile
                </Text>
                <Text
                  className="text-[11px]"
                  style={{ color: "rgba(245,243,255,0.45)" }}
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
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-3"
                style={{
                  borderWidth: 2,
                  borderColor: "#7c6cf6",
                  backgroundColor: "rgba(124,108,246,0.15)",
                }}
              >
                <MaterialIcons name="person" size={42} color="#cabeff" />
                <View
                  className="w-8 h-8 rounded-full items-center justify-center absolute"
                  style={{
                    bottom: -2,
                    right: -2,
                    backgroundColor: "#22d3ee",
                    borderWidth: 2,
                    borderColor: "#150f30",
                  }}
                >
                  <MaterialIcons name="photo-camera" size={14} color="#0a0818" />
                </View>
              </View>
              <TouchableOpacity
                className="flex-row items-center gap-1.5"
                onPress={() =>
                  Alert.alert(
                    "Coming soon",
                    "Photo upload isn't wired up yet — this is a placeholder for now.",
                  )
                }
              >
                <MaterialIcons name="auto-awesome" size={13} color="#b57bff" />
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: "#b57bff" }}
                >
                  Change Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={{ marginTop: 12 }}>
              <FieldShell icon="person-outline" label="Full Name">
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your name"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  style={{ color: "#f5f3ff", fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="alternate-email" label="Email Address">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={{ color: "#f5f3ff", fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="call" label="Phone Number">
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+880 1XXX XXXXXX"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  keyboardType="phone-pad"
                  style={{ color: "#f5f3ff", fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="cake" label="Date of Birth">
                <TouchableOpacity
                  className="flex-row items-center justify-between"
                  onPress={() => setShowDobPicker(true)}
                >
                  <Text
                    style={{
                      color: dobDate ? "#f5f3ff" : "rgba(245,243,255,0.3)",
                      fontSize: 15,
                      fontWeight: "600",
                    }}
                  >
                    {dobDate ? formatLongDate(dobDate) : "Select date of birth"}
                  </Text>
                  <MaterialIcons
                    name="unfold-more"
                    size={16}
                    color="rgba(245,243,255,0.4)"
                  />
                </TouchableOpacity>
              </FieldShell>

              <FieldShell icon="place" label="Location">
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  style={{ color: "#f5f3ff", fontSize: 15, fontWeight: "600" }}
                />
              </FieldShell>

              <FieldShell icon="edit-note" label="Bio">
                <TextInput
                  value={bio}
                  onChangeText={(t) => setBio(t.slice(0, BIO_MAX_LENGTH))}
                  placeholder="A short line about you"
                  placeholderTextColor="rgba(245,243,255,0.3)"
                  multiline
                  maxLength={BIO_MAX_LENGTH}
                  style={{
                    color: "#f5f3ff",
                    fontSize: 14,
                    lineHeight: 20,
                    minHeight: 44,
                    textAlignVertical: "top",
                  }}
                />
                <View className="flex-row items-center justify-between mt-2">
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons name="code" size={11} color="rgba(245,243,255,0.3)" />
                    <Text
                      className="text-[10.5px]"
                      style={{ color: "rgba(245,243,255,0.3)" }}
                    >
                      Markdown supported
                    </Text>
                  </View>
                  <Text
                    className="text-[10.5px] font-semibold"
                    style={{ color: "rgba(245,243,255,0.4)" }}
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
                style={{ color: "rgba(245,243,255,0.4)" }}
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
                  backgroundColor: "#1a1438",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingBottom: 24,
                }}
              >
                <View className="flex-row items-center justify-between px-5 py-3">
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: "rgba(245,243,255,0.6)" }}
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
                  themeVariant="dark"
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