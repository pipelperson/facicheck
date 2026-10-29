import { Check, X } from "lucide-react";

type Pose = "tepat" | "menoleh" | "tersenyum";

const POSES: { pose: Pose; label: string; ok: boolean }[] = [
  { pose: "tepat", label: "Tepat", ok: true },
  { pose: "menoleh", label: "Menoleh", ok: false },
  { pose: "tersenyum", label: "Tersenyum", ok: false },
];

const line = {
  fill: "none",
  stroke: "var(--navy)",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const DOTS: [number, number, number][] = [
  [47, 58, 0],
  [73, 58, 0.5],
  [60, 76, 1],
  [60, 90, 1.5],
];

function Face({ pose }: { pose: Pose }) {
  const turned = pose === "menoleh";
  const smile = pose === "tersenyum";
  return (
    <svg viewBox="0 0 120 150" className="h-auto w-full" aria-hidden="true">
      <path {...line} strokeOpacity=".55" d="M18 150C22 130 44 122 52 118V106M68 106V118C76 122 98 130 102 150" />
      <ellipse {...line} cx="60" cy="62" rx="34" ry="44" fill="var(--card)" fillOpacity=".6" />
      {pose === "tepat" && (
        <line x1="60" y1="14" x2="60" y2="112" stroke="var(--burgundy)" strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="4 5" />
      )}
      <g transform={turned ? "translate(14 0) translate(60 0) scale(.86 1) translate(-60 0)" : undefined}>
        <path {...line} d="M40 48Q47 44 54 46M66 46Q73 44 80 48" />
        {smile ? (
          <path {...line} strokeWidth="2.2" d="M41 59Q47 53 53 59M67 59Q73 53 79 59" />
        ) : (
          <>
            <path {...line} strokeWidth="2.2" d="M41 58Q47 53 53 58Q47 62 41 58ZM67 58Q73 53 79 58Q73 62 67 58Z" />
            <circle cx="47" cy="58" r="2.2" fill="var(--navy)" />
            <circle cx="73" cy="58" r="2.2" fill="var(--navy)" />
          </>
        )}
        <path {...line} strokeWidth="2.2" d="M60 60L57 76Q60 79 63 76" />
        <path {...line} d={smile ? "M45 86Q60 101 75 86" : "M50 90Q60 92 70 90"} />
      </g>
      {pose === "tepat" &&
        DOTS.map(([x, y, d]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--burgundy)" className="animate-pulse-dot" style={{ animationDelay: `${d}s` }} />
        ))}
    </svg>
  );
}

export function PoseExamples() {
  return (
    <div>
      <p className="text-sm font-semibold tracking-[0.14em] text-burgundy">CONTOH POSISI</p>
      <ul className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">
        {POSES.map(({ pose, label, ok }) => (
          <li key={pose}>
            <figure className="flex flex-col items-center gap-3">
              <div className={`w-full rounded-2xl border p-2 sm:p-3 ${ok ? "border-burgundy/40 bg-card/70" : "border-navy/10 bg-card/40"}`}>
                <Face pose={pose} />
              </div>
              <figcaption className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full ${ok ? "bg-burgundy text-primary-foreground" : "border border-navy/30 text-navy"}`}
                >
                  {ok ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
                </span>
                <span className="sr-only">{ok ? "Contoh yang tepat: " : "Hindari: "}</span>
                {label}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm leading-relaxed text-olive">Foto akan diperiksa otomatis sebelum dianalisis.</p>
    </div>
  );
}