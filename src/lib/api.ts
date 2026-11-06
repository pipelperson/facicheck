import type { Landmarks, PredictOutcome, Pt, RiskCode } from "./screening";

const FALLBACK_URL = "https://facicheck-backend.onrender.com";

const envUrl = import.meta.env["VITE_BACKEND_URL"] as string | undefined;

export const BACKEND_URL = (envUrl || FALLBACK_URL).replace(/\/+$/, "");

export class PredictError extends Error {
  kind: "network" | "timeout" | "server";
  constructor(message: string, kind: PredictError["kind"]) {
    super(message);
    this.name = "PredictError";
    this.kind = kind;
  }
}

const TIMEOUT_MS = 75_000; // server gratis bisa butuh ±1 menit untuk bangun

/** Membangunkan server lebih awal (hosting gratis tidur saat sepi). Aman dipanggil kapan saja. */
export function warmUpBackend() {
  if (typeof window === "undefined") return;
  fetch(`${BACKEND_URL}/`, { mode: "no-cors" }).catch(() => undefined);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Zona diputuskan backend lewat `code`. Cadangan: hitung dari probabilitas (persen) dengan batas 35/65. */
function zoneFrom(code: unknown, probability: number | null): RiskCode {
  if (typeof code === "string") {
    const c = code.trim().toUpperCase();
    if (c === "NORMAL" || c === "MODERATE_RISK" || c === "HIGH_RISK") return c;
  }
  if (probability !== null) return probability > 65 ? "HIGH_RISK" : probability < 35 ? "NORMAL" : "MODERATE_RISK";
  return "MODERATE_RISK";
}

function toPoint(p: unknown): Pt | null {
  let x: unknown;
  let y: unknown;
  if (Array.isArray(p)) [x, y] = p;
  else if (isRecord(p)) [x, y] = [p["x"], p["y"]];
  const nx = num(x);
  const ny = num(y);
  if (nx === null || ny === null || nx < -0.1 || nx > 1.1 || ny < -0.1 || ny > 1.1) return null;
  return [nx, ny];
}

/** Kumpulkan semua titik yang ada di dalam nilai bersarang (array atau objek). */
function pointsIn(v: unknown, depth = 0): Pt[] {
  const direct = toPoint(v);
  if (direct) return [direct];
  if (depth > 4) return [];
  if (Array.isArray(v)) return v.flatMap((x) => pointsIn(x, depth + 1));
  if (isRecord(v)) return Object.values(v).flatMap((x) => pointsIn(x, depth + 1));
  return [];
}

const mean = (pts: Pt[]): Pt => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length,
];

/** Satu titik wakil untuk satu sisi: titik langsung, atau rata-rata titik pada kunci yang diutamakan. */
function anchor(v: unknown, prefer: string[]): Pt | null {
  const direct = toPoint(v);
  if (direct) return direct;
  if (isRecord(v)) {
    for (const k of prefer) {
      const pts = pointsIn(v[k]);
      if (pts.length > 0) return mean(pts);
    }
    for (const [k, val] of Object.entries(v)) {
      if (k === "iris" || k === "lid_pairs") continue;
      const pts = pointsIn(val);
      if (pts.length > 0) return mean(pts);
    }
    const lids = pointsIn(v["lid_pairs"]);
    return lids.length > 0 ? mean(lids) : null;
  }
  const pts = pointsIn(v);
  return pts.length > 0 ? mean(pts) : null;
}

/** Pasangan titik kelopak: [[atas, bawah], ...] */
function pairsOf(v: unknown): [Pt, Pt][] {
  if (!Array.isArray(v)) return [];
  const out: [Pt, Pt][] = [];
  for (const item of v) {
    const pts = pointsIn(item);
    const a = pts[0];
    const b = pts[1];
    if (a && b) out.push([a, b]);
  }
  return out;
}

/** Bentuk baru: { brow: {left, right}, eye: {left, right}, mouth: {left, right} } */
function parseNested(v: Record<string, unknown>): Landmarks | null {
  const brow = v["brow"];
  const eye = v["eye"];
  const mouth = v["mouth"];
  if (!isRecord(brow) || !isRecord(eye) || !isRecord(mouth)) return null;
  const bl = anchor(brow["left"], ["brow", "point", "center"]);
  const br = anchor(brow["right"], ["brow", "point", "center"]);
  const el = anchor(eye["left"], ["eye", "center", "point"]);
  const er = anchor(eye["right"], ["eye", "center", "point"]);
  const ml = anchor(mouth["left"], ["corner", "point", "mouth", "center"]);
  const mr = anchor(mouth["right"], ["corner", "point", "mouth", "center"]);
  if (!bl || !br || !el || !er || !ml || !mr) return null;
  const lids = (side: unknown) => (isRecord(side) ? pairsOf(side["lid_pairs"]) : []);
  return {
    brow: { left: bl, right: br },
    eye: { left: el, right: er, leftLids: lids(eye["left"]), rightLids: lids(eye["right"]) },
    mouth: { left: ml, right: mr },
  };
}

/** Bentuk lama: { brow_left: [x, y], ... } */
function parseFlat(v: Record<string, unknown>): Landmarks | null {
  const bl = toPoint(v["brow_left"]);
  const br = toPoint(v["brow_right"]);
  const el = toPoint(v["eye_left"]);
  const er = toPoint(v["eye_right"]);
  const ml = toPoint(v["mouth_left"]);
  const mr = toPoint(v["mouth_right"]);
  if (!bl || !br || !el || !er || !ml || !mr) return null;
  return {
    brow: { left: bl, right: br },
    eye: { left: el, right: er, leftLids: [], rightLids: [] },
    mouth: { left: ml, right: mr },
  };
}

function parseLandmarks(v: unknown): Landmarks | null {
  if (!isRecord(v)) return null;
  return parseNested(v) ?? parseFlat(v);
}

export function parsePredict(json: unknown): PredictOutcome {
  if (!isRecord(json)) throw new PredictError("Balasan server tidak dikenali.", "server");

  const result = json["result"];
  if (json["ok"] === true && isRecord(result)) {
    const metrics: Record<string, unknown> = isRecord(result["asymmetry_metrics"]) ? result["asymmetry_metrics"] : {};
    const probability = num(result["probability"]);
    const label = result["label"];
    const landmarks = parseLandmarks(result["landmarks"]) ?? parseLandmarks(json["landmarks"]);
    const rawMarks = result["landmarks"] ?? json["landmarks"];
    if (!landmarks && rawMarks !== undefined) console.warn("Format landmarks belum dikenali:", rawMarks);
    return {
      kind: "success",
      code: zoneFrom(result["code"], probability),
      label: typeof label === "string" ? label : null,
      probability,
      metrics: {
        brow_asymmetry: num(metrics["brow_asymmetry"]),
        eye_asymmetry: num(metrics["eye_asymmetry"]),
        mouth_tilt: num(metrics["mouth_tilt"]),
        mouth_tilt_signed: num(metrics["mouth_tilt_signed"]) ?? num(result["mouth_tilt_signed"]),
      },
      landmarks,
    };
  }

  if (json["ok"] === false) {
    const violations = strings(json["violations"]);
    const messages = strings(json["messages"]);
    if (violations.length > 0 || messages.length > 0 || json["status"] === "DITOLAK") {
      return { kind: "rejected", violations, messages };
    }
    const message = json["message"];
    if (typeof message === "string") return { kind: "invalid", message };
    return { kind: "rejected", violations: [], messages: [] };
  }

  throw new PredictError("Balasan server tidak dikenali.", "server");
}

/** Kirim foto ke backend (gerbang kualitas + prediksi dalam satu panggilan). */
export async function predictPhoto(blob: Blob, signal?: AbortSignal): Promise<PredictOutcome> {
  const formData = new FormData();
  formData.append("file", blob, "wajah_user.jpg"); // nama field "file" sesuai backend

  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(`${BACKEND_URL}/api/predict`, { method: "POST", body: formData, signal: timeout.signal });
    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        /* abaikan */
      }
      if (isRecord(body) && body["ok"] === false) return parsePredict(body);
      const detail = isRecord(body) && typeof body["detail"] === "string" ? body["detail"] : "";
      throw new PredictError(detail || `Server membalas dengan kode ${res.status}.`, "server");
    }
    const json = await res.json();
    console.log("Balasan dari Backend:", json);
    return parsePredict(json);

  } catch (e) {
    if (e instanceof PredictError) throw e;
    if (signal?.aborted) throw e; // dibatalkan oleh pemanggil
    if (timeout.signal.aborted) throw new PredictError("Server terlalu lama menjawab. Coba lagi sebentar.", "timeout");
    throw new PredictError("Tidak dapat terhubung ke server analisis.", "network");
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}