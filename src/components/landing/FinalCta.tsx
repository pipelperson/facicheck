import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP, revealLines } from "@/lib/motion";
import { THEMES } from "@/lib/themes";
import { CtaButton } from "./Navbar";

const POINTS: [number, number][] = [
  [118, 172], [160, 160], [240, 160], [282, 172], [128, 208], [176, 208], [224, 208], [272, 208],
  [200, 288], [160, 346], [240, 346], [200, 356], [200, 408], [96, 262], [304, 262], [112, 332], [288, 332],
];

export function FinalCta() {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const mesh = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (title.current) revealLines(title.current);

        // "Lebih dekat": jaring titik wajah membesar mengikuti scroll
        gsap.fromTo(
          mesh.current,
          { scale: 0.6, rotate: -6, transformOrigin: "50% 50%" },
          {
            scale: 1.3,
            rotate: 0,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "center center", scrub: true },
          },
        );

        gsap.from("[data-cta]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="mulai" aria-labelledby="mulai-title" className="px-5 pt-8 pb-24 lg:pb-32">
      <div
        className="relative mx-auto flex min-h-[26rem] max-w-6xl items-center justify-center overflow-hidden rounded-[2rem] px-8 py-20 text-center sm:px-16"
        style={{ background: THEMES.navy.bg }}
      >
        <svg
          ref={mesh}
          viewBox="0 0 400 480"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[34rem] w-auto -translate-x-1/2 -translate-y-1/2 opacity-40"
        >
          <g stroke="var(--rose)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="200" cy="235" rx="132" ry="178" />
            <path d="M200 90V400" strokeDasharray="3 6" opacity=".6" />
            <path d="M118 172L160 160M240 160L282 172" />
            <path d="M128 208H176M224 208H272" />
            <path d="M128 208L200 288L272 208M176 208L200 288L224 208" />
            <path d="M200 288V356M160 346L200 356L240 346M160 346L200 408L240 346" />
            <path d="M96 262L112 332L160 346M304 262L288 332L240 346M96 262L128 208M304 262L272 208" />
          </g>
          <g fill="var(--rose)">
            {POINTS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" />
            ))}
          </g>
        </svg>

        <div className="relative z-10 max-w-2xl">
          <h2
            id="mulai-title"
            ref={title}
            className="font-display text-5xl leading-[1.05] tracking-tight text-secondary-foreground sm:text-6xl"
          >
            Siap melihat <em className="text-rose">lebih dekat?</em>
          </h2>
          <p data-cta className="mt-5 text-lg text-secondary-foreground/80">
            Mulai dengan satu langkah sederhana.
          </p>
          <div data-cta className="mt-9">
            <CtaButton className="px-8 py-4 text-base">
              Mulai Skrining <ArrowRight className="h-5 w-5" />
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}