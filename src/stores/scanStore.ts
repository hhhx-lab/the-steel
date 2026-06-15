import { create } from "zustand";
import type { ScanResult } from "../types/api";

export type ScanStatus =
  | "idle"
  | "cameraReady"
  | "capturing"
  | "recognizing"
  | "success"
  | "lowConfidence"
  | "failed";

type ScanState = {
  status: ScanStatus;
  lastResult?: ScanResult;
  imagePreview?: string;
  error?: string;
  setStatus: (status: ScanStatus) => void;
  setImagePreview: (imagePreview?: string) => void;
  setResult: (result?: ScanResult | null) => void;
  setError: (error?: string) => void;
  resetScan: () => void;
};

export const useScanStore = create<ScanState>((set) => ({
  status: "idle",
  lastResult: undefined,
  imagePreview: undefined,
  error: undefined,
  setStatus: (status) => set({ status }),
  setImagePreview: (imagePreview) => set({ imagePreview }),
  setResult: (result) =>
    set(result
      ? {
        lastResult: result,
        status: result.confidence < 0.65 ? "lowConfidence" : "success",
        error: undefined
      }
      : {
        lastResult: undefined,
        status: "idle",
        error: undefined
      }),
  setError: (error) => set({ error, status: "failed" }),
  resetScan: () =>
    set({
      status: "idle",
      imagePreview: undefined,
      error: undefined
    })
}));
