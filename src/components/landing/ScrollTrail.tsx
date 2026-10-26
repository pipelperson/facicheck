import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/motion";

const CHAPTERS = ["beranda", "tentang", "cara-kerja", "catatan", "mulai"] as const;

export function ScrollTrail() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1280px) and (prefers-reduced-motion: no-preference)", () => {
        const dots = gsap.utils.toArray<HTMLElement>("[data-dot]", root.current ?? undefined);
        const secs = CHAPTERS.map((id) => document.getElementById(id));
        if (secs.some((s) => !s)) return;

        const paint = (idx: number) =>
          dots.forEach((d, i) => {
            d.dataset.state = i < idx ? "past" : i === idx ? "current" : "next";
          });
        paint(0);

        const last = CHAPTERS.length - 1;
        for (let i = 0; i < last; i++) {
          gsap.fromTo(
            "[data-fill]",
            { scaleY: i / last },
            {
              scaleY: (i + 1) / last,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: secs[i]!,
                start: "top 55%",
                endTrigger: secs[i + 1]!,
                end: "top 55%",
                scrub: true,
                refreshPriority: -1,
                onToggle: (self) => {
                  if (self.isActive) paint(i);
                },
              },
            },
          );
        }
        ScrollTrigger.create({
          trigger: secs[last]!,
          start: "top 55%",
          refreshPriority: -1,
          onEnter: () => paint(last),
          onLeaveBack: () => paint(last - 1),
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed top-1/2 right-6 z-30 hidden h-56 w-3 -translate-y-1/2 xl:block motion-reduce:hidden"
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-navy/15" />
      <span
        data-fill
        className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-burgundy"
        style={{ transformOrigin: "top", transform: "scaleY(0)" }}
      />
      {CHAPTERS.map((id, i) => (
        <span
          key={id}
          data-dot
          data-state="next"
          style={{ top: `${(i / (CHAPTERS.length - 1)) * 100}%` }}
          className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/25 bg-background transition-all duration-500 data-[state=current]:scale-150 data-[state=current]:border-burgundy data-[state=current]:bg-burgundy data-[state=past]:border-rose data-[state=past]:bg-rose"
        />
      ))}
    </div>
  );
}