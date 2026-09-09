import { Alert, Platform } from "react-native";

/**
 * react-native-web doesn't reliably implement Alert.alert — on many setups
 * it silently no-ops (no dialog, no callback ever fires). That made web
 * users think buttons were doing nothing when validation was actually
 * blocking them (e.g. the "agree to terms" check on the register screen).
 * Use this everywhere instead of calling Alert.alert directly, so the
 * message is always visible regardless of platform. Any onPress passed in
 * `buttons` should not be relied on for critical flow (e.g. navigation) —
 * trigger that directly in the caller instead, since window.alert has no
 * concept of multiple buttons/callbacks.
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}
