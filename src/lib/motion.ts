import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

type RevealOpts = { scroll?: boolean; start?: string; delay?: number };

/** Headline muncul per baris (mask). scroll:false = langsung jalan (untuk hero). */
export function revealLines(
  el: HTMLElement,
  { scroll = true, start = "top 88%", delay = 0 }: RevealOpts = {},
) {
  return SplitText.create(el, {
    type: "lines",
    mask: "lines",
    autoSplit: true,
    onSplit: (self) => {
      gsap.set(el, { visibility: "visible" });
      const tweenVars = {
        yPercent: 110,
        duration: 1,
        ease: "power4.out",
        stagger: 0.12,
        delay,
        ...(scroll
          ? { scrollTrigger: { trigger: el, start, once: true } }
          : {}),
      } satisfies gsap.TweenVars;

      return gsap.from(self.lines, tweenVars);
    },
  });
}

/** Tampilkan elemen langsung (untuk reduced motion). */
export function showNow(...els: (Element | null | undefined)[]) {
  const list = els.filter((e): e is Element => !!e);
  if (list.length) gsap.set(list, { visibility: "visible", autoAlpha: 1 });
}
