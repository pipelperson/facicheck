import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Backdrop } from "@/components/landing/Backdrop";
import { ScreeningHeader } from "@/components/screening/ScreeningHeader";
import { StepIndicator } from "@/components/screening/StepIndicator";
import { PrepareStep } from "@/components/screening/PrepareStep";
import { CameraStep } from "@/components/screening/CameraStep";
import { AnalyzeStep } from "@/components/screening/AnalyzeStep";
import { RejectedStep } from "@/components/screening/RejectedStep";
import { ResultStep } from "@/components/screening/ResultStep";
import { STEP_LABELS, stepIndex, type CapturedPhoto, type PredictOutcome, type Step } from "@/lib/screening";

export const Route = createFileRoute("/skrining")({
  head: () => ({
    meta: [
      { title: "Skrining — FaciCheck" },
      { name: "description", content: "Skrining awal perubahan wajah melalui foto langsung dari kamera. Bukan alat diagnosis medis." },
    ],
  }),
  component: ScreeningPage,
});

function ScreeningPage() {
  const [step, setStep] = useState<Step>("persiapan");
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [outcome, setOutcome] = useState<PredictOutcome | null>(null);
  const [rejections, setRejections] = useState(0);
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
    setOutcome(null);
    setStep("analisis");
  }, []);

  const handleOutcome = useCallback((o: PredictOutcome) => {
    setOutcome(o);
    if (o.kind === "success") {
      setRejections(0);
      setStep("hasil");
    } else {
      setRejections((n) => n + 1);
      setStep("pemeriksaan");
    }
  }, []);

  const retake = useCallback(() => {
    setPhoto(null);
    setOutcome(null);
    setStep("kamera");
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
          {step === "analisis" && photo && <AnalyzeStep photo={photo} onOutcome={handleOutcome} onRetake={retake} />}
          {step === "pemeriksaan" && photo && outcome && outcome.kind !== "success" && (
            <RejectedStep photo={photo} outcome={outcome} attempts={rejections} onRetake={retake} />
          )}
          {step === "hasil" && photo && outcome && outcome.kind === "success" && (
            <ResultStep photo={photo} result={outcome} onRetake={retake} />
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