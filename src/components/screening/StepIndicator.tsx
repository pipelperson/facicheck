import { Check } from "lucide-react";
import { STEP_LABELS } from "@/lib/screening";

export function StepIndicator({ current }: { current: number }) {
  const last = STEP_LABELS.length - 1;
  return (
    <nav aria-label="Langkah skrining">
      {/* Mobile */}
      <div className="sm:hidden">
        <p className="text-sm font-semibold text-navy">
          <span className="text-burgundy">
            Langkah {current + 1} dari {STEP_LABELS.length}
          </span>{" "}
          · {STEP_LABELS[current]}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {STEP_LABELS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= current ? "bg-burgundy" : "bg-navy/15"}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop */}
      <ol className="hidden items-center sm:flex">
        {STEP_LABELS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className={`flex items-center ${i < last ? "flex-1" : ""}`}>
              <span className="flex items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm font-semibold tabular-nums transition-colors duration-500 ${
                    done
                      ? "border-burgundy bg-burgundy text-primary-foreground"
                      : active
                        ? "border-burgundy text-burgundy"
                        : "border-navy/25 text-olive"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </span>
                <span className={`text-sm font-semibold ${done || active ? "text-navy" : "text-olive"}`}>{label}</span>
              </span>
              {i < last && (
                <span aria-hidden="true" className="mx-4 h-px flex-1 bg-navy/15">
                  <span
                    className={`block h-full origin-left bg-burgundy transition-transform duration-700 ${done ? "scale-x-100" : "scale-x-0"}`}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}