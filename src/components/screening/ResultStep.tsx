import { Link } from "@tanstack/react-router";
import { Camera, ChevronDown } from "lucide-react";
import {
  LAMP_COLORS,
  LEVEL_TEXT,
  RELIABILITY,
  ZONES,
  ZONE_LABELS,
  readAreas,
  summarizeAreas,
  type AreaReading,
} from "@/lib/result-copy";
import type { CapturedPhoto, SuccessOutcome } from "@/lib/screening";

function Lamps({ index }: { index: number }) {
  return (
    <ol aria-label="Lampu hasil" className="mt-6 flex max-w-xl items-start gap-4 sm:gap-10">
      {ZONE_LABELS.map((label, i) => {
        const on = i === index;
        return (
          <li key={label} aria-current={on ? "true" : undefined} className="flex flex-1 flex-col items-center gap-2 text-center">
            <span aria-hidden="true" className="relative grid h-14 w-14 place-items-center">
              {on && <span className="absolute inset-0 rounded-full opacity-25" style={{ background: LAMP_COLORS[i] }} />}
              <span
                className={`rounded-full transition-all duration-500 ${on ? "h-9 w-9" : "h-6 w-6 opacity-30"}`}
                style={{ background: LAMP_COLORS[i] }}
              />
            </span>
            <span className={`text-sm font-semibold sm:text-base ${on ? "text-navy" : "text-olive"}`}>
              {label}
              {on && <span className="sr-only"> (hasil Anda)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AreaRow({ r }: { r: AreaReading }) {
  return (
    <li className="flex items-start gap-4 py-3">
      <span aria-hidden="true" className="flex gap-1 pt-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-2 w-6 rounded-full ${i <= r.level ? "" : "bg-navy/15"}`}
            style={i <= r.level ? { background: LAMP_COLORS[r.level] } : undefined}
          />
        ))}
      </span>
      <div>
        <p className="text-base font-semibold text-navy">
          {r.name}: <span className="font-medium">{LEVEL_TEXT[r.level]}</span>
        </p>
        <p className="text-sm text-olive">{r.what}</p>
      </div>
    </li>
  );
}

const NEXT_STEPS = [
  "Temui dokter umum atau dokter saraf untuk pemeriksaan langsung.",
  "Catat kapan perubahan mulai terasa dan gejala lain yang menyertai.",
  "Ceritakan hasil skrining ini kepada dokter sebagai informasi awal.",
];

export function ResultStep({ photo, result, onRetake }: { photo: CapturedPhoto; result: SuccessOutcome; onRetake: () => void }) {
  const zone = ZONES[result.code];
  const rows = readAreas(result.metrics);
  const summary = summarizeAreas(result.code, rows);
  const score = result.probability === null ? null : Math.round(Math.min(100, Math.max(0, result.probability)));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:gap-14">
      <div className="lg:self-start">
        <img
          src={photo.url}
          alt="Foto yang dianalisis"
          className="mx-auto aspect-[3/4] w-48 rounded-2xl object-cover shadow-soft lg:mx-0 lg:w-56"
          style={{ transform: photo.mirrored ? "scaleX(-1)" : undefined }}
        />
      </div>

      <div>
        <p className="text-sm font-semibold tracking-[0.14em] text-burgundy">HASIL SKRINING AWAL</p>
        <h1 className="mt-3 font-display text-3xl leading-[1.1] tracking-[-0.03em] text-balance text-navy sm:text-4xl lg:text-[2.75rem]">
          {zone.title}
        </h1>

        <Lamps index={zone.index} />

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy">{zone.text}</p>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-olive">
          Hasil ini bukan diagnosis dan tidak menggantikan pemeriksaan dokter.
        </p>

        {/* Bagian wajah yang diperiksa */}
        <div className="mt-8 max-w-xl">
          <p className="text-base font-semibold text-navy sm:text-lg">Bagian wajah yang diperiksa</p>
          <p className="mt-2 text-base leading-relaxed text-olive">
            Sistem membandingkan sisi kiri dan kanan wajah Anda pada tiga bagian: alis, mata, dan sudut mulut. Semakin
            besar perbedaannya, semakin besar kemungkinan ada kelemahan otot wajah di satu sisi, seperti pada Bell’s palsy.
          </p>
          {rows.length > 0 && (
            <>
              <ul className="mt-3 divide-y divide-navy/10 border-y border-navy/10">
                {rows.map((r) => (
                  <AreaRow key={r.key} r={r} />
                ))}
              </ul>
              {summary && <p className="mt-3 text-base font-medium text-navy">{summary}</p>}
            </>
          )}
        </div>

        <div className="mt-8 max-w-xl">
          <p className="text-base font-semibold text-navy sm:text-lg">Langkah selanjutnya</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-relaxed text-olive marker:font-semibold marker:text-burgundy">
            {NEXT_STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="mt-8 max-w-xl border-l-2 border-burgundy pl-4">
          <p className="text-base font-semibold text-navy">Tanda yang perlu pertolongan darurat</p>
          <p className="mt-1 text-base text-olive">Jika wajah berubah mendadak, terutama disertai:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-navy">
            <li>Kelemahan pada lengan atau tungkai</li>
            <li>Gangguan bicara</li>
            <li>Gejala saraf lainnya, seperti pusing hebat atau penglihatan kabur</li>
          </ul>
          <p className="mt-3 text-base font-semibold text-navy">Segera cari pertolongan medis darurat.</p>
        </div>

        <details className="group mt-8 max-w-xl border-t border-navy/10 pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2 text-base font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            Penjelasan lebih lengkap
            <ChevronDown className="h-5 w-5 transition group-open:rotate-180" aria-hidden="true" />
          </summary>

          <div className="mt-3 space-y-6 text-base leading-relaxed text-olive">
            <div>
              <p className="font-semibold text-navy">Bagaimana sistem menilai?</p>
              <p className="mt-1">
                Sistem mencari titik-titik penting di wajah Anda, lalu membandingkan sisi kiri dan kanan. Hasilnya
                dicocokkan dengan pola dari lebih dari seribu foto yang pernah dipelajari sistem.
              </p>
              {score !== null && (
                <p className="mt-2">
                  Skor sistem untuk foto ini: <span className="font-semibold text-navy">{score} dari 100</span>. Makin
                  tinggi skornya, makin besar kecenderungan adanya tanda Bell’s palsy. Skor ini bukan angka kepastian.
                </p>
              )}
            </div>

            <div>
              <p className="font-semibold text-navy">Seberapa bisa dipercaya?</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {RELIABILITY.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="mt-2">
                Artinya sistem bisa keliru: kadang melewatkan orang yang sakit, kadang mengira orang sehat memiliki
                tanda. Karena itu hasil ini hanya gambaran awal dan tidak menggantikan pemeriksaan dokter.
              </p>
            </div>
          </div>
        </details>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-cta transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            Ulangi Skrining
          </button>
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-navy/20 px-7 py-3 text-base font-semibold text-navy transition hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}