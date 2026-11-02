import type { RiskCode, SuccessOutcome } from "./screening";

export const ZONE_LABELS = ["Tampak seimbang", "Belum cukup jelas", "Terlihat perbedaan"] as const;

export const OUTCOMES: Record<
  RiskCode,
  { index: number; headline: string; lead: string; note: string; advice: string; primary: string }
> = {
  NORMAL: {
    index: 0,
    headline: "Wajah tampak cukup seimbang.",
    lead: "Dari foto yang diperiksa, sisi kiri dan kanan wajah Anda terlihat cukup seimbang.",
    note: "Hasil ini merupakan gambaran awal berdasarkan foto dan bukan diagnosis medis. Hasil ini juga bukan jaminan Anda sehat. Jika Anda tetap merasakan perubahan pada wajah, sebaiknya periksakan diri ke tenaga kesehatan.",
    advice: "Jika tidak ada keluhan, Anda dapat kembali ke beranda atau melakukan skrining ulang dengan foto yang lebih jelas.",
    primary: "Ulangi skrining",
  },
  MODERATE_RISK: {
    index: 1,
    headline: "Hasilnya belum cukup jelas.",
    lead: "Dari foto yang diperiksa, sistem belum dapat memberikan hasil yang cukup jelas mengenai perbedaan antara sisi kiri dan kanan wajah.",
    note: "Hal ini dapat dipengaruhi oleh posisi wajah, pencahayaan, atau kualitas foto. Hasil ini bukan diagnosis medis.",
    advice: "Coba lakukan skrining ulang dengan posisi wajah lurus, pencahayaan yang cukup, dan wajah terlihat jelas. Jika Anda tetap merasakan perubahan pada wajah, sebaiknya periksakan diri ke tenaga kesehatan.",
    primary: "Ambil ulang foto",
  },
  HIGH_RISK: {
    index: 2,
    headline: "Terlihat adanya perbedaan pada wajah.",
    lead: "Dari foto yang diperiksa, terlihat adanya perbedaan antara sisi kiri dan kanan wajah.",
    note: "Hasil ini belum berarti Anda mengalami Bell’s palsy. FaciCheck hanya memberikan gambaran awal berdasarkan foto dan tidak dapat menggantikan pemeriksaan dokter.",
    advice: "Sebaiknya konsultasikan hasil ini ke tenaga kesehatan. Jika perubahan pada wajah baru terjadi atau Anda memiliki keluhan lain, segera periksakan diri.",
    primary: "Ulangi skrining",
  },
};

/** Warna lampu: nada senada palet merek. Ganti di sini bila ingin hijau/merah sungguhan. */
export const LAMP_COLORS = ["var(--sage)", "var(--rose)", "var(--burgundy)"] as const;

export type MetricKey = "brow_asymmetry" | "eye_asymmetry" | "mouth_tilt";

export const AREAS: { key: MetricKey; name: string; what: string }[] = [
  { key: "brow_asymmetry", name: "Alis", what: "Perbedaan posisi alis kiri dan kanan" },
  { key: "eye_asymmetry", name: "Mata", what: "Perbedaan mata kiri dan kanan" },
  { key: "mouth_tilt", name: "Mulut", what: "Kemiringan sudut mulut" },
];

/**
- Batas acuan dari foto WAJAH SEHAT di data penelitian (setelah lolos pemeriksaan kualitas):
-   wajar  = persentil ke-90 (di bawah ini tergolong seimbang)
-   tinggi = persentil ke-97 (di atas ini lebih besar dari hampir semua wajah sehat)
- Selama kosong, penilaian per bagian tidak ditampilkan (hanya kalimat umum).
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