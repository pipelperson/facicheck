import { REASON_MESSAGES, type FrameReason, type LiveState } from "./screening";

export type GuideKey = "none" | "loading" | "ok" | FrameReason;

export const REASON_SHORT: Record<FrameReason, string> = {
  tidak_ada_wajah: "Wajah belum terlihat",
  banyak_wajah: "Hanya satu wajah",
  tidak_di_tengah: "Geser ke tengah",
  terlalu_jauh: "Dekatkan kamera",
  terlalu_dekat: "Jauhkan kamera",
  menoleh: "Hadap lurus",
  dongak: "Pegang kamera setinggi mata",
  miring: "Tegakkan kepala",
  mulut_terbuka: "Tutup mulut",
  senyum: "Jangan tersenyum",
  buram: "Tahan kamera stabil",
  cahaya: "Cari cahaya lebih terang",
};

export function guideState(key: GuideKey): LiveState {
  if (key === "ok") return "ready";
  if (key === "none" || key === "loading" || key === "tidak_ada_wajah") return "searching";
  return "adjust";
}

export function guideShort(key: GuideKey): string {
  if (key === "none") return "";
  if (key === "ok") return "Posisi pas";
  if (key === "loading") return "Menyiapkan panduan…";
  return REASON_SHORT[key];
}

export function guideFull(key: GuideKey): string {
  if (key === "none") return "";
  if (key === "ok") return "Posisi pas. Tahan sebentar, lalu tekan tombol foto.";
  if (key === "loading") return "Menyiapkan panduan posisi…";
  return REASON_MESSAGES[key];
}