import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Reveal } from "./Reveal";
import { THEMES } from "@/lib/themes";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

const main = {
  fill: "none",
  stroke: "var(--navy)",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;
const accent = {
  fill: "none",
  stroke: "var(--burgundy)",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/* Cadangan jika PNG belum ada */
function ScanArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" aria-hidden="true">
      <path
        {...accent}
        d="M20 40V24a4 4 0 0 1 4-4h16M80 20h16a4 4 0 0 1 4 4v16M100 80v16a4 4 0 0 1-4 4H80M40 100H24a4 4 0 0 1-4-4V80"
      />
      <ellipse {...main} cx="60" cy="60" rx="22" ry="28" />
      <line
        x1="60"
        y1="28"
        x2="60"
        y2="92"
        stroke="var(--rose)"
        strokeWidth="1.5"
        strokeDasharray="3 5"
        strokeOpacity=".7"
      />
      <circle cx="51" cy="54" r="2.5" fill="var(--rose)" />
      <circle cx="69" cy="54" r="2.5" fill="var(--rose)" />
      <path {...main} d="M52 72q8 5 16 0" />
    </svg>
  );
}

function EyeArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" aria-hidden="true">
      <path {...main} d="M12 66Q60 26 108 66Q60 106 12 66Z" />
      <circle {...main} cx="60" cy="66" r="15" />
      <circle cx="60" cy="66" r="5" fill="var(--rose)" />
      <path {...accent} d="M60 14v10M26 28l6 7M94 28l-6 7" />
    </svg>
  );
}

function ShieldArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20" aria-hidden="true">
      <path
        {...main}
        d="M60 14L98 28V58C98 82 80 98 60 106C40 98 22 82 22 58V28Z"
      />
      <path {...accent} d="M60 44V74M45 59H75" />
    </svg>
  );
}

const ITEMS = [
  {
    title: "Notice the little changes",
    text: "Terkadang, perubahan pada wajah terlihat begitu halus. FaciCheck membantu Anda mengamati kemungkinan asimetri wajah melalui pendekatan visual yang lebih terarah.",
    Art: ScanArt,
  },
  {
    title: "Make sense of what you see",
    text: "Informasi kesehatan tidak seharusnya terasa rumit. FaciCheck dirancang untuk menyampaikan informasi awal dari analisis visual dengan bahasa yang sederhana dan mudah diikuti.",
    Art: EyeArt,
  },
  {
    title: "Know when to seek help",
    text: "Hasil skrining bukanlah diagnosis. FaciCheck membantu pengguna memahami keterbatasan hasil analisis dan mengingatkan kapan konsultasi dengan tenaga kesehatan diperlukan.",
    Art: ShieldArt,
  },
];

const ICONS = [
  "/icons/awareness-1.png",
  "/icons/awareness-2.png",
  "/icons/awareness-3.png",
];
const TILT = [2.5, -2.5, 0]; // kanan, kiri, lurus

function CardIcon({ i }: { i: number }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);
  const Art = ITEMS[i]!.Art;
  if (failed) return <Art />;
  return (
    <img
      ref={ref}
      src={ICONS[i]}
      alt=""
      width={80}
      height={80}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-[4.5rem] w-[4.5rem] object-contain"
    />
  );
}

function CardBody({ i, showTitle }: { i: number; showTitle: boolean }) {
  const { title, text } = ITEMS[i]!;
  return (
    <div
      className="flex h-full flex-col rounded-[2rem] p-7 text-primary-foreground"
      style={{
        background: THEMES.burgundy.bg,
        boxShadow: THEMES.burgundy.shadow,
      }}
    >
      <div className="flex items-start justify-between">
        <span className="grid h-24 w-24 place-items-center rounded-[1.75rem] bg-cream">
          <CardIcon i={i} />
        </span>
        <span className="text-sm font-semibold tabular-nums text-primary-foreground/70">
          0{i + 1} / 03
        </span>
      </div>
      <div className="mt-auto pt-6">
        <h3
          className={
            showTitle ? "mb-3 font-display text-3xl tracking-[-0.03em]" : "sr-only"
          }
        >
          {title}
        </h3>
        <p className="text-base leading-relaxed text-primary-foreground/85">
          {text}
        </p>
      </div>
    </div>
  );
}

export function Awareness() {
  const root = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const first = useRef(true);
  const [active, setActive] = useState(0);

  // Entrance: headline per baris + daftar sub-headline muncul berurutan
  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const items = itemRefs.current.filter(Boolean);
      if (reduce) {
        gsap.set(items, { autoAlpha: 1 });
        return;
      }
      if (headline.current) {
        SplitText.create(headline.current, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 0.9,
              ease: "power4.out",
              stagger: 0.1,
              scrollTrigger: {
                trigger: headline.current,
                start: "top 85%",
                once: true,
              },
            }),
        });
      }
      gsap.fromTo(
        items,
        { y: 20, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: root.current,
            start: "top 75%",
            once: true,
          },
        },
      );
    },
    { scope: root },
  );

  // Crossfade card; tiap card punya kemiringan sendiri
  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const t = first.current || reduce ? 0 : 1;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const rot = TILT[i] ?? 0;
        if (i === active) {
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            rotate: rot,
            duration: 0.6 * t,
            delay: 0.1 * t,
            ease: "power3.out",
            overwrite: true,
          });
        } else {
          gsap.to(el, {
            autoAlpha: 0,
            y: i < active ? -16 : 16,
            rotate: rot + (i < active ? -2 : 2),
            duration: 0.3 * t,
            ease: "power2.in",
            overwrite: true,
          });
        }
      });
      first.current = false;
    },
    { dependencies: [active], scope: root },
  );

  return (
    <div
      ref={root}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-20"
    >
      {/* KIRI */}
      <div>
        <h2
          id="tentang-title"
          ref={headline}
          className="max-w-xl font-display text-[2rem] leading-[1.12] tracking-[-0.03em] text-balance text-navy sm:text-4xl lg:text-[2.75rem]"
        >
          A little more awareness can make a difference.
        </h2>

        {/* Desktop: daftar sub-headline */}
        <ol
          aria-label="Topik kesadaran"
          className="mt-8 hidden lg:block"
          onKeyDown={(e) => {
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
            e.preventDefault();
            const step = e.key === "ArrowDown" ? 1 : ITEMS.length - 1;
            const next = (active + step) % ITEMS.length;
            setActive(next);
            e.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
          }}
        >
          {ITEMS.map((it, i) => (
            <li
              key={it.title}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="opacity-0"
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                onFocus={() => setActive(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setActive(i);
                }}
                aria-current={active === i}
                className={`flex w-full items-baseline gap-5 py-3 text-left touch-manipulation transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${
                  active === i ? "text-burgundy" : "text-navy"
                }`}
              >
                <span className="w-7 shrink-0 text-sm font-semibold tabular-nums">
                  0{i + 1}
                </span>
                <span className="font-display text-3xl tracking-[-0.025em] xl:text-4xl">
                  {it.title}
                </span>
              </button>
            </li>
          ))}
        </ol>

        {/* Mobile/tablet: card bertumpuk */}
        <div className="mt-8 space-y-5 lg:hidden">
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={i * 80}>
              <CardBody i={i} showTitle />
            </Reveal>
          ))}
        </div>
      </div>

      {/* KANAN (desktop): card yang berganti */}
      <div className="hidden lg:block" aria-live="polite">
        <div className="relative h-[26rem] w-full">
          {ITEMS.map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute inset-0 will-change-transform"
              style={{
                opacity: i === 0 ? 1 : 0,
                visibility: i === 0 ? "visible" : "hidden",
                transform: i === 0 ? `rotate(${TILT[0]}deg)` : undefined,
              }}
            >
              <CardBody i={i} showTitle={false} />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-2" aria-hidden="true">
          {ITEMS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${active === i ? "w-10 bg-burgundy" : "w-4 bg-navy/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}