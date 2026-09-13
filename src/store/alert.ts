import { create } from "zustand";

export type AlertType = "info" | "success" | "error" | "warning";

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  type: AlertType;
  show: (title: string, message?: string, type?: AlertType) => void;
  hide: () => void;
};

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: undefined,
  type: "info",
  show: (title, message, type = "info") =>
    set({ visible: true, title, message, type }),
  hide: () => set({ visible: false }),
}));
