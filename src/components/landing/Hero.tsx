import { useRef } from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { gsap, useGSAP, revealLines, showNow } from "@/lib/motion";
import { CtaButton } from "./Navbar";
import { FaceIllustration } from "./FaceIllustration";

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const h1 = useRef<HTMLHeadingElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        showNow(h1.current, ...gsap.utils.toArray<HTMLElement>("[data-in]", root.current ?? undefined));
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (h1.current) revealLines(h1.current, { scroll: false, delay: 0.2 });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo('[data-in="text"]', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.14 }, 0.1)
          .fromTo('[data-in="art"]', { scale: 0.94, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.4, ease: "power4.out" }, 0.25)
          .fromTo('[data-in="stat"]', { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1 }, 0.9);

        // Angka 60 menghitung naik
        const n = count.current;
        if (n) {
          const o = { v: 0 };
          n.textContent = "0";
          tl.to(
            o,
            {
              v: 60,
              duration: 1.8,
              ease: "power2.out",
              onUpdate: () => {
                n.textContent = String(Math.round(o.v));
              },
            },
            1,
          );
        }

        // Parallax halus saat hero discroll keluar
        const scrub = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to('[data-par="art"]', { y: -50, ease: "none", scrollTrigger: scrub });
        gsap.to('[data-par="stat"]', { y: -90, ease: "none", scrollTrigger: scrub });

        return () => {
          if (n) n.textContent = "60";
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="beranda" className="relative flex min-h-svh items-center overflow-hidden px-5 pt-28 pb-14">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        {/* KIRI: pesan utama */}
        <div>
          <p
            data-in="text"
            className="inline-block rounded-full bg-accent px-4 py-1.5 text-xs font-semibold tracking-[0.14em] text-burgundy opacity-0"
          >
            SKRINING AWAL WAJAH
          </p>
          <h1
            ref={h1}
            className="invisible mt-6 font-display text-[clamp(2.5rem,min(5.2vw,8.5vh),4.25rem)] leading-[1.05] tracking-[-0.035em] text-balance text-navy"
          >
            Bagaimana jika perubahan itu <span className="text-burgundy">terlihat lebih awal?</span>
          </h1>
          <p data-in="text" className="mt-6 max-w-[30rem] text-base leading-relaxed text-pretty text-olive opacity-0 sm:text-lg">
            FaciCheck membantu Anda mengamati kemungkinan asimetri wajah melalui skrining visual yang sederhana.
          </p>
          <div data-in="text" className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 opacity-0">
            <CtaButton className="px-7 py-4 text-base">
              Mulai Skrining <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </CtaButton>
            <p className="flex items-center gap-2 text-sm font-medium text-olive">
              <ShieldAlert className="h-4 w-4 text-burgundy" aria-hidden="true" /> Bukan alat diagnosis medis.
            </p>
          </div>
        </div>

        {/* KANAN: visual + bukti */}
        <div className="relative mx-auto w-full max-w-[min(26rem,60vh)] lg:max-w-[min(30rem,62vh)]">
          <div data-par="art">
            <div data-in="art" className="opacity-0">
              <FaceIllustration />
            </div>
          </div>
          <div data-par="stat" className="absolute top-[74%] left-0 sm:-left-6 lg:-left-10">
            <div data-in="stat" className="glass w-60 rounded-3xl p-5 opacity-0">
              <span aria-hidden="true" className="block h-0.5 w-8 rounded-full bg-burgundy" />
              <p className="mt-3 flex items-baseline gap-2 text-navy tabular-nums">
                <span className="font-display text-5xl leading-none tracking-[-0.04em]">1</span>
                <span className="text-sm font-medium text-olive">dari</span>
                <span ref={count} className="font-display text-5xl leading-none tracking-[-0.04em]">
                  60
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-olive">
                perkiraan risiko seseorang mengalami Bell’s palsy sepanjang hidupnya.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Isyarat gulir: hanya di layar yang cukup tinggi */}
      <a
        href="#tentang"
        aria-label="Gulir ke bawah"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.7rem] font-medium tracking-[0.16em] text-olive/70 [@media(min-height:760px)]:flex"
      >
        GULIR
        <span className="relative block h-10 w-px overflow-hidden bg-navy/15">
          <span className="absolute inset-x-0 top-0 block h-1/2 animate-cue bg-burgundy" />
        </span>
      </a>
    </section>
  );
}