import { useEffect, useState } from "react";
import { PredictError, predictPhoto } from "@/lib/api";
import type { CapturedPhoto, PredictOutcome } from "@/lib/screening";

export function AnalyzeStep({
  photo,
  onOutcome,
  onRetake,
}: {
  photo: CapturedPhoto;
  onOutcome: (outcome: PredictOutcome) => void;
  onRetake: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(null);
    setSlow(false);
    const slowTimer = window.setTimeout(() => setSlow(true), 6000);

    predictPhoto(photo.blob, ctrl.signal)
      .then((outcome) => {
        if (!ctrl.signal.aborted) onOutcome(outcome);
      })
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof PredictError ? e.message : "Terjadi kesalahan tak terduga.");
      })
      .finally(() => window.clearTimeout(slowTimer));

    return () => {
      ctrl.abort();
      window.clearTimeout(slowTimer);
    };
  }, [photo, attempt, onOutcome]);

  return (
    <div className="mx-auto max-w-xl py-4 text-center">
      <div className="relative mx-auto aspect-[3/4] w-48 overflow-hidden rounded-2xl shadow-soft">
        <img
          src={photo.url}
          alt="Foto yang sedang diperiksa"
          className="h-full w-full object-cover"
          style={{ transform: photo.mirrored ? "scaleX(-1)" : undefined }}
        />
        {!error && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 animate-scan">
            <div className="h-8" style={{ background: "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--rose) 45%, transparent))" }} />
            <div className="h-0.5 bg-rose" />
          </div>
        )}
      </div>

      {!error ? (
        <div role="status" aria-live="polite" className="mt-8">
          <h1 className="font-display text-3xl tracking-[-0.03em] text-navy">Memeriksa dan menganalisis foto…</h1>
          <p className="mt-3 text-base leading-relaxed text-olive">
            {slow
              ? "Server sedang bangun dan bisa memakan waktu hingga satu menit pada percobaan pertama. Mohon tunggu."
              : "Biasanya hanya beberapa detik."}
          </p>
        </div>
      ) : (
        <div role="alert" className="mt-8">
          <h1 className="font-display text-3xl tracking-[-0.03em] text-navy">Analisis belum berhasil.</h1>
          <p className="mt-3 text-base leading-relaxed text-olive">{error}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-cta transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Kirim ulang
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="rounded-full border border-navy/20 px-6 py-3 text-base font-semibold text-navy transition hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Ambil ulang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}