import { useRef } from "react";
import { ShieldAlert } from "lucide-react";
import { gsap, useGSAP, SplitText, revealLines } from "@/lib/motion";
import { Reveal } from "./Reveal";

export function Notice() {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const statement = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (title.current) revealLines(title.current);
        if (statement.current) {
          SplitText.create(statement.current, {
            type: "words",
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.words,
                { opacity: 0.16 },
                {
                  opacity: 1,
                  ease: "none",
                  stagger: 0.12,
                  duration: 0.6,
                  scrollTrigger: { trigger: statement.current, start: "top 82%", end: "bottom 50%", scrub: true },
                },
              ),
          });
        }
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="catatan" aria-labelledby="disclaimer-title" className="px-5 py-24 lg:py-32">
      <Reveal className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-rose/40 bg-card p-8 sm:p-12 lg:p-16">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-burgundy">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold tracking-[0.18em] text-burgundy">CATATAN PENTING</p>
          </div>

          <h2 id="disclaimer-title" ref={title} className="mt-8 font-display text-4xl tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Satu hal yang perlu <em className="text-burgundy">diingat.</em>
          </h2>

          <p ref={statement} className="mt-6 max-w-3xl text-xl leading-snug font-medium text-navy sm:text-2xl lg:text-3xl">
            FaciCheck merupakan prototipe untuk skrining awal,{" "}
            <span className="text-burgundy">bukan alat untuk mendiagnosis kondisi medis.</span>
          </p>

          <p className="mt-8 max-w-2xl border-t border-border pt-6 text-base leading-relaxed text-olive sm:text-lg">
            Jika Anda mengalami perubahan wajah secara tiba-tiba atau gejala lain yang mengkhawatirkan, segera cari bantuan medis profesional.
          </p>
        </div>
      </Reveal>
    </section>
  );
}