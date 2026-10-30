import type { PredictOutcome, RiskCode } from "./screening";

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

export function parsePredict(json: unknown): PredictOutcome {
  if (!isRecord(json)) throw new PredictError("Balasan server tidak dikenali.", "server");

  const result = json["result"];
  if (json["ok"] === true && isRecord(result)) {
    const metrics: Record<string, unknown> = isRecord(result["asymmetry_metrics"]) ? result["asymmetry_metrics"] : {};
    const probability = num(result["probability"]);
    const label = result["label"];
    return {
      kind: "success",
      code: zoneFrom(result["code"], probability),
      label: typeof label === "string" ? label : null,
      probability,
      metrics: {
        brow_asymmetry: num(metrics["brow_asymmetry"]),
        eye_asymmetry: num(metrics["eye_asymmetry"]),
        mouth_tilt: num(metrics["mouth_tilt"]),
      },
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
    return parsePredict(await res.json());
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