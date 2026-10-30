export type Step = "persiapan" | "kamera" | "pemeriksaan" | "analisis" | "hasil";

/** Label indikator (4 langkah). "analisis" dan "pemeriksaan" (foto ditolak) berada di langkah 3. */
export const STEP_LABELS = ["Persiapan", "Ambil Foto", "Pemeriksaan", "Hasil"] as const;

const INDEX: Record<Step, number> = {
  persiapan: 0,
  kamera: 1,
  pemeriksaan: 2,
  analisis: 2,
  hasil: 3,
};

export const stepIndex = (s: Step) => INDEX[s];

/* ---------- Kamera ---------- */

/** Kode alasan cek frame langsung (dipakai mode simulasi). */
export type FrameReason =
  | "tidak_ada_wajah"
  | "banyak_wajah"
  | "tidak_di_tengah"
  | "terlalu_jauh"
  | "terlalu_dekat"
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
  "banyak_wajah",
  "tidak_di_tengah",
  "terlalu_jauh",
  "terlalu_dekat",
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
  banyak_wajah: "Terdapat lebih dari satu wajah di frame. Fokus ke satu wajah saja.",
  tidak_di_tengah: "Wajah terlalu jauh dari tengah oval. Pusatkan wajah Anda.",
  terlalu_jauh: "Wajah terlalu jauh dari kamera. Dekatkan wajah ke kamera.",
  terlalu_dekat: "Wajah terlalu dekat dengan kamera. Jarakkan sedikit agar lebih proporsional.",
  menoleh: "Wajah menoleh. Hadapkan wajah lurus ke kamera.",
  dongak: "Kepala terlalu mendongak atau menunduk. Pegang kamera setinggi mata.",
  miring: "Kepala atau ponsel miring. Tegakkan kepala dan ponsel.",
  mulut_terbuka: "Mulut terbuka. Katupkan bibir dengan rileks.",
  senyum: "Terlihat tersenyum. Gunakan ekspresi netral.",
  buram: "Gambar buram. Tahan kamera dengan stabil.",
  cahaya: "Cahaya kurang merata. Hadapkan wajah ke sumber cahaya.",
};

/* ---------- Hasil dari backend (/api/predict) ---------- */

export type RiskCode = "NORMAL" | "MODERATE_RISK" | "HIGH_RISK";

export type PredictOutcome =
  | {
      kind: "success";
      code: RiskCode;
      label: string | null;
      /** dalam persen, mis. 78.5 berarti 78,5% */
      probability: number | null;
      metrics: { brow_asymmetry: number | null; eye_asymmetry: number | null; mouth_tilt: number | null };
    }
  | { kind: "rejected"; violations: string[]; messages: string[] }
  | { kind: "invalid"; message: string };

export type SuccessOutcome = Extract<PredictOutcome, { kind: "success" }>;
export type RejectedOutcome = Exclude<PredictOutcome, SuccessOutcome>;

export const ZONE_LABELS = ["Tidak terlihat indikasi", "Belum pasti", "Ada indikasi"] as const;

export const ZONES: Record<RiskCode, { index: number; title: string; text: string }> = {
  NORMAL: {
    index: 0,
    title: "Tidak terlihat indikasi asimetri.",
    text: "Tidak terlihat indikasi asimetri pada foto ini. Hasil ini bukan jaminan Anda sehat, karena sistem masih bisa melewatkan sebagian kasus. Bila Anda merasakan perubahan pada wajah, tetap periksakan ke tenaga kesehatan.",
  },
  MODERATE_RISK: {
    index: 1,
    title: "Hasil belum pasti.",
    text: "Sistem belum dapat menyimpulkan. Coba ambil foto ulang dengan kondisi yang lebih baik, atau konsultasikan ke tenaga kesehatan bila Anda khawatir.",
  },
  HIGH_RISK: {
    index: 2,
    title: "Terdapat indikasi asimetri.",
    text: "Foto Anda menunjukkan pola yang mirip dengan asimetri wajah yang dikaitkan dengan Bell’s palsy. Ini bukan diagnosis. Sebaiknya konsultasikan ke dokter, terutama bila perubahan muncul mendadak.",
  },
};

/** Dari evaluasi notebook v4. Perbarui bila model diganti. */
export const MODEL_STATS = [
  { label: "Akurasi", value: "±79%", note: "Dari 100 foto, sekitar 79 ditebak benar (rentang aman 76–82%)." },
  { label: "ROC-AUC", value: "0,85", note: "Kemampuan membedakan dua kelompok; 1,0 berarti sempurna." },
  { label: "Sensitivity", value: "68,7%", note: "Dari 100 pasien Bell’s palsy, sekitar 69 terdeteksi dan sekitar 31 terlewat." },
  { label: "Specificity", value: "86,4%", note: "Dari 100 orang sehat, sekitar 86 dinilai normal." },
] as const;