import type { FrameCheck, FrameReason } from "./screening";

/** "local": deteksi wajah di browser (panduan awal). "simulation": data semu untuk uji tampilan. "off": tanpa penilaian langsung. */
export const LIVE_CHECK_MODE = "local" as "off" | "simulation" | "local";
export const USE_SIMULATION = LIVE_CHECK_MODE === "simulation";


export type SimMode = "auto" | "ok" | FrameReason;

let simMode: SimMode = "auto";
let simStart = 0;

export function setSimMode(mode: SimMode) {
  simMode = mode;
}

export function restartSimulation() {
  simMode = "auto";
  simStart = performance.now();
}

const NO_FACE: FrameCheck = { faceFound: false, ok: false, reasons: ["tidak_ada_wajah"] };
const OK: FrameCheck = { faceFound: true, ok: true, reasons: [] };
const bad = (r: FrameReason): FrameCheck => ({ faceFound: true, ok: false, reasons: [r] });

async function simulate(): Promise<FrameCheck> {
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 120)); // latensi semu
  const mode = simMode;
  if (mode === "tidak_ada_wajah") return NO_FACE;
  if (mode === "ok") return OK;
  if (mode !== "auto") return bad(mode);

  // skenario otomatis: tidak ada wajah, menoleh, senyum, miring, lalu pas
  const t = (performance.now() - simStart) / 1000;
  if (t < 1.5) return NO_FACE;
  if (t < 4) return bad("menoleh");
  if (t < 6) return bad("senyum");
  if (t < 7.5) return bad("miring");
  return Math.random() < 0.08 ? bad("buram") : OK; // sesekali "glitch" untuk menguji kestabilan
}

export async function checkFrame(_frame: Blob | null): Promise<FrameCheck> {
  if (USE_SIMULATION) return simulate();
  // TODO(backend): kirim _frame (JPEG) ke endpoint cek frame, lalu petakan responsnya ke FrameCheck.
  throw new Error("Endpoint cek frame belum diisi");
}