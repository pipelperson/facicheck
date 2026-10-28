import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion";

const wash = (color: string, pct: number) =>
  `radial-gradient(closest-side, color-mix(in oklab, var(--${color}) ${pct}%, transparent), transparent)`;

const DOTS =
  "radial-gradient(color-mix(in oklab, var(--navy) 16%, transparent) 1px, transparent 1.3px)";
const DOTS_MASK = "radial-gradient(75% 65% at 50% 28%, #000 20%, transparent 75%)";

export function Backdrop() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = { start: 0, end: "max", scrub: 1.2, invalidateOnRefresh: true, refreshPriority: -2 };
        gsap.to("[data-blob='a']", { y: 420, x: -90, ease: "none", scrollTrigger: { ...st } });
        gsap.to("[data-blob='b']", { y: -220, x: 60, ease: "none", scrollTrigger: { ...st } });
        gsap.to("[data-blob='c']", { y: -140, x: 160, ease: "none", scrollTrigger: { ...st } });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <>
      <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          data-blob="a"
          className="absolute -top-48 -right-48 h-[46rem] w-[46rem] rounded-full will-change-transform"
          style={{ background: wash("rose", 28) }}
        />
        <div
          data-blob="b"
          className="absolute top-[45%] -left-56 h-[42rem] w-[42rem] rounded-full will-change-transform"
          style={{ background: wash("sage", 22) }}
        />
        <div
          data-blob="c"
          className="absolute -right-40 -bottom-56 h-[40rem] w-[40rem] rounded-full will-change-transform"
          style={{ background: wash("skin", 32) }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[100svh]"
        style={{
          backgroundImage: DOTS,
          backgroundSize: "28px 28px",
          maskImage: DOTS_MASK,
          WebkitMaskImage: DOTS_MASK,
        }}
      />
    </>
  );
}