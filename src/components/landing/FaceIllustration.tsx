import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/motion";

const points: [number, number, number][] = [
  [150, 150, 0],
  [190, 145, 0.4],
  [250, 145, 0.8],
  [290, 150, 1.2],
  [165, 178, 0.2],
  [205, 178, 0.6],
  [235, 178, 1],
  [275, 178, 1.4],
  [220, 235, 0.5],
  [195, 268, 0.9],
  [220, 274, 1.3],
  [245, 268, 1.7],
];

export function FaceIllustration() {
  const root = useRef<HTMLDivElement>(null);

  // Intro: landmark muncul satu per satu → jaring tergambar → penunjuk → chip
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          delay: 0.9,
          defaults: { ease: "power2.out" },
        });
        tl.fromTo(
          "[data-lm]",
          { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" },
          { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.09 },
          0,
        )
          .fromTo(
            '[data-draw="mesh"]',
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" },
            0.6,
          )
          .fromTo(
            '[data-draw="pointer"]',
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 0.5 },
            1.5,
          )
          .fromTo(
            "[data-chip]",
            { y: 8, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.6 },
            1.8,
          );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="relative isolate mx-auto w-full max-w-xl"
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute -top-6 right-[14%] -z-10 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--rose) 38%, transparent), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-[6%] -z-10 h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--sage) 32%, transparent), transparent)",
        }}
      />

      <svg viewBox="20 30 400 410" className="h-auto w-full">
        <defs>
          <linearGradient id="scanGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--rose)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--rose)" stopOpacity=".3" />
          </linearGradient>
          <linearGradient id="fadeY" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.7" stopColor="white" />
            <stop offset="1" stopColor="black" />
          </linearGradient>
          <mask
            id="shoulderFade"
            maskUnits="userSpaceOnUse"
            x="20"
            y="30"
            width="400"
            height="410"
          >
            <rect x="20" y="30" width="400" height="410" fill="url(#fadeY)" />
          </mask>
          <clipPath id="faceClip">
            <ellipse cx="220" cy="190" rx="112" ry="136" />
          </clipPath>
        </defs>

        {/* shoulders + neck */}
        <path
          d="M60 440 C70 370 130 345 185 335 L185 300 M255 300 L255 335 C310 345 370 370 380 440"
          fill="none"
          stroke="var(--navy)"
          strokeWidth="3"
          strokeLinecap="round"
          mask="url(#shoulderFade)"
        />
        {/* head */}
        <ellipse
          cx="220"
          cy="190"
          rx="105"
          ry="130"
          fill="var(--card)"
          fillOpacity="0.6"
          stroke="var(--navy)"
          strokeWidth="3"
        />
        {/* hair line */}
        <path
          d="M125 140 C150 85 290 85 315 140"
          fill="none"
          stroke="var(--navy)"
          strokeOpacity=".35"
          strokeWidth="2"
        />
        {/* midline */}
        <line
          x1="220"
          y1="55"
          x2="220"
          y2="330"
          stroke="var(--burgundy)"
          strokeOpacity=".35"
          strokeWidth="1.5"
          strokeDasharray="5 6"
        />
        {/* brows */}
        <path
          d="M150 150 Q170 140 190 145 M250 145 Q270 140 290 150"
          fill="none"
          stroke="var(--navy)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* eyes */}
        <path
          d="M165 178 Q185 168 205 178 Q185 186 165 178Z M235 178 Q255 168 275 178 Q255 186 235 178Z"
          fill="none"
          stroke="var(--navy)"
          strokeWidth="2.5"
        />
        <circle cx="185" cy="177" r="4" fill="var(--navy)" />
        <circle cx="255" cy="177" r="4" fill="var(--navy)" />
        {/* nose */}
        <path
          d="M220 190 L212 232 Q220 238 228 232"
          fill="none"
          stroke="var(--navy)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* mouth (neutral) */}
        <path
          d="M195 268 Q220 278 245 268"
          fill="none"
          stroke="var(--navy)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* landmark mesh (path + pathLength agar bisa "digambar" di semua browser) */}
        <path
          data-draw="mesh"
          d="M150 150L165 178L195 268L220 274L245 268L275 178L290 150"
          pathLength={1}
          strokeDasharray="1"
          fill="none"
          stroke="var(--rose)"
          strokeOpacity=".5"
          strokeWidth="1"
        />
        {/* garis penunjuk dari alis kanan ke label */}
        <path
          data-draw="pointer"
          d="M290 150L314 82"
          pathLength={1}
          strokeDasharray="1"
          fill="none"
          stroke="var(--rose)"
          strokeWidth="1.2"
          strokeOpacity=".8"
        />
        {points.map(([x, y, d], i) => (
          <g key={i} data-lm>
            <circle
              cx={x}
              cy={y}
              r="4"
              fill="var(--burgundy)"
              className="animate-pulse-dot"
              style={{ animationDelay: `${d}s` }}
            />
          </g>
        ))}

        {/* scan line */}
        <g clipPath="url(#faceClip)">
          <g className="animate-scan">
            <rect
              x="100"
              y="60"
              width="240"
              height="18"
              fill="url(#scanGlow)"
            />
            <line
              x1="100"
              y1="69"
              x2="340"
              y2="69"
              stroke="var(--rose)"
              strokeWidth="2"
            />
          </g>
        </g>
      </svg>

      <div
        data-chip
        className="absolute top-[12.2%] left-[73.5%] -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/70 bg-card/90 px-2.5 py-1.5 shadow-soft sm:px-3.5 sm:py-2"
      >
        <p className="text-[11px] font-semibold text-navy sm:text-sm">
          Analisis Visual
        </p>
        <p className="text-[10px] text-olive sm:text-xs">Simetri wajah</p>
      </div>
    </div>
  );
}
