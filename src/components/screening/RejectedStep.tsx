import { Camera } from "lucide-react";
import { PoseExamples } from "./PoseExamples";
import type { CapturedPhoto, RejectedOutcome } from "@/lib/screening";

export function RejectedStep({
  photo,
  outcome,
  attempts,
  onRetake,
}: {
  photo: CapturedPhoto;
  outcome: RejectedOutcome;
  attempts: number;
  onRetake: () => void;
}) {
  const messages = outcome.kind === "invalid" ? [outcome.message] : outcome.messages;
  const list =
    messages.length > 0
      ? messages
      : ["Foto belum memenuhi syarat pemeriksaan kualitas. Coba ambil ulang dengan posisi dan cahaya yang lebih baik."];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:gap-14">
      <div>
        <img
          src={photo.url}
          alt="Foto yang belum sesuai"
          className="mx-auto aspect-[3/4] w-44 rounded-2xl object-cover opacity-90 shadow-soft lg:mx-0"
          style={{ transform: photo.mirrored ? "scaleX(-1)" : undefined }}
        />
      </div>

      <div>
        <h1 className="font-display text-3xl leading-[1.08] tracking-[-0.03em] text-balance text-navy sm:text-4xl lg:text-5xl">
          Foto belum sesuai.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-olive sm:text-lg">
          Ini hal yang wajar. Perbaiki hal berikut, lalu coba sekali lagi.
        </p>

        <ul className="mt-6 divide-y divide-navy/10 border-y border-navy/10">
          {list.map((m) => (
            <li key={m} className="py-3 text-base font-medium text-navy sm:text-lg">
              {m}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onRetake}
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-cta transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Camera className="h-5 w-5" aria-hidden="true" />
          Ambil Ulang
        </button>

        {attempts >= 3 && (
          <div className="mt-10 border-t border-navy/10 pt-8">
            <p className="text-base leading-relaxed text-olive">
              Pemeriksaan kualitas cukup ketat supaya hasilnya lebih dapat dipercaya, jadi wajar bila perlu beberapa kali
              percobaan. Cobalah di tempat yang terang dengan cahaya dari depan, dan minta bantuan keluarga untuk
              memegang kamera setinggi mata Anda.
            </p>
            <div className="mt-6 max-w-md">
              <PoseExamples />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}