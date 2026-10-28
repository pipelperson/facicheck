import { Fragment, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, revealLines } from "@/lib/motion";
import { CtaButton } from "./Navbar";

const FLOW = ["Ambil foto", "Cek kualitas otomatis", "Lihat hasil awal"];

export function FinalCta() {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (title.current) revealLines(title.current);

        gsap.from("[data-cta]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 65%", once: true },
        });

        // alur: titik menyala berurutan, denyut berjalan di garis penghubung
        const dots = gsap.utils.toArray<HTMLElement>("[data-flow-dot]", el);
        const pulses = gsap.utils.toArray<HTMLElement>("[data-flow-pulse]", el);
        gsap.set(pulses, { autoAlpha: 1, xPercent: -100 });
        const tl = gsap.timeline({
          repeat: -1,
          repeatDelay: 1.2,
          scrollTrigger: {
            trigger: el,
            start: "top 60%",
            end: "bottom top",
            toggleActions: "play pause resume pause",
          },
        });
        dots.forEach((dot, i) => {
          tl.to(dot, { opacity: 1, scale: 1.4, duration: 0.35, ease: "power2.out" });
          const pulse = pulses[i];
          if (pulse)
            tl.fromTo(pulse, { xPercent: -100 }, { xPercent: 250, duration: 0.8, ease: "power1.inOut" }, "<+0.1");
        });
        tl.to(dots, { opacity: 0.3, scale: 1, duration: 0.6 }, "+=0.8");
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="mulai"
      aria-labelledby="mulai-title"
      className="relative px-5 pt-20 pb-24 text-center lg:pt-28 lg:pb-32"
    >
      <div className="relative z-10 mx-auto max-w-3xl">
        <h2
          id="mulai-title"
          ref={title}
          className="font-display text-4xl leading-[1.05] tracking-[-0.035em] text-balance text-navy sm:text-5xl lg:text-6xl"
        >
          Siap melihat lebih dekat?
        </h2>
        <p data-cta className="mt-5 text-lg text-olive">
          Mulai dengan satu langkah sederhana.
        </p>
        <div data-cta className="mt-9">
          <CtaButton className="px-8 py-4 text-base">
            Mulai Skrining <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </CtaButton>
        </div>

        <ol
          data-cta
          aria-label="Tiga langkah skrining"
          className="mx-auto mt-10 flex flex-col items-center gap-2 text-sm font-medium text-navy sm:flex-row sm:justify-center sm:gap-4"
        >
          {FLOW.map((label, i) => (
            <Fragment key={label}>
              <li className="flex items-center gap-2">
                <span data-flow-dot aria-hidden="true" className="h-2 w-2 rounded-full bg-burgundy opacity-30" />
                {label}
              </li>
              {i < FLOW.length - 1 && (
                <span aria-hidden="true" className="relative hidden h-px w-12 overflow-hidden bg-navy/20 sm:block">
                  <span data-flow-pulse className="absolute inset-y-0 left-0 w-1/2 bg-burgundy opacity-0" />
                </span>
              )}
            </Fragment>
          ))}
        </ol>
        <p data-cta className="mx-auto mt-5 max-w-xl text-sm leading-relaxed font-medium text-navy">
          Siapkan wajah menghadap lurus, ekspresi netral, mulut tertutup, dan cahaya yang cukup.
        </p>
      </div>
    </section>
  );
}