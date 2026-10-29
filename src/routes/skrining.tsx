import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Backdrop } from "@/components/landing/Backdrop";
import { ScreeningHeader } from "@/components/screening/ScreeningHeader";
import { StepIndicator } from "@/components/screening/StepIndicator";
import { PrepareStep } from "@/components/screening/PrepareStep";
import { CameraStep } from "@/components/screening/CameraStep";
import { STEP_LABELS, stepIndex, type CapturedPhoto, type Step } from "@/lib/screening";

export const Route = createFileRoute("/skrining")({
  head: () => ({
    meta: [
      { title: "Skrining — FaciCheck" },
      { name: "description", content: "Skrining awal perubahan wajah melalui foto langsung dari kamera. Bukan alat diagnosis medis." },
    ],
  }),
  component: ScreeningPage,
});

/* Sementara: diganti di page berikutnya (Pemeriksaan, Analisis, Hasil) */
function PlaceholderStep({ photo, onRetake, onBack }: { photo: CapturedPhoto | null; onRetake: () => void; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-sm py-8 text-center">
      {photo && (
        <img
          src={photo.url}
          alt="Foto yang baru diambil"
          className="mx-auto aspect-[3/4] w-56 rounded-2xl object-cover shadow-soft"
          style={{ transform: photo.mirrored ? "scaleX(-1)" : undefined }}
        />
      )}
      <p className="mt-6 font-display text-2xl tracking-[-0.02em] text-navy">
        {photo ? "Foto berhasil diambil." : "Langkah ini sedang disiapkan."}
      </p>
      <p className="mt-2 text-base text-olive">Langkah pemeriksaan sedang dibuat di page berikutnya.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-cta transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Ambil ulang
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-navy/20 px-6 py-3 text-base font-semibold text-navy transition hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Kembali ke persiapan
        </button>
      </div>
    </div>
  );
}

function ScreeningPage() {
  const [step, setStep] = useState<Step>("persiapan");
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const idx = stepIndex(step);

  // foto hanya di memori: lepaskan saat diganti atau halaman ditutup
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );

  // pindahkan fokus ke konten baru saat langkah berganti (pembaca layar & keyboard)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    stepRef.current?.focus({ preventScroll: true });
  }, [step]);

  const handleCaptured = useCallback((p: CapturedPhoto) => {
    setPhoto(p);
    setStep("pemeriksaan");
  }, []);

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-background">
      <Backdrop />
      <ScreeningHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-28 pb-12 lg:pt-32">
        <StepIndicator current={idx} />
        <p className="sr-only" aria-live="polite">
          Langkah {idx + 1} dari {STEP_LABELS.length}: {STEP_LABELS[idx]}
        </p>

        <div
          key={step}
          ref={stepRef}
          tabIndex={-1}
          className="mt-10 animate-in outline-none fade-in slide-in-from-bottom-2 duration-500 lg:mt-14"
        >
          {step === "persiapan" && <PrepareStep onStart={() => setStep("kamera")} />}
          {step === "kamera" && <CameraStep onBack={() => setStep("persiapan")} onCaptured={handleCaptured} />}
          {step !== "persiapan" && step !== "kamera" && (
            <PlaceholderStep
              photo={photo}
              onRetake={() => {
                setPhoto(null);
                setStep("kamera");
              }}
              onBack={() => {
                setPhoto(null);
                setStep("persiapan");
              }}
            />
          )}
        </div>
      </main>

      <footer className="px-6 pb-6 text-center text-xs leading-relaxed font-medium text-navy sm:text-sm">
        Prototipe akademik, bukan alat diagnosis medis. Wajah berubah mendadak, disertai kelemahan anggota
        tubuh atau gangguan bicara? Segera cari pertolongan medis darurat.
      </footer>
    </div>
  );
}