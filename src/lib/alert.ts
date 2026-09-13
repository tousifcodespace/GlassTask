import { useAlertStore } from "@/store/alert";
import type { AlertType } from "@/store/alert";

/**
 * Shows a themed in-app alert (see src/components/themed-alert.tsx) instead
 * of the OS/browser's native alert. This replaced native Alert.alert /
 * window.alert for two reasons: (1) react-native-web doesn't reliably
 * implement Alert.alert — on many setups it silently no-ops, and (2) native
 * alerts can't be styled, so they always looked like generic system popups
 * that didn't match the app's dark/light theme.
 */
export function showAlert(
  title: string,
  message?: string,
  type: AlertType = "info",
): void {
  useAlertStore.getState().show(title, message, type);
}