import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock, Meh, ScanFace, Smartphone, Sun, Users, type LucideIcon } from "lucide-react";
import { gsap, useGSAP } from "@/lib/motion";
import { PoseExamples } from "./PoseExamples";
import { warmUpBackend } from "@/lib/api";

const TIPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ScanFace, title: "Hadapkan wajah lurus", text: "Menghadap kamera, tidak menoleh, mendongak, atau menunduk." },
  { icon: Meh, title: "Ekspresi netral", text: "Katupkan bibir dengan rileks. Jangan tersenyum atau membuka mulut." },
  { icon: Sun, title: "Cahaya cukup dan merata", text: "Hadapkan wajah ke sumber cahaya. Lepas masker atau topi, dan singkirkan rambut dari wajah." },
  { icon: Smartphone, title: "Setinggi mata, sejarak lengan", text: "Pegang kamera lurus di depan wajah dan tahan dengan stabil agar foto tidak buram." },
];

export function PrepareStep({ onStart }: { onStart: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    warmUpBackend();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-in]",
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: 0.07, delay: 0.1 },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-in]", { autoAlpha: 1 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:grid-rows-[auto_1fr]">
      {/* Judul */}
      <div>
        <h1
          data-in
          className="font-display text-3xl leading-[1.08] tracking-[-0.03em] text-balance text-navy opacity-0 sm:text-4xl lg:text-5xl"
        >
          Siapkan diri Anda sebelum mulai.
        </h1>
        <p data-in className="mt-4 max-w-xl text-base leading-relaxed text-olive opacity-0 sm:text-lg">
          Foto yang baik membuat hasil skrining lebih bermakna. Luangkan satu menit untuk memeriksa empat hal ini.
        </p>
      </div>

      {/* Contoh posisi (mobile: setelah judul, desktop: kolom kanan) */}
      <div data-in className="opacity-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-2">
        <PoseExamples />
      </div>

      {/* Tips + persetujuan */}
      <div className="lg:col-start-1 lg:row-start-2">
        <ol className="divide-y divide-navy/10 border-y border-navy/10">
          {TIPS.map(({ icon: Icon, title, text }) => (
            <li key={title} data-in className="flex gap-4 py-4 opacity-0">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-burgundy">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-semibold text-navy sm:text-lg">{title}</p>
                <p className="mt-0.5 text-base leading-relaxed text-olive">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <p data-in className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-olive opacity-0">
          <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Dibantu keluarga? Minta mereka memegang kamera setinggi mata Anda.
        </p>

        <label data-in className="mt-8 flex cursor-pointer items-start gap-3 py-1 text-base text-navy opacity-0">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-burgundy"
          />
          <span>Saya memahami ini prototipe skrining awal, bukan diagnosis medis.</span>
        </label>

        <div data-in className="mt-6 flex flex-wrap items-center gap-4 opacity-0">
          <button
            type="button"
            disabled={!agreed}
            onClick={onStart}
            aria-describedby={agreed ? undefined : "agree-hint"}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-cta transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 enabled:active:translate-y-0 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            Mulai Kamera <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
          {!agreed && (
            <p id="agree-hint" className="text-sm text-olive">
              Centang pernyataan di atas untuk melanjutkan.
            </p>
          )}
        </div>

        <p data-in className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-olive opacity-0">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Foto diambil langsung dari kamera dan hanya dipakai untuk analisis ini. Foto tidak disimpan. Browser akan
          meminta izin kamera saat Anda menekan tombol.
        </p>
      </div>
    </div>
  );
}