import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion";

const SIGNS = ["Kelemahan anggota tubuh", "Gangguan bicara", "Gejala neurologis lainnya"];

export function Notice() {
  const root = useRef<HTMLElement>(null);
  const scan = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const el = scan.current;
        if (!el) return;
        const line = el.querySelector("[data-scan-line]");
        gsap.set(el, { "--p": 0 });
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 75%", once: true } })
          .set(line, { autoAlpha: 1 })
          .to(el, { "--p": 1, duration: 1.3, ease: "power2.inOut" })
          .to(line, { autoAlpha: 0, duration: 0.4, ease: "power1.out" }, "-=0.15");
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="catatan"
      aria-labelledby="disclaimer-title"
      className="relative px-5 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div ref={scan} className="relative">
          {/* garis scan */}
          <div
            aria-hidden="true"
            data-scan-line
            className="pointer-events-none absolute inset-x-0 z-10 opacity-0"
            style={{ top: "calc(var(--p, 1) * 100%)" }}
          >
            <span
              className="absolute inset-x-0 bottom-0 h-10"
              style={{ background: "linear-gradient(to top, color-mix(in oklab, var(--rose) 28%, transparent), transparent)" }}
            />
            <span className="block h-px w-full bg-rose" />
            <span className="absolute top-0 left-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-burgundy" />
            <span className="absolute top-0 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-burgundy" />
          </div>

          {/* konten: tersingkap mengikuti garis scan */}
          <div
            style={{ clipPath: "inset(0 0 calc((1 - var(--p, 1)) * 100%) 0)" }}
            className="border-t border-navy/10 pt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16 lg:pt-14"
          >
            <div>
              <p className="text-sm font-semibold tracking-[0.14em] text-burgundy">CATATAN</p>
              <h2
                id="disclaimer-title"
                className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.035em] text-balance text-navy sm:text-5xl lg:text-[clamp(2.25rem,3.8vw,3.5rem)]"
              >
                Satu hal yang perlu diingat.
              </h2>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-xl leading-snug font-medium tracking-[-0.01em] text-navy sm:text-2xl">
                FaciCheck merupakan prototipe untuk skrining awal,{" "}
                <span className="text-burgundy">bukan alat untuk mendiagnosis kondisi medis.</span>
              </p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-olive sm:text-lg">
                Hasil “tidak ada indikasi” juga bukan jaminan Anda sehat. Sistem ini masih bisa
                melewatkan sebagian kasus, jadi tetap perhatikan perubahan pada wajah Anda.
              </p>

              <div className="mt-8 border-t border-navy/10 pt-6">
                <p className="text-base text-olive sm:text-lg">
                  Jika wajah Anda berubah secara mendadak, terutama disertai:
                </p>
                <ul className="mt-3 flex flex-col divide-y divide-navy/10 sm:flex-row sm:divide-x sm:divide-y-0">
                  {SIGNS.map((s) => (
                    <li key={s} className="py-2 text-base font-medium text-navy sm:px-5 sm:py-1 sm:first:pl-0">
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-base font-semibold text-navy sm:text-lg">
                  Segera cari pertolongan medis darurat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}