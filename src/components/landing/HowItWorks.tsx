import { useEffect, useRef, useState } from "react";
import { BookOpenCheck, Camera, ScanFace, FileText } from "lucide-react";

const STEPS = [
  { icon: BookOpenCheck, title: "Persiapkan", text: "Baca petunjuk pengambilan gambar: pencahayaan cukup, wajah menghadap lurus ke kamera, dan ekspresi netral." },
  { icon: Camera, title: "Ambil Gambar", text: "Izinkan akses kamera, lalu ambil foto wajah sesuai panduan yang ditampilkan di layar." },
  { icon: ScanFace, title: "Analisis Wajah", text: "Gambar dikirim untuk diproses secara visual oleh layanan analisis, apabila layanan tersebut tersedia." },
  { icon: FileText, title: "Pahami Hasil", text: "Baca informasi skrining yang diberikan beserta keterbatasannya, lalu putuskan langkah selanjutnya." },
];

function StepCard({ i, active }: { i: number; active: boolean }) {
  const S = STEPS[i]!;
  return (
    <article
      className={`rounded-3xl border bg-card p-7 transition-all duration-500 ${active ? "scale-100 border-primary/30 opacity-100 shadow-soft" : "scale-[0.97] border-border opacity-70"}`}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-burgundy"><S.icon className="h-6 w-6" /></span>
        <span className="text-4xl font-extrabold text-rose/60">0{i + 1}</span>
      </div>
      <h3 className="mt-6 text-xl font-bold text-navy">{S.title}</h3>
      <p className="mt-2 leading-relaxed text-olive">{S.text}</p>
    </article>
  );
}

export function HowItWorks() {
  const wrap = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      setProgress(Math.min(1, Math.max(0, -r.top / (total || 1))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length));

  const header = (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold tracking-[0.18em] text-burgundy">CARA KERJA</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Bagaimana Cara Kerjanya?</h2>
      <p className="mt-4 text-lg text-olive">Empat langkah sederhana, dari persiapan hingga memahami informasi skrining.</p>
    </div>
  );

  return (
    <section id="cara-kerja" aria-labelledby="cara-kerja-title">
      {/* Desktop: horizontal storytelling */}
      <div ref={wrap} className="relative hidden h-[260vh] lg:-my-12 lg:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div id="cara-kerja-title">{header}</div>
            <div className="relative mt-12 h-1 rounded-full bg-border">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
              {STEPS.map((_, i) => (
                <span key={i} className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 transition-colors ${i <= active ? "border-primary bg-primary" : "border-border bg-card"}`} style={{ left: `calc(${(i / (STEPS.length - 1)) * 100}% - 8px)` }} />
              ))}
            </div>
          </div>
          <div className="mx-auto mt-10 w-full max-w-6xl px-6">
            <div className="flex gap-6 transition-transform duration-300 ease-out" style={{ transform: `translateX(-${progress * 30}%)` }}>
              {STEPS.map((_, i) => (
                <div key={i} className="w-[380px] shrink-0">
                  <StepCard i={i} active={i === active} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/tablet: vertical timeline */}
      <div className="mx-auto max-w-2xl px-5 py-12 lg:hidden">
        {header}
        <ol className="relative mt-10 space-y-6 border-l-2 border-rose/40 pl-6">
          {STEPS.map((_, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[33px] top-8 h-4 w-4 rounded-full border-2 border-primary bg-card" />
              <StepCard i={i} active />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
