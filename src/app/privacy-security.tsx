import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

import { GlassCard } from "@/components/glass-card";
import { ScreenHeader } from "@/components/screen-header";
import { SettingsRow } from "@/components/settings-row";
import { useAppTheme } from "@/hooks/use-app-theme";
import { showAlert } from "@/lib/alert";
import {
  ActiveSession,
  describeUserAgent,
  fetchMySessions,
  revokeSession,
} from "@/lib/sessions";
import { useAuthStore } from "@/store/auth";

const SUPPORT_EMAIL = "support@tousif.tech";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function SectionLabel({ children }: { children: string }) {
  const theme = useAppTheme();
  return (
    <Text
      className="text-[11px] font-bold uppercase tracking-wider mb-3"
      style={{ color: theme.textSubtle }}
    >
      {children}
    </Text>
  );
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
}) {
  const theme = useAppTheme();
  return (
    <View className="flex-row gap-3 py-3.5">
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: theme.chipBg }}
      >
        <MaterialIcons name={icon} size={16} color={theme.textFaint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          className="text-[13.5px] font-bold mb-1"
          style={{ color: theme.text }}
        >
          {title}
        </Text>
        <Text
          className="text-[12px] leading-[18px]"
          style={{ color: theme.textFaint }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function PrivacySecurityScreen() {
  const theme = useAppTheme();
  const session = useAuthStore((s) => s.session);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const hasMfaEnrolled = useAuthStore((s) => s.hasMfaEnrolled);
  const enrollMfa = useAuthStore((s) => s.enrollMfa);
  const confirmMfaEnrollment = useAuthStore((s) => s.confirmMfaEnrollment);
  const disableMfa = useAuthStore((s) => s.disableMfa);

  const provider = session?.user?.app_metadata?.provider ?? "email";
  const accountEmail = session?.user?.email ?? "";
  const createdAt = session?.user?.created_at;
  const memberSinceLabel = useMemo(() => {
    if (!createdAt) return null;
    const d = new Date(createdAt);
    return d.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [createdAt]);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Two-Factor Authentication ---
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaStatusLoading, setMfaStatusLoading] = useState(true);
  const [showMfaEnroll, setShowMfaEnroll] = useState(false);
  const [enrollData, setEnrollData] = useState<{
    factorId: string;
    qrCodeSvg: string;
    secret: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [showDisableMfaConfirm, setShowDisableMfaConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hasMfaEnrolled().then((enrolled) => {
      if (!cancelled) {
        setMfaEnabled(enrolled);
        setMfaStatusLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hasMfaEnrolled]);

  const startMfaEnrollment = async () => {
    setMfaBusy(true);
    const result = await enrollMfa();
    setMfaBusy(false);
    if (!result.ok) {
      showAlert("Couldn't start 2FA setup", result.error);
      return;
    }
    setEnrollData({
      factorId: result.factorId,
      qrCodeSvg: result.qrCodeSvg,
      secret: result.secret,
    });
    setMfaCode("");
    setShowMfaEnroll(true);
  };

  const closeMfaEnroll = () => {
    setShowMfaEnroll(false);
    setEnrollData(null);
    setMfaCode("");
  };

  const handleConfirmMfaEnrollment = async () => {
    if (!enrollData) return;
    if (mfaCode.trim().length !== 6) {
      showAlert("Enter the full code", "Your authenticator app shows a 6-digit code.");
      return;
    }
    setMfaBusy(true);
    const result = await confirmMfaEnrollment(enrollData.factorId, mfaCode);
    setMfaBusy(false);
    if (!result.ok) {
      showAlert("Couldn't verify code", result.error);
      return;
    }
    setMfaEnabled(true);
    closeMfaEnroll();
    showAlert(
      "Two-Factor Authentication enabled",
      "You'll be asked for a code from your authenticator app the next time you sign in.",
    );
  };

  const handleDisableMfa = async () => {
    setMfaBusy(true);
    const result = await disableMfa();
    setMfaBusy(false);
    setShowDisableMfaConfirm(false);
    if (!result.ok) {
      showAlert("Couldn't disable 2FA", result.error);
      return;
    }
    setMfaEnabled(false);
    showAlert("Two-Factor Authentication turned off", "");
  };

  // --- Active Sessions ---
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeTarget, setConfirmRevokeTarget] =
    useState<ActiveSession | null>(null);

  const openSessions = async () => {
    setShowSessions(true);
    setSessionsLoading(true);
    const result = await fetchMySessions();
    setSessionsLoading(false);
    if (!result.ok) {
      showAlert("Couldn't load sessions", result.error);
      return;
    }
    setSessions(result.sessions);
  };

  const handleConfirmRevoke = async () => {
    const target = confirmRevokeTarget;
    if (!target) return;
    setConfirmRevokeTarget(null);
    setRevokingId(target.id);
    const result = await revokeSession(target.id);
    setRevokingId(null);
    if (!result.ok) {
      showAlert("Couldn't sign out that device", result.error);
      return;
    }
    if (target.isCurrent) {
      // The row is gone server-side, but this client still holds a locally
      // cached session/token — sign out here too so the app reflects that
      // immediately instead of appearing logged in until the next token
      // refresh fails.
      await useAuthStore.getState().logout();
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== target.id));
  };

  const closeChangePassword = () => {
    setShowChangePassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowPw(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showAlert("Password too short", "Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Passwords don't match", "Make sure both fields match.");
      return;
    }
    setSaving(true);
    const result = await updatePassword(newPassword);
    setSaving(false);
    if (!result.ok) {
      showAlert("Couldn't update password", result.error);
      return;
    }
    closeChangePassword();
    showAlert("Password updated", "Your password has been changed.");
  };

  const handleRequestDeletion = () => {
    const subject = encodeURIComponent("GlassTask account deletion request");
    const body = encodeURIComponent(
      `Please delete my GlassTask account and all associated data.\n\nAccount email: ${accountEmail}`,
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(
      () => {
        showAlert(
          "Couldn't open email app",
          `Please email ${SUPPORT_EMAIL} directly to request account deletion.`,
        );
      },
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={theme.bgGradient}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="Privacy & Security"
            subtitle="Your account and data"
          />

          {/* Account snapshot */}
          <GlassCard style={{ padding: 16, marginBottom: 20 }}>
            <View className="flex-row items-center gap-3">
              <View
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: `${theme.accentPurple}2e` }}
              >
                <MaterialIcons
                  name={provider === "google" ? "verified-user" : "email"}
                  size={19}
                  color={theme.accentPurpleLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  className="text-[14px] font-bold"
                  style={{ color: theme.text }}
                >
                  {accountEmail || "Signed in"}
                </Text>
                <Text
                  className="text-[11.5px] mt-0.5"
                  style={{ color: theme.textFaint }}
                >
                  {provider === "google"
                    ? "Signed in with Google"
                    : "Signed in with email & password"}
                  {memberSinceLabel ? ` • Member since ${memberSinceLabel}` : ""}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Account security */}
          <SectionLabel>Account Security</SectionLabel>
          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            {provider !== "google" && (
              <>
                <SettingsRow
                  icon="lock-outline"
                  iconBg={theme.chipBg}
                  iconColor={theme.text}
                  title="Change Password"
                  subtitle="Update your login password"
                  onPress={() => setShowChangePassword(true)}
                  right={
                    <MaterialIcons
                      name="chevron-right"
                      size={17}
                      color={theme.textSubtle}
                    />
                  }
                />
                <View style={{ height: 1, backgroundColor: theme.divider }} />
              </>
            )}
            <SettingsRow
              icon="verified-user"
              iconBg={theme.chipBg}
              iconColor={theme.text}
              title="Two-Factor Authentication"
              subtitle={
                mfaStatusLoading
                  ? "Checking…"
                  : mfaEnabled
                    ? "Enabled — using an authenticator app"
                    : "Add a second step when signing in"
              }
              right={
                mfaBusy || mfaStatusLoading ? (
                  <ActivityIndicator size="small" color={theme.textFaint} />
                ) : (
                  <Switch
                    value={mfaEnabled}
                    onValueChange={(next) => {
                      if (next) startMfaEnrollment();
                      else setShowDisableMfaConfirm(true);
                    }}
                    trackColor={{ false: theme.divider, true: theme.accentTeal }}
                  />
                )
              }
            />
            <View style={{ height: 1, backgroundColor: theme.divider }} />
            <SettingsRow
              icon="devices"
              iconBg={theme.chipBg}
              iconColor={theme.text}
              title="Active Sessions"
              subtitle="See where you're signed in"
              onPress={openSessions}
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color={theme.textSubtle}
                />
              }
            />
          </GlassCard>

          {/* What we store */}
          <SectionLabel>What's Stored & Where</SectionLabel>
          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <InfoRow
              icon="storage"
              title="Your account & tasks"
              body="Name, email, phone, date of birth, location, bio, and all your tasks are stored in your own private database record, protected so only you can read or write it — not other users, and not accessible without your login."
            />
            <View style={{ height: 1, backgroundColor: theme.divider }} />
            <InfoRow
              icon="lock"
              title="Your password"
              body="GlassTask never sees or stores your password in plain text. It's handled entirely by our authentication provider using industry-standard hashing — we couldn't read it even if we wanted to."
            />
            <View style={{ height: 1, backgroundColor: theme.divider }} />
            <InfoRow
              icon="smartphone"
              title="Kept only on this device"
              body="Your app theme, notification preferences, and a custom profile photo (if you set one) stay on this device only — they don't sync to other devices or get uploaded anywhere."
            />
          </GlassCard>

          {/* Third parties */}
          <SectionLabel>Services We Use</SectionLabel>
          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <InfoRow
              icon="dns"
              title="Supabase"
              body="Our database, authentication, and account emails are all powered by Supabase."
            />
            {provider === "google" && (
              <>
                <View style={{ height: 1, backgroundColor: theme.divider }} />
                <InfoRow
                  icon="g-translate"
                  title="Google Sign-In"
                  body="You signed in using your Google account. GlassTask only receives your name and email from Google — nothing else."
                />
              </>
            )}
          </GlassCard>

          {/* Danger zone */}
          <SectionLabel>Account Actions</SectionLabel>
          <GlassCard style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <SettingsRow
              icon="delete-outline"
              iconBg="rgba(255,107,129,0.16)"
              iconColor={theme.accentRed}
              title="Request Account Deletion"
              subtitle="Permanently erase your account & data"
              onPress={handleRequestDeletion}
              right={
                <MaterialIcons
                  name="chevron-right"
                  size={17}
                  color={theme.textSubtle}
                />
              }
            />
          </GlassCard>
          <Text
            className="text-[11px] leading-[16px] px-1"
            style={{ color: theme.textSubtle }}
          >
            Deleting your account isn't instant yet — it opens an email to
            our support address, and we'll confirm and remove your data
            manually. This screen is a plain-language summary, not a legal
            document.
          </Text>
        </ScrollView>
      </SafeAreaView>

      {/* Change password modal */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="fade"
        onRequestClose={closeChangePassword}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <View style={{ width: "100%", maxWidth: 380 }}>
            <GlassCard style={{ padding: 20 }}>
              <Text
                className="text-[16px] font-bold mb-4"
                style={{ color: theme.text }}
              >
                Change Password
              </Text>

              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: theme.textFaint }}
              >
                New Password
              </Text>
              <View
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-4"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <MaterialIcons name="lock-outline" size={17} color="#cabeff" />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.textSubtle}
                  secureTextEntry={!showPw}
                  style={{ flex: 1, color: theme.text, fontSize: 15 }}
                />
                <TouchableOpacity onPress={() => setShowPw((v) => !v)}>
                  <MaterialIcons
                    name={showPw ? "visibility-off" : "visibility"}
                    size={18}
                    color={theme.textFaint}
                  />
                </TouchableOpacity>
              </View>

              <Text
                className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                style={{ color: theme.textFaint }}
              >
                Confirm Password
              </Text>
              <View
                className="flex-row items-center gap-2.5 px-4 py-3.5 rounded-2xl mb-5"
                style={{
                  backgroundColor: theme.chipBg,
                  borderWidth: 1,
                  borderColor: theme.chipBorder,
                }}
              >
                <MaterialIcons name="lock-outline" size={17} color="#cabeff" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor={theme.textSubtle}
                  secureTextEntry={!showPw}
                  style={{ flex: 1, color: theme.text, fontSize: 15 }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={closeChangePassword}
                  style={{ flex: 1 }}
                >
                  <View
                    className="rounded-2xl px-4 py-3.5 items-center"
                    style={{
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <Text
                      className="text-[14px] font-bold"
                      style={{ color: theme.text }}
                    >
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={["#7c6cf6", "#22d3ee"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 100,
                      paddingVertical: 14,
                      alignItems: "center",
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#150f30" />
                    ) : (
                      <Text
                        className="text-[14px] font-bold"
                        style={{ color: "#150f30" }}
                      >
                        Update
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* 2FA enrollment modal */}
      <Modal
        visible={showMfaEnroll}
        transparent
        animationType="fade"
        onRequestClose={closeMfaEnroll}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <View style={{ width: "100%", maxWidth: 380 }}>
            <GlassCard style={{ padding: 20 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  className="text-[16px] font-bold mb-1.5"
                  style={{ color: theme.text }}
                >
                  Set Up Two-Factor Authentication
                </Text>
                <Text
                  className="text-[12.5px] mb-4"
                  style={{ color: theme.textFaint }}
                >
                  Scan this with an authenticator app (Google Authenticator,
                  Authy, 1Password, etc.), then enter the 6-digit code it
                  shows you.
                </Text>

                {enrollData && (
                  <View
                    style={{
                      alignItems: "center",
                      backgroundColor: "#ffffff",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 14,
                    }}
                  >
                    <SvgXml xml={enrollData.qrCodeSvg} width={180} height={180} />
                  </View>
                )}

                {enrollData && (
                  <View
                    className="rounded-2xl px-4 py-3 mb-5"
                    style={{
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <Text
                      className="text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: theme.textFaint }}
                    >
                      Can't scan? Enter manually
                    </Text>
                    <Text
                      className="text-[13px]"
                      style={{ color: theme.text, fontFamily: "monospace" }}
                      selectable
                    >
                      {enrollData.secret}
                    </Text>
                  </View>
                )}

                <Text
                  className="text-[10.5px] font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: theme.textFaint }}
                >
                  6-Digit Code
                </Text>
                <TextInput
                  value={mfaCode}
                  onChangeText={(t) => setMfaCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={theme.textSubtle}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={{
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: "800",
                    letterSpacing: 6,
                    color: theme.text,
                    backgroundColor: theme.chipBg,
                    borderRadius: 14,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: theme.chipBorder,
                    marginBottom: 18,
                  }}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity onPress={closeMfaEnroll} style={{ flex: 1 }}>
                    <View
                      className="rounded-2xl px-4 py-3.5 items-center"
                      style={{
                        backgroundColor: theme.chipBg,
                        borderWidth: 1,
                        borderColor: theme.chipBorder,
                      }}
                    >
                      <Text className="text-[14px] font-bold" style={{ color: theme.text }}>
                        Cancel
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmMfaEnrollment}
                    disabled={mfaBusy}
                    style={{ flex: 1 }}
                  >
                    <LinearGradient
                      colors={["#7c6cf6", "#22d3ee"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 100,
                        paddingVertical: 14,
                        alignItems: "center",
                        opacity: mfaBusy ? 0.7 : 1,
                      }}
                    >
                      {mfaBusy ? (
                        <ActivityIndicator color="#150f30" />
                      ) : (
                        <Text className="text-[14px] font-bold" style={{ color: "#150f30" }}>
                          Verify & Enable
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* Disable 2FA confirmation */}
      <Modal
        visible={showDisableMfaConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisableMfaConfirm(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <View style={{ width: "100%", maxWidth: 360 }}>
            <GlassCard style={{ padding: 20 }}>
              <Text className="text-[16px] font-bold mb-1.5" style={{ color: theme.text }}>
                Turn off Two-Factor Authentication?
              </Text>
              <Text className="text-[13px] mb-5" style={{ color: theme.textFaint }}>
                Your account will only need a password to sign in from then
                on.
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowDisableMfaConfirm(false)}
                  style={{ flex: 1 }}
                >
                  <View
                    className="rounded-2xl px-4 py-3.5 items-center"
                    style={{
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <Text className="text-[14px] font-bold" style={{ color: theme.text }}>
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDisableMfa}
                  disabled={mfaBusy}
                  style={{ flex: 1 }}
                >
                  <View
                    className="rounded-2xl px-4 py-3.5 items-center"
                    style={{
                      backgroundColor: `${theme.accentRed}1a`,
                      borderWidth: 1,
                      borderColor: `${theme.accentRed}4d`,
                    }}
                  >
                    {mfaBusy ? (
                      <ActivityIndicator color={theme.accentRed} />
                    ) : (
                      <Text
                        className="text-[14px] font-bold"
                        style={{ color: theme.accentRed }}
                      >
                        Turn Off
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* Active Sessions modal */}
      <Modal
        visible={showSessions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSessions(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View style={{ width: "100%", maxWidth: 420, maxHeight: "80%" }}>
            <GlassCard style={{ padding: 20 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[16px] font-bold" style={{ color: theme.text }}>
                  Active Sessions
                </Text>
                <TouchableOpacity onPress={() => setShowSessions(false)}>
                  <MaterialIcons name="close" size={20} color={theme.textFaint} />
                </TouchableOpacity>
              </View>

              {sessionsLoading ? (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <ActivityIndicator color={theme.text} />
                </View>
              ) : sessions.length === 0 ? (
                <Text
                  className="text-[13px] text-center py-6"
                  style={{ color: theme.textFaint }}
                >
                  No active sessions found.
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                  {sessions.map((s, idx) => (
                    <View key={s.id}>
                      <View className="flex-row items-center gap-3 py-3">
                        <View
                          className="w-9 h-9 rounded-full items-center justify-center"
                          style={{ backgroundColor: theme.chipBg }}
                        >
                          <MaterialIcons
                            name={
                              /phone|android|iphone/i.test(describeUserAgent(s.userAgent))
                                ? "smartphone"
                                : "laptop-mac"
                            }
                            size={16}
                            color={theme.textFaint}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className="text-[13.5px] font-bold"
                              style={{ color: theme.text }}
                            >
                              {describeUserAgent(s.userAgent)}
                            </Text>
                            {s.isCurrent && (
                              <View
                                className="px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: "rgba(63,224,197,0.16)" }}
                              >
                                <Text
                                  className="text-[8.5px] font-bold uppercase"
                                  style={{ color: "#3fe0c5" }}
                                >
                                  This device
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            className="text-[11px] mt-0.5"
                            style={{ color: theme.textFaint }}
                          >
                            Active {formatRelativeTime(s.updatedAt)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => setConfirmRevokeTarget(s)}
                          disabled={revokingId === s.id}
                        >
                          {revokingId === s.id ? (
                            <ActivityIndicator size="small" color={theme.accentRed} />
                          ) : (
                            <Text
                              className="text-[12px] font-bold"
                              style={{ color: theme.accentRed }}
                            >
                              Sign out
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                      {idx < sessions.length - 1 && (
                        <View style={{ height: 1, backgroundColor: theme.divider }} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </GlassCard>
          </View>
        </View>
      </Modal>

      {/* Revoke-session confirmation */}
      <Modal
        visible={!!confirmRevokeTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmRevokeTarget(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <View style={{ width: "100%", maxWidth: 360 }}>
            <GlassCard style={{ padding: 20 }}>
              <Text className="text-[16px] font-bold mb-1.5" style={{ color: theme.text }}>
                Sign out this device?
              </Text>
              <Text className="text-[13px] mb-5" style={{ color: theme.textFaint }}>
                {confirmRevokeTarget?.isCurrent
                  ? "That's your current session — this will log you out here too."
                  : "That device will need to log in again to use GlassTask."}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setConfirmRevokeTarget(null)}
                  style={{ flex: 1 }}
                >
                  <View
                    className="rounded-2xl px-4 py-3.5 items-center"
                    style={{
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <Text className="text-[14px] font-bold" style={{ color: theme.text }}>
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmRevoke} style={{ flex: 1 }}>
                  <View
                    className="rounded-2xl px-4 py-3.5 items-center"
                    style={{
                      backgroundColor: `${theme.accentRed}1a`,
                      borderWidth: 1,
                      borderColor: `${theme.accentRed}4d`,
                    }}
                  >
                    <Text
                      className="text-[14px] font-bold"
                      style={{ color: theme.accentRed }}
                    >
                      Sign Out
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </View>
      </Modal>
    </View>
  );
}