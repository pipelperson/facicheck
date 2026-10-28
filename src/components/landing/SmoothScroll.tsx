import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lenis = reduce ? null : new Lenis({ lerp: 0.1, smoothWheel: true });
    let tick: ((time: number) => void) | null = null;
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();

      // Section yang di-pin dibungkus .pin-spacer: scroll ke pembungkusnya
      // supaya selalu mendarat di awal pin, dari arah mana pun.
      const spacer = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : null;
      const target = spacer ?? el;
      const offset = spacer ? 0 : -96;

      if (lenis) lenis.scrollTo(target, { offset, duration: 1.2 });
      else target.scrollIntoView();
      history.replaceState(null, "", `#${id}`);
    };
    document.addEventListener("click", onClick);

    // Font web bisa mengubah tinggi teks → hitung ulang posisi trigger
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  return null;
}