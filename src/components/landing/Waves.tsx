import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion";

const WAVES = [
  {
    id: "rose", color: "var(--rose)", peak: 0.38, dur: 46, dir: 1,
    d: "M0 150 C240 70 480 210 720 140 C960 70 1200 230 1440 150 C1680 70 1920 210 2160 140 C2400 70 2640 230 2880 150 V320 H0Z",
  },
  {
    id: "sage", color: "var(--sage)", peak: 0.34, dur: 62, dir: -1,
    d: "M0 205 C220 150 500 265 720 200 C940 140 1220 270 1440 205 C1660 150 1940 265 2160 200 C2380 140 2660 270 2880 205 V320 H0Z",
  },
  {
    id: "burgundy", color: "var(--burgundy)", peak: 0.16, dur: 80, dir: 1,
    d: "M0 262 C260 225 520 292 760 258 C1000 224 1220 290 1440 262 C1700 225 1960 292 2200 258 C2440 224 2660 290 2880 262 V320 H0Z",
  },
] as const;

export function Waves() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<SVGElement>("[data-wave]", el).forEach((w, i) => {
          const cfg = WAVES[i];
          if (!cfg) return;
          gsap.fromTo(
            w,
            { xPercent: cfg.dir === 1 ? 0 : -50 },
            { xPercent: cfg.dir === 1 ? -50 : 0, duration: cfg.dur, ease: "none", repeat: -1 },
          );
        });
        gsap.fromTo(
          "[data-wave-wrap]",
          { y: 70 },
          {
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom bottom", scrub: true, refreshPriority: -2 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[30rem] overflow-hidden sm:h-[34rem]"
    >
      <div data-wave-wrap className="absolute inset-0">
        {WAVES.map((w) => (
          <svg
            key={w.id}
            data-wave
            viewBox="0 0 2880 320"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 h-full w-[200%] will-change-transform"
          >
            <defs>
              <linearGradient id={`wave-${w.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={w.color} stopOpacity="0" />
                <stop offset="0.45" stopColor={w.color} stopOpacity={w.peak} />
                <stop offset="1" stopColor={w.color} stopOpacity={w.peak} />
              </linearGradient>
            </defs>
            <path d={w.d} fill={`url(#wave-${w.id})`} />
          </svg>
        ))}
      </div>
    </div>
  );
}