import { useEffect, useRef, useState } from "react";
import { BookOpenCheck, ScanFace, FileText, type LucideIcon } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { THEMES } from "@/lib/themes";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

type Step = {
  title: string;
  text: string;
  icon: string;
  Fallback: LucideIcon;
  bg: string;
};

const STEPS: Step[] = [
  {
    title: "Prepare your face",
    text: "Ikuti panduan posisi wajah, pencahayaan, dan pengambilan gambar agar sistem dapat memproses gambar dengan lebih baik.",
    icon: "/icons/howitworks-1-prepare.png",
    Fallback: BookOpenCheck,
    bg: THEMES.burgundy.bg,
  },
  {
    title: "Let FaciCheck analyze",
    text: "Sistem memproses gambar untuk mengamati fitur visual wajah sesuai kemampuan model yang digunakan.",
    icon: "/icons/howitworks-2-analyze.png",
    Fallback: ScanFace,
    bg: THEMES.navy.bg,
  },
  {
    title: "Understand the result",
    text: "Pelajari hasil analisis, keterbatasannya, dan langkah selanjutnya yang dapat dipertimbangkan.",
    icon: "/icons/howitworks-3-understand.png",
    Fallback: FileText,
    bg: THEMES.olive.bg,
  },
];

/* Kartu "menyala" jika salah satu flag aktif: scroll ATAU hover */
type Flag = "scroll" | "hover";
const sync = (el: HTMLElement) => {
  el.dataset["on"] = el.dataset["scroll"] === "1" || el.dataset["hover"] === "1" ? "true" : "false";
};
const setFlag = (el: HTMLElement, key: Flag, value: boolean) => {
  el.dataset[key] = value ? "1" : "0";
  sync(el);
};
const resetCard = (el: HTMLElement) => {
  el.dataset["scroll"] = "0";
  el.dataset["hover"] = "0";
  sync(el);
};

function StepIcon({ i }: { i: number }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  const { Fallback, icon } = STEPS[i]!;
  if (failed) return <Fallback className="h-9 w-9 text-burgundy" strokeWidth={1.75} aria-hidden="true" />;
  return (
    <img
      ref={ref}
      src={icon}
      alt=""
      width={72}
      height={72}
      decoding="async"
      onError={() => setFailed(true)}
      className="h-[4.5rem] w-[4.5rem] object-contain"
    />
  );
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", root);
      const dashes = gsap.utils.toArray<HTMLElement>("[data-dash]", root);
      const mm = gsap.matchMedia();

      /* Headline per baris + teks pendukung (semua layar, kecuali reduced motion) */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const head = headRef.current;
        if (head) {
          SplitText.create(head, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.9,
                ease: "power4.out",
                stagger: 0.1,
                scrollTrigger: { trigger: head, start: "top 88%", once: true },
              }),
          });
        }
        gsap.from("[data-fade]", {
          y: 18,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root, start: "top 75%", once: true },
        });
      });

      /* DESKTOP: pin + geser horizontal */
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        if (!viewport || !track) return;

        viewport.style.overflowX = "hidden";
        const dist = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        const length = () => Math.max(dist() * 1.4, window.innerHeight * 1.4);

        let current = -1;
        const apply = (idx: number) => {
          if (idx === current) return;
          current = idx;
          cards.forEach((c, i) => setFlag(c, "scroll", i <= idx));
          dashes.forEach((d, i) => {
            d.dataset["on"] = i === idx ? "true" : "false";
          });
        };
        apply(0);

        gsap.from(cards, {
          y: 48,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root, start: "top 70%", once: true },
        });

        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${length()}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) =>
              apply(Math.min(cards.length - 1, Math.floor(self.progress * cards.length))),
          },
        });

        // Hover: kartu berwarna saat pointer mouse mengarah ke kartu
        const offs = cards.map((card) => {
          const enter = (e: PointerEvent) => {
            if (e.pointerType === "mouse") setFlag(card, "hover", true);
          };
          const leave = () => setFlag(card, "hover", false);
          card.addEventListener("pointerenter", enter);
          card.addEventListener("pointerleave", leave);
          return () => {
            card.removeEventListener("pointerenter", enter);
            card.removeEventListener("pointerleave", leave);
          };
        });

        return () => {
          offs.forEach((off) => off());
          viewport.style.overflowX = "";
          cards.forEach(resetCard);
          dashes.forEach((d) => {
            d.dataset["on"] = "false";
          });
        };
      });

      /* MOBILE/TABLET: vertikal, berwarna saat di area tengah layar */
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        const triggers = cards.map((card) =>
          ScrollTrigger.create({
            trigger: card,
            start: "top 70%",
            end: "bottom 30%",
            onToggle: (self) => setFlag(card, "scroll", self.isActive),
          }),
        );
        return () => {
          triggers.forEach((t) => t.kill());
          cards.forEach(resetCard);
        };
      });

      /* REDUCED MOTION: langsung berwarna, tanpa pin */
      mm.add("(prefers-reduced-motion: reduce)", () => {
        cards.forEach((c) => setFlag(c, "scroll", true));
        return () => cards.forEach(resetCard);
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="cara-kerja"
      aria-labelledby="cara-kerja-title"
      className="relative py-12 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:overflow-hidden lg:py-0 lg:pt-16"
    >
      {/* Header: sejajar dengan section Awareness */}
      <div className="mx-auto w-full max-w-[74.5rem] px-5">
        <p data-fade className="text-sm font-semibold tracking-[0.14em] text-burgundy">
          CARA KERJA
        </p>
        <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <h2
            id="cara-kerja-title"
            ref={headRef}
            className="font-display text-4xl leading-[1.05] tracking-[-0.035em] text-balance text-navy sm:text-5xl lg:text-[clamp(2.25rem,3.8vw,3.5rem)]"
          >
            A simple process, a clearer understanding.
          </h2>
          <p data-fade className="mt-5 max-w-md text-base leading-relaxed text-pretty text-olive lg:mt-0 lg:pb-2">
            Skrining awal tidak harus terasa rumit. Ikuti beberapa langkah sederhana untuk mengambil
            gambar wajah dan memahami informasi visual yang ditampilkan FaciCheck.
          </p>
        </div>
      </div>

      {/* Track kartu */}
      <div ref={viewportRef} className="mt-10 lg:mt-6 lg:overflow-x-auto lg:py-5">
        <div
          ref={trackRef}
          className="flex flex-col gap-5 px-5 will-change-transform lg:w-max lg:flex-row lg:gap-6 lg:pr-[max(1.25rem,calc((100vw-72rem)/2))] lg:pl-[max(1.25rem,calc((100vw-72rem)/2))]"
        >
          {STEPS.map((s, i) => (
            <article
              key={s.title}
              data-card
              data-on="false"
              className="group/card relative flex min-h-[19rem] flex-col overflow-hidden rounded-[2rem] border border-border bg-muted p-7 transition-[translate,box-shadow,border-color] duration-700 ease-out data-[on=true]:border-transparent data-[on=true]:shadow-soft lg:h-[clamp(15rem,42vh,25rem)] lg:w-[min(34rem,46vw)] lg:shrink-0 lg:p-9 lg:data-[on=true]:-translate-y-2"
            >
              {/* lapisan warna, fade-in saat aktif */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-data-[on=true]/card:opacity-100"
                style={{ background: s.bg }}
              />

              <div className="relative z-10 flex items-start justify-between">
                <span className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-card/70 opacity-60 grayscale transition-[filter,opacity,background-color] duration-700 ease-out group-data-[on=true]/card:bg-cream group-data-[on=true]/card:opacity-100 group-data-[on=true]/card:grayscale-0">
                  <StepIcon i={i} />
                </span>
                <span
                  aria-hidden="true"
                  className="font-display text-6xl tracking-[-0.04em] tabular-nums text-navy/20 transition-colors duration-700 group-data-[on=true]/card:text-primary-foreground/35"
                >
                  0{i + 1}
                </span>
              </div>

              <div className="relative z-10 mt-auto pt-8">
                <h3 className="font-display text-3xl tracking-[-0.03em] text-navy/60 transition-colors duration-700 group-data-[on=true]/card:text-primary-foreground">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-olive/80 transition-colors duration-700 group-data-[on=true]/card:text-primary-foreground/85">
                  {s.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Indikator langkah (desktop) */}
      <div aria-hidden="true" className="mx-auto hidden w-full max-w-[74.5rem] gap-2 px-5 lg:mt-4 lg:flex">
        {STEPS.map((s) => (
          <span
            key={s.title}
            data-dash
            data-on="false"
            className="h-1 w-4 rounded-full bg-navy/20 transition-all duration-500 data-[on=true]:w-10 data-[on=true]:bg-burgundy"
          />
        ))}
      </div>
    </section>
  );
}