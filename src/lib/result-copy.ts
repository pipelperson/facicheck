import type { RiskCode, SuccessOutcome } from "./screening";

export const ZONE_LABELS = ["Tampak seimbang", "Belum pasti", "Tampak berbeda"] as const;

/** Warna lampu: nada senada palet merek. Ganti di sini bila ingin hijau/merah sungguhan. */
export const LAMP_COLORS = ["var(--sage)", "var(--rose)", "var(--burgundy)"] as const;

export const ZONES: Record<RiskCode, { index: number; title: string; text: string }> = {
  NORMAL: {
    index: 0,
    title: "Tidak terlihat tanda ketidakseimbangan wajah.",
    text: "Pada foto ini, sisi kiri dan kanan wajah Anda tampak seimbang. Namun hasil ini bukan jaminan Anda sehat, karena sistem masih bisa melewatkan sebagian kasus. Bila Anda merasakan perubahan pada wajah, tetap periksakan diri ke tenaga kesehatan.",
  },
  MODERATE_RISK: {
    index: 1,
    title: "Hasil belum bisa dipastikan.",
    text: "Sistem belum dapat menyimpulkan dari foto ini. Cobalah mengambil foto ulang dengan posisi dan cahaya yang lebih baik, atau konsultasikan ke tenaga kesehatan bila Anda khawatir.",
  },
  HIGH_RISK: {
    index: 2,
    title: "Terlihat tanda ketidakseimbangan wajah.",
    text: "Pada foto ini, sisi kiri dan kanan wajah Anda tampak berbeda, dengan pola yang mirip dengan yang dikaitkan dengan Bell’s palsy. Ini bukan diagnosis. Sebaiknya segera konsultasikan ke dokter, terutama bila perubahan muncul mendadak.",
  },
};

export type MetricKey = "brow_asymmetry" | "eye_asymmetry" | "mouth_tilt";

export const AREAS: { key: MetricKey; name: string; what: string }[] = [
  { key: "brow_asymmetry", name: "Alis", what: "Perbedaan posisi alis kiri dan kanan" },
  { key: "eye_asymmetry", name: "Mata", what: "Perbedaan mata kiri dan kanan" },
  { key: "mouth_tilt", name: "Mulut", what: "Kemiringan sudut mulut" },
];

/**
 * Batas acuan dari foto WAJAH SEHAT di data penelitian (setelah lolos pemeriksaan kualitas):
 *   wajar  = persentil ke-90 (di bawah ini tergolong seimbang)
 *   tinggi = persentil ke-97 (di atas ini lebih besar dari hampir semua wajah sehat)
 * Selama kosong, penilaian per bagian tidak ditampilkan (hanya kalimat umum).
 */
export const REFERENCE: Partial<Record<MetricKey, { wajar: number; tinggi: number }>> = {
  // brow_asymmetry: { wajar: 0.0, tinggi: 0.0 },
  // eye_asymmetry: { wajar: 0.0, tinggi: 0.0 },
  // mouth_tilt: { wajar: 0.0, tinggi: 0.0 },
};

export const LEVEL_TEXT = ["Masih seimbang", "Sedikit berbeda", "Jelas berbeda"] as const;

export type AreaReading = { key: MetricKey; name: string; what: string; level: 0 | 1 | 2 };

export function readAreas(metrics: SuccessOutcome["metrics"]): AreaReading[] {
  const rows: AreaReading[] = [];
  for (const a of AREAS) {
    const ref = REFERENCE[a.key];
    const raw = metrics[a.key];
    if (!ref || raw === null) continue;
    const v = Math.abs(raw);
    rows.push({ ...a, level: v >= ref.tinggi ? 2 : v >= ref.wajar ? 1 : 0 });
  }
  return rows;
}

/** "alis", "alis dan mata", "alis, mata, dan mulut" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} dan ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, dan ${names[names.length - 1]}`;
}

/** Kalimat ringkas "bagian mana yang menonjol", sesuai zona hasil. */
export function summarizeAreas(code: RiskCode, rows: AreaReading[]): string | null {
  if (rows.length === 0) return null;
  const clear = rows.filter((r) => r.level === 2).map((r) => r.name.toLowerCase());
  const slight = rows.filter((r) => r.level === 1).map((r) => r.name.toLowerCase());
  if (clear.length > 0) return `Perbedaan paling jelas terlihat pada ${joinNames(clear)}.`;
  if (slight.length > 0) return `Ada sedikit perbedaan pada ${joinNames(slight)}.`;
  return code === "NORMAL"
    ? "Ketiga bagian ini tampak seimbang."
    : "Tidak ada satu bagian yang menonjol. Sistem menilai dari gabungan beberapa ukuran.";
}

/** Dari evaluasi pada data uji. Perbarui bila model diganti. */
export const RELIABILITY = [
  "Dalam pengujian, sistem menilai dengan benar sekitar 79 dari 100 foto.",
  "Dari 100 orang yang benar-benar mengalami Bell’s palsy, sistem mengenali sekitar 69 dan melewatkan sekitar 31.",
  "Dari 100 orang yang sehat, sekitar 86 dinilai normal dan sekitar 14 dikira menunjukkan tanda.",
] as const;