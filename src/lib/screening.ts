export type Step = "persiapan" | "kamera" | "pemeriksaan" | "analisis" | "hasil";

/** Label indikator (4 langkah). "analisis" ikut di bawah "Pemeriksaan". */
export const STEP_LABELS = ["Persiapan", "Ambil Foto", "Pemeriksaan", "Hasil"] as const;

const INDEX: Record<Step, number> = {
  persiapan: 0,
  kamera: 1,
  pemeriksaan: 2,
  analisis: 2,
  hasil: 3,
};

export const stepIndex = (s: Step) => INDEX[s];

/* ---------- Page 2: kamera ---------- */

/** Kode alasan cek frame. Samakan dengan kode dari backend setelah endpoint tersedia. */
export type FrameReason =
  | "tidak_ada_wajah"
  | "menoleh"
  | "dongak"
  | "miring"
  | "mulut_terbuka"
  | "senyum"
  | "buram"
  | "cahaya";

export type FrameCheck = { faceFound: boolean; ok: boolean; reasons: FrameReason[] };
export type LiveState = "searching" | "adjust" | "ready";

/** Foto hanya hidup di memori browser (tidak disimpan). */
export type CapturedPhoto = { blob: Blob; url: string; mirrored: boolean };

export const REASON_PRIORITY: FrameReason[] = [
  "tidak_ada_wajah",
  "menoleh",
  "dongak",
  "miring",
  "mulut_terbuka",
  "senyum",
  "buram",
  "cahaya",
];

export const REASON_MESSAGES: Record<FrameReason, string> = {
  tidak_ada_wajah: "Wajah belum terlihat. Posisikan wajah di dalam oval.",
  menoleh: "Wajah menoleh. Hadapkan wajah lurus ke kamera.",
  dongak: "Kepala terlalu mendongak atau menunduk. Pegang kamera setinggi mata.",
  miring: "Kepala atau ponsel miring. Tegakkan kepala dan ponsel.",
  mulut_terbuka: "Mulut terbuka. Katupkan bibir dengan rileks.",
  senyum: "Terlihat tersenyum. Gunakan ekspresi netral.",
  buram: "Gambar buram. Tahan kamera dengan stabil.",
  cahaya: "Cahaya kurang merata. Hadapkan wajah ke sumber cahaya.",
};