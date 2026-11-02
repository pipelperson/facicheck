import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, ChevronDown } from "lucide-react";
import { gsap, revealLines, showNow, useGSAP } from "@/lib/motion";
import {
  LAMP_COLORS,
  OUTCOMES,
  ZONE_LABELS,
  readAreas,
  summarizeAreas,
  type AreaReading,
  type MetricKey,
} from "@/lib/result-copy";
import type { CapturedPhoto, Landmarks, SuccessOutcome } from "@/lib/screening";

const TINTS = ["rgba(163,165,126,0.3)", "rgba(186,151,150,0.3)", "rgba(147,77,86,0.3)"] as const;

/** Skala tiga tahap: tahap aktif berwarna penuh dengan penanda segitiga. */
function ResultScale({ index }: { index: number }) {
  return (
    <ol aria-label={`Tingkat hasil: ${ZONE_LABELS[index]}`} className="flex max-w-md gap-1.5">
      {ZONE_LABELS.map((label, i) => {
        const on = i === index;
        return (
          <li key={label} aria-current={on ? "true" : undefined} className="flex-1">
            <div className="flex h-2.5 justify-center" aria-hidden="true">
              {on && <span className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-navy" />}
            </div>
            <div
              {...(on ? { "data-active-seg": "" } : {})}
              className="h-1.5 origin-left rounded-full"
              style={{ background: on ? LAMP_COLORS[i] : TINTS[i] }}
            />
            <p className={`mt-2 text-xs leading-snug sm:text-sm ${on ? "font-semibold text-navy" : "text-olive"}`}>
              {label}
              {on && <span className="sr-only"> (hasil Anda)</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

const PAIRS = [
  { id: "brow", metric: "brow_asymmetry", a: "brow_left", b: "brow_right" },
  { id: "eye", metric: "eye_asymmetry", a: "eye_left", b: "eye_right" },
  { id: "mouth", metric: "mouth_tilt", a: "mouth_left", b: "mouth_right" },
] as const satisfies readonly { id: string; metric: MetricKey; a: keyof Landmarks; b: keyof Landmarks }[];

/** Garis penuh = posisi sebenarnya. Garis putus-putus = acuan sejajar. Warna mengikuti penilaian bagian itu bila ada. */
function LandmarkOverlay({ marks, rows }: { marks: Landmarks; rows: AreaReading[] }) {
  const W = 300;
  const H = 400;
  const midX = (marks.eye_left[0] + marks.eye_right[0] + marks.mouth_left[0] + marks.mouth_right[0]) / 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <line x1={midX * W} y1={H * 0.08} x2={midX * W} y2={H * 0.92} stroke="white" strokeOpacity=".6" strokeWidth="1" strokeDasharray="4 4" />
      {PAIRS.map((p) => {
        const a = marks[p.a];
        const b = marks[p.b];
        const level = rows.find((r) => r.key === p.metric)?.level;
        const color = level === undefined ? "var(--rose)" : (LAMP_COLORS[level] ?? "var(--rose)");
        const midY = (a[1] + b[1]) / 2;
        return (
          <g key={p.id}>
            <line x1={a[0] * W} y1={midY * H} x2={b[0] * W} y2={midY * H} stroke="white" strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="3 3" />
            <line
              data-line
              pathLength={1}
              strokeDasharray={1}
              x1={a[0] * W}
              y1={a[1] * H}
              x2={b[0] * W}
              y2={b[1] * H}
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle data-dot cx={a[0] * W} cy={a[1] * H} r="4" fill={color} stroke="white" strokeWidth="1.5" />
            <circle data-dot cx={b[0] * W} cy={b[1] * H} r="4" fill={color} stroke="white" strokeWidth="1.5" />
          </g>
        );
      })}
    </svg>
  );
}

export function ResultStep({ photo, result, onRetake }: { photo: CapturedPhoto; result: SuccessOutcome; onRetake: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [showMarks, setShowMarks] = useState(true);

  const o = OUTCOMES[result.code];
  const rows = readAreas(result.metrics);
  const summary = summarizeAreas(result.code, rows);
  const marks = result.landmarks;
  const score = result.probability === null ? null : Math.round(Math.min(100, Math.max(0, result.probability)));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (title.current) revealLines(title.current, { scroll: false, delay: 0.15 });
        gsap.fromTo("[data-active-seg]", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power3.out", delay: 0.1 });
        gsap.fromTo(
          "[data-rise]",
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: 0.09, delay: 0.45 },
        );
        if (marks) {
          // garis scan menyapu foto sekali, lalu garis ukur "tergambar"
          gsap
            .timeline({ delay: 0.5 })
            .fromTo("[data-scan]", { top: "0%", autoAlpha: 1 }, { top: "100%", duration: 1.1, ease: "power1.inOut" })
            .to("[data-scan]", { autoAlpha: 0, duration: 0.25 })
            .fromTo("[data-line]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.15, ease: "power2.out" }, 0.9)
            .from("[data-dot]", { autoAlpha: 0, duration: 0.35, stagger: 0.06 }, "<0.2");
        }
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-rise]", { autoAlpha: 1 });
        showNow(title.current);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
      {/* Foto */}
      <div className="lg:self-start">
        <div
          className="relative mx-auto aspect-[3/4] overflow-hidden rounded-2xl shadow-soft lg:mx-0"
          style={{ width: "min(100%, 20rem, calc(58svh * 0.75))", transform: photo.mirrored ? "scaleX(-1)" : undefined }}
        >
          <img src={photo.url} alt="Foto yang dianalisis" className="h-full w-full object-cover" />
          {marks && showMarks && <LandmarkOverlay marks={marks} rows={rows} />}
          {marks && (
            <div
              data-scan
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 opacity-0"
            >
              <div className="h-6" style={{ background: "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--rose) 45%, transparent))" }} />
              <div className="h-0.5 bg-rose" />
            </div>
          )}
        </div>
        {marks && (
          <div data-rise className="mx-auto mt-3 opacity-0 lg:mx-0" style={{ width: "min(100%, 20rem)" }}>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-navy">
              <input
                type="checkbox"
                checked={showMarks}
                onChange={(e) => setShowMarks(e.target.checked)}
                className="h-4 w-4 accent-burgundy"
              />
              Tampilkan garis pembanding
            </label>
            <p className="mt-1 text-sm leading-relaxed text-olive">
              Garis penuh menunjukkan posisi alis, mata, dan sudut mulut Anda. Garis putus-putus adalah acuan sejajar.
            </p>
          </div>
        )}
      </div>

      {/* Isi */}
      <div className="max-w-xl">
        <ResultScale index={o.index} />

        <h1
          ref={title}
          className="invisible mt-6 font-display text-3xl leading-[1.12] tracking-[-0.03em] text-balance text-navy sm:text-4xl lg:text-[2.6rem]"
        >
          {o.headline}
        </h1>

        <p data-rise className="mt-5 text-lg leading-relaxed text-navy opacity-0">
          {o.lead}
        </p>
        {summary && (
          <p data-rise className="mt-2 text-base font-medium text-navy opacity-0">
            {summary}
          </p>
        )}
        <p data-rise className="mt-3 text-base leading-relaxed text-olive opacity-0">
          {o.note}
        </p>

        <div data-rise className="mt-6 border-l-2 border-rose pl-4 text-base leading-relaxed text-navy opacity-0">
          <span className="font-semibold">Saran. </span>
          {o.advice}
        </div>

        <p data-rise className="mt-5 text-sm leading-relaxed text-navy opacity-0">
          <span className="font-semibold">Segera cari pertolongan medis darurat</span> bila wajah berubah mendadak dan
          disertai kelemahan pada lengan atau tungkai, sulit berbicara, pusing hebat, atau gangguan penglihatan.
        </p>

        <div data-rise className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 opacity-0">
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-cta transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            {o.primary}
          </button>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center text-base font-semibold text-navy underline underline-offset-4 transition hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Kembali ke beranda
          </Link>
        </div>

        <details data-rise className="group mt-8 opacity-0">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 py-1 text-sm font-semibold text-navy underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            Penjelasan lebih lengkap
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-4 space-y-5 border-t border-navy/10 pt-4 text-base leading-relaxed text-olive">
            <div>
              <p className="font-semibold text-navy">Bagaimana sistem menilai?</p>
              <p className="mt-1">
                FaciCheck mengenali beberapa titik penting pada wajah, kemudian membandingkan sisi kiri dan kanan. Hasil
                perbandingan tersebut digunakan untuk menghasilkan skor skrining.
              </p>
              {score !== null && (
                <p className="mt-2">
                  Skor skrining untuk foto ini: <span className="font-semibold text-navy">{score} dari 100</span>. Skor
                  ini hanya membantu memberikan gambaran awal, bukan ukuran pasti apakah seseorang mengalami Bell’s
                  palsy atau tidak.
                </p>
              )}
            </div>
            <div>
              <p className="font-semibold text-navy">Seberapa akurat hasil ini?</p>
              <p className="mt-1">
                Dalam pengujian, sistem masih dapat memberikan hasil yang keliru. Sistem dapat melewatkan sebagian
                kondisi atau memberikan tanda pada orang yang sebenarnya tidak mengalaminya.
              </p>
              <p className="mt-2">
                Karena itu, hasil FaciCheck hanya merupakan informasi awal dan tidak menggantikan pemeriksaan dokter.
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}