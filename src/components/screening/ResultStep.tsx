import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, Check, ChevronDown } from "lucide-react";
import { gsap, revealLines, showNow, useGSAP } from "@/lib/motion";
import { LAMP_COLORS, ZONE_LABELS, readAreas, type AreaReading, type MetricKey } from "@/lib/result-copy";
import type { CapturedPhoto, Landmarks, Pt, RiskCode, SuccessOutcome } from "@/lib/screening";

const GOOD = "#5DBB8A";
const TINTS = ["rgba(163,165,126,0.3)", "rgba(186,151,150,0.3)", "rgba(147,77,86,0.3)"] as const;
const ZONE_WIDTHS = [35, 30, 35] as const; // sesuai batas backend: 0–35, 35–65, 65–100
const LEVEL_SHORT = ["Seimbang", "Sedikit berbeda", "Jelas berbeda"] as const;

const COPY: Record<
  RiskCode,
  { index: number; headline: string; lead: string; note: string; advice: string; primary: string }
> = {
  NORMAL: {
    index: 0,
    headline: "Wajah tampak cukup seimbang.",
    lead: "Sisi kiri dan kanan wajah Anda terlihat cukup seimbang.",
    note: "Gambaran awal dari foto, bukan diagnosis dan bukan jaminan sehat.",
    advice:
      "Jika tidak ada keluhan, Anda bisa kembali ke beranda. Jika masih merasa ada perubahan pada wajah, periksakan diri ke tenaga kesehatan.",
    primary: "Ulangi skrining",
  },
  MODERATE_RISK: {
    index: 1,
    headline: "Hasilnya belum cukup jelas.",
    lead: "Sistem belum bisa menilai dengan pasti, bisa karena posisi wajah, cahaya, atau kualitas foto.",
    note: "Ini bukan diagnosis medis.",
    advice:
      "Coba ulangi dengan wajah lurus dan cahaya yang cukup. Jika masih merasa ada perubahan pada wajah, periksakan diri ke tenaga kesehatan.",
    primary: "Ambil ulang foto",
  },
  HIGH_RISK: {
    index: 2,
    headline: "Terlihat adanya perbedaan pada wajah.",
    lead: "Sisi kiri dan kanan wajah Anda terlihat berbeda.",
    note: "Ini belum berarti Bell’s palsy, hanya gambaran awal dari foto.",
    advice:
      "Sebaiknya konsultasikan hasil ini ke tenaga kesehatan. Bila perubahan baru terjadi atau ada keluhan lain, segera periksakan diri.",
    primary: "Ulangi skrining",
  },
};

const TILES: { key: MetricKey; name: string }[] = [
  { key: "brow_asymmetry", name: "Alis" },
  { key: "eye_asymmetry", name: "Mata" },
  { key: "mouth_tilt", name: "Mulut" },
];

/** Syarat yang diperiksa gerbang kualitas backend. Foto yang sampai ke hasil pasti sudah lolos semuanya. */
const CHECKS = [
  "Satu wajah terlihat",
  "Posisi dan ukuran wajah tepat",
  "Wajah menghadap lurus",
  "Cahaya cukup",
  "Foto tajam",
  "Ekspresi netral",
];

/* ---------- Skor ---------- */

function ScorePanel({ score, index, markerPct }: { score: number | null; index: number; markerPct: number }) {
  return (
    <section aria-labelledby="skor-title" className="rounded-3xl border border-navy/10 bg-card/70 p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="skor-title" className="text-sm font-semibold text-olive">
            Skor skrining
          </h2>
          <p className="mt-1 flex items-baseline gap-1.5 font-display text-navy tabular-nums">
            <span data-score className="text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
              {score ?? "–"}
            </span>
            <span className="text-lg text-olive">/ 100</span>
          </p>
        </div>
        <p className="max-w-[10.5rem] text-right text-xs leading-snug text-olive">Bukan peluang pasti, hanya gambaran awal.</p>
      </div>

      <div className="relative mt-5">
        <div className="flex gap-[3px]" aria-hidden="true">
          {ZONE_WIDTHS.map((w, i) => (
            <span
              key={i}
              className="h-2.5 rounded-full"
              style={{ width: `${w}%`, background: i === index ? LAMP_COLORS[i] : TINTS[i] }}
            />
          ))}
        </div>
        <span
          data-marker
          aria-hidden="true"
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-soft"
          style={{ left: `${markerPct}%`, background: LAMP_COLORS[index] }}
        />
      </div>

      <ol aria-label={`Tingkat hasil: ${ZONE_LABELS[index]}`} className="mt-2 flex gap-[3px]">
        {ZONE_LABELS.map((label, i) => (
          <li
            key={label}
            aria-current={i === index ? "true" : undefined}
            style={{ width: `${ZONE_WIDTHS[i]}%` }}
            className={`text-xs leading-snug sm:text-sm ${i === index ? "font-semibold text-navy" : "text-olive"}`}
          >
            {label}
            {i === index && <span className="sr-only"> (hasil Anda)</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Kartu bagian wajah ---------- */

function AreaIcon({ id }: { id: MetricKey }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      {id === "brow_asymmetry" && <path {...p} d="M2.5 13c2-3 5-4 8-3M13.5 10c3-1 6 0 8 3" />}
      {id === "eye_asymmetry" && (
        <>
          <path {...p} d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
          <circle {...p} cx="12" cy="12" r="2.6" />
        </>
      )}
      {id === "mouth_tilt" && <path {...p} d="M5 12h14M7.5 12c1.5-2.2 3-2.2 4.5-1.2 1.5-1 3-1 4.5 1.2" />}
    </svg>
  );
}

function AreaTiles({
  rows,
  onFocus,
}: {
  rows: AreaReading[];
  onFocus: (k: MetricKey | null) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-3">
      {TILES.map(({ key, name }) => {
        const row = rows.find((r) => r.key === key);
        return (
          <li
            key={key}
            tabIndex={0}
            onPointerEnter={() => onFocus(key)}
            onPointerLeave={() => onFocus(null)}
            onFocus={() => onFocus(key)}
            onBlur={() => onFocus(null)}
            className="rounded-2xl border border-navy/10 bg-card/60 p-3 transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-4"
          >
            <span className="text-navy">
              <AreaIcon id={key} />
            </span>
            <p className="mt-2 text-sm font-semibold text-navy sm:text-base">{name}</p>
            {row ? (
              <>
                <p className="mt-0.5 text-xs leading-snug text-olive sm:text-sm">{LEVEL_SHORT[row.level]}</p>
                <div className="mt-2 flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: i <= row.level ? LAMP_COLORS[row.level] : "rgba(53,68,91,0.12)" }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-olive sm:text-sm">
                <Check className="h-3.5 w-3.5" style={{ color: GOOD }} aria-hidden="true" />
                Diperiksa
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Daftar kualitas foto ---------- */

function QualityChecklist() {
  return (
    <section aria-labelledby="kualitas-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="kualitas-title" className="text-base font-semibold text-navy sm:text-lg">
          Kualitas foto
        </h2>
        <p className="text-sm text-olive">Semua terpenuhi</p>
      </div>
      <ul className="mt-2 grid border-t border-navy/10 md:grid-cols-2 md:gap-x-8">
        {CHECKS.map((c) => (
          <li
            key={c}
            className="flex items-center justify-between gap-3 border-b border-navy/10 py-2.5 text-base text-navy"
          >
            {c}
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: GOOD }}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                <path
                  data-tick
                  pathLength={1}
                  strokeDasharray={1}
                  d="M5 12.5l4.5 4.5L19 7.5"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="sr-only">terpenuhi</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Garis di foto ---------- */

/** Garis penuh = posisi sebenarnya. Garis putus-putus = acuan sejajar. */
function LandmarkOverlay({ marks, rows, focus }: { marks: Landmarks; rows: AreaReading[]; focus: MetricKey | null }) {
  const W = 300;
  const H = 400;
  const px = (p: Pt) => p[0] * W;
  const py = (p: Pt) => p[1] * H;
  const colorOf = (key: MetricKey) => {
    const level = rows.find((r) => r.key === key)?.level;
    return level === undefined ? "var(--rose)" : (LAMP_COLORS[level] ?? "var(--rose)");
  };
  const dim = (k: MetricKey) => ({ opacity: focus && focus !== k ? 0.18 : 1, transition: "opacity .2s" });
  const midX = ((marks.eye.left[0] + marks.eye.right[0] + marks.mouth.left[0] + marks.mouth.right[0]) / 4) * W;
  const pairs: { id: string; metric: MetricKey; color: string; a: Pt; b: Pt }[] = [
    { id: "brow", metric: "brow_asymmetry", color: colorOf("brow_asymmetry"), a: marks.brow.left, b: marks.brow.right },
    { id: "mouth", metric: "mouth_tilt", color: colorOf("mouth_tilt"), a: marks.mouth.left, b: marks.mouth.right },
  ];
  const eyeColor = colorOf("eye_asymmetry");
  const lids = [...marks.eye.leftLids, ...marks.eye.rightLids];
  const eyeY = ((marks.eye.left[1] + marks.eye.right[1]) / 2) * H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <line x1={midX} y1={H * 0.08} x2={midX} y2={H * 0.92} stroke="white" strokeOpacity=".6" strokeWidth="1" strokeDasharray="4 4" />

      {pairs.map((p) => {
        const midY = (py(p.a) + py(p.b)) / 2;
        return (
          <g key={p.id} style={dim(p.metric)}>
            <line x1={px(p.a)} y1={midY} x2={px(p.b)} y2={midY} stroke="white" strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="3 3" />
            <line data-line pathLength={1} strokeDasharray={1} x1={px(p.a)} y1={py(p.a)} x2={px(p.b)} y2={py(p.b)} stroke={p.color} strokeWidth="2.5" strokeLinecap="round" />
            <circle data-dot cx={px(p.a)} cy={py(p.a)} r="4" fill={p.color} stroke="white" strokeWidth="1.5" />
            <circle data-dot cx={px(p.b)} cy={py(p.b)} r="4" fill={p.color} stroke="white" strokeWidth="1.5" />
          </g>
        );
      })}

      <g style={dim("eye_asymmetry")}>
        <line x1={px(marks.eye.left)} y1={eyeY} x2={px(marks.eye.right)} y2={eyeY} stroke="white" strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="3 3" />
        {lids.length > 0 ? (
          <>
            {lids.map(([a, b], i) => (
              <line key={i} data-line pathLength={1} strokeDasharray={1} x1={px(a)} y1={py(a)} x2={px(b)} y2={py(b)} stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
            ))}
            <circle data-dot cx={px(marks.eye.left)} cy={py(marks.eye.left)} r="3.5" fill={eyeColor} stroke="white" strokeWidth="1.5" />
            <circle data-dot cx={px(marks.eye.right)} cy={py(marks.eye.right)} r="3.5" fill={eyeColor} stroke="white" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <line data-line pathLength={1} strokeDasharray={1} x1={px(marks.eye.left)} y1={py(marks.eye.left)} x2={px(marks.eye.right)} y2={py(marks.eye.right)} stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle data-dot cx={px(marks.eye.left)} cy={py(marks.eye.left)} r="4" fill={eyeColor} stroke="white" strokeWidth="1.5" />
            <circle data-dot cx={px(marks.eye.right)} cy={py(marks.eye.right)} r="4" fill={eyeColor} stroke="white" strokeWidth="1.5" />
          </>
        )}
      </g>
    </svg>
  );
}

/* ---------- Halaman ---------- */

export function ResultStep({ photo, result, onRetake }: { photo: CapturedPhoto; result: SuccessOutcome; onRetake: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [showMarks, setShowMarks] = useState(true);
  const [focus, setFocus] = useState<MetricKey | null>(null);

  const o = COPY[result.code];
  const rows = readAreas(result.metrics);
  const marks = result.landmarks;
  const score = result.probability === null ? null : Math.round(Math.min(100, Math.max(0, result.probability)));
  const markerPct = score === null ? [17.5, 50, 82.5][o.index] ?? 50 : Math.min(97, Math.max(3, score));

  const mouthRow = rows.find((r) => r.key === "mouth_tilt");
  const signed = result.metrics.mouth_tilt_signed;
  const directionNote =
    mouthRow && mouthRow.level >= 1 && signed !== null && signed !== 0
      ? signed > 0
        ? "Sudut bibir kiri Anda tampak lebih rendah."
        : "Sudut bibir kanan Anda tampak lebih rendah."
      : null;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (title.current) revealLines(title.current, { scroll: false, delay: 0.15 });
        gsap.fromTo(
          "[data-rise]",
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: 0.09, delay: 0.35 },
        );

        // skor menghitung naik, penanda bergeser ke posisinya
        const scoreEl = root.current?.querySelector("[data-score]");
        if (score !== null && scoreEl) {
          const counter = { v: 0 };
          scoreEl.textContent = "0";
          gsap.to(counter, {
            v: score,
            duration: 1.2,
            delay: 0.5,
            ease: "power2.out",
            onUpdate: () => {
              scoreEl.textContent = String(Math.round(counter.v));
            },
          });
          gsap.fromTo("[data-marker]", { left: "0%" }, { left: `${markerPct}%`, duration: 1.2, delay: 0.5, ease: "power3.out" });
        }

        // centang tergambar satu per satu
        gsap.fromTo("[data-tick]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.out", stagger: 0.12, delay: 1.0 });

        // garis scan menyapu foto sekali, lalu garis ukur tergambar
        if (marks) {
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
    <div ref={root} className="grid gap-y-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-x-16">
      {/* Foto: di HP paling atas, di laptop di kiri dan menempel saat di-scroll */}
      <div className="order-1 lg:order-none lg:col-start-1 lg:row-span-5 lg:row-start-1 lg:self-start">
        <div className="lg:sticky lg:top-8">
          <div
            className="relative mx-auto aspect-[3/4] overflow-hidden rounded-2xl shadow-soft lg:mx-0"
            style={{ width: "min(100%, 22rem, calc(58svh * 0.75))", transform: photo.mirrored ? "scaleX(-1)" : undefined }}
          >
            <img src={photo.url} alt="Foto yang dianalisis" className="h-full w-full object-cover" />
            {marks && showMarks && <LandmarkOverlay marks={marks} rows={rows} focus={focus} />}
            {marks && (
              <div data-scan aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 opacity-0">
                <div className="h-6" style={{ background: "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--rose) 45%, transparent))" }} />
                <div className="h-0.5 bg-rose" />
              </div>
            )}
          </div>
          {marks && (
            <div data-rise className="mx-auto mt-3 opacity-0 lg:mx-0" style={{ width: "min(100%, 22rem)" }}>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-navy">
                <input
                  type="checkbox"
                  checked={showMarks}
                  onChange={(e) => setShowMarks(e.target.checked)}
                  className="h-4 w-4 accent-burgundy"
                />
                Tampilkan garis pembanding
              </label>
              <p className="mt-1 text-xs leading-relaxed text-olive">Garis penuh: posisi Anda. Putus-putus: acuan sejajar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Judul */}
      <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-1">
        <h1
          ref={title}
          className="invisible font-display text-3xl leading-[1.1] tracking-[-0.03em] text-balance text-navy sm:text-4xl lg:text-[2.6rem]"
        >
          {o.headline}
        </h1>
        <p data-rise className="mt-4 text-lg leading-relaxed text-navy opacity-0">
          {o.lead}
        </p>
        <p data-rise className="mt-1.5 text-base leading-relaxed text-olive opacity-0">
          {o.note}
        </p>
      </div>

      {/* Skor: di HP tepat di bawah foto, di laptop di samping */}
      <div data-rise className="order-2 opacity-0 lg:order-none lg:col-start-2 lg:row-start-2">
        <ScorePanel score={score} index={o.index} markerPct={markerPct} />
      </div>

      {/* Bagian wajah */}
      <div data-rise className="order-4 opacity-0 lg:order-none lg:col-start-2 lg:row-start-3">
        <AreaTiles rows={rows} onFocus={setFocus} />
        {directionNote && <p className="mt-3 text-base font-medium text-navy">{directionNote}</p>}
      </div>

      {/* Kualitas foto */}
      <div data-rise className="order-5 opacity-0 lg:order-none lg:col-start-2 lg:row-start-4">
        <QualityChecklist />
      </div>

      {/* Saran, darurat, tombol */}
      <div className="order-6 lg:order-none lg:col-start-2 lg:row-start-5">
        <div data-rise className="border-l-2 border-rose pl-4 text-base leading-relaxed text-navy opacity-0">
          <span className="font-semibold">Saran. </span>
          {o.advice}
        </div>

        <p data-rise className="mt-5 text-sm leading-relaxed text-navy opacity-0">
          <span className="font-semibold">Segera cari pertolongan medis darurat</span> bila wajah berubah mendadak disertai
          lemah pada lengan atau tungkai, sulit bicara, pusing hebat, atau gangguan penglihatan.
        </p>

        <div data-rise className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 opacity-0">
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

        <details data-rise className="group mt-7 opacity-0">
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
            </div>
            <div>
              <p className="font-semibold text-navy">Seberapa akurat hasil ini?</p>
              <p className="mt-1">
                Dalam pengujian, sistem masih dapat memberikan hasil yang keliru. Sistem dapat melewatkan sebagian
                kondisi atau memberikan tanda pada orang yang sebenarnya tidak mengalaminya. Karena itu, hasil FaciCheck
                hanya merupakan informasi awal dan tidak menggantikan pemeriksaan dokter.
              </p>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}