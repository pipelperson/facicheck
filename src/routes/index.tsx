import { createFileRoute } from "@tanstack/react-router";
import { Awareness } from "@/components/landing/Awareness";
import { Navbar, NAV_LINKS } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Notice } from "@/components/landing/Notice";
import { FinalCta } from "@/components/landing/FinalCta";
import { ScrollTrail } from "@/components/landing/ScrollTrail";
import { Brand } from "@/components/landing/Brand";

const TITLE = "FaciCheck — Skrining Awal Perubahan Wajah";
const DESC =
  "Prototipe web untuk skrining awal indikasi Bell's palsy melalui analisis visual wajah. Bukan alat diagnosis medis.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-background">
      {/* Lapisan background gradient lembut */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[130svh]"
        style={{
          background:
            "radial-gradient(60% 45% at 88% 6%, color-mix(in oklab, var(--rose) 24%, transparent), transparent 70%), radial-gradient(45% 40% at 2% 24%, color-mix(in oklab, var(--sage) 18%, transparent), transparent 70%), radial-gradient(50% 35% at 62% 72%, color-mix(in oklab, var(--skin) 26%, transparent), transparent 70%)",
        }}
      />

      <Navbar />
      <main>
        <Hero />

        <section id="tentang" aria-labelledby="tentang-title" className="px-5 py-24 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <Awareness />
          </div>
        </section>

        <HowItWorks />
        <Notice />
        <FinalCta />
      </main>

      <footer className="border-t border-border px-5 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1.4fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-olive">
              Prototipe web skrining awal kemungkinan asimetri wajah melalui analisis visual.
            </p>
            <p className="mt-4 inline-block rounded-md bg-sage/25 px-2.5 py-1 text-xs font-semibold text-olive">
              Prototipe Akademik
            </p>
          </div>
          <nav aria-label="Navigasi footer">
            <p className="text-sm font-semibold text-navy">Navigasi</p>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-olive hover:text-burgundy">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-sm leading-relaxed text-olive">
            <span className="font-semibold text-navy">Disclaimer: </span>
            FaciCheck bukan alat diagnosis medis dan tidak menggantikan pemeriksaan tenaga kesehatan profesional.
          </p>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-xs text-olive">
          © {new Date().getFullYear()} FaciCheck. Prototipe akademik.
        </p>
      </footer>

      {/* Taruh paling akhir: trigger-nya harus dihitung setelah semua section & pin */}
      <ScrollTrail />
    </div>
  );
}