import { createFileRoute } from "@tanstack/react-router";
import { Awareness } from "@/components/landing/Awareness";
import { Navbar, NAV_LINKS } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Notice } from "@/components/landing/Notice";
import { FinalCta } from "@/components/landing/FinalCta";
import { Brand } from "@/components/landing/Brand";
import { Backdrop } from "@/components/landing/Backdrop";
import { Waves } from "@/components/landing/Waves";

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
      <Backdrop />
      <Waves />

      <Navbar />
      <main>
        <Hero />

        <section
          id="tentang"
          aria-labelledby="tentang-title"
          className="px-5 py-24 lg:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <Awareness />
          </div>
        </section>

        <HowItWorks />
        <Notice />
        <FinalCta />
      </main>

      <footer className="px-5 pt-6 pb-10">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1.4fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy">
              Prototipe web skrining awal kemungkinan asimetri wajah melalui analisis visual.
            </p>
            <p className="mt-4 inline-block rounded-md bg-card/70 px-2.5 py-1 text-xs font-semibold text-navy">
              Prototipe Akademik
            </p>
          </div>
          <nav aria-label="Navigasi footer">
            <p className="text-sm font-semibold text-navy">Navigasi</p>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm font-medium text-navy underline-offset-4 hover:text-burgundy hover:underline"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-sm leading-relaxed text-navy">
            <span className="font-semibold">Disclaimer: </span>
            FaciCheck bukan alat diagnosis medis dan tidak menggantikan pemeriksaan tenaga kesehatan profesional.
          </p>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-xs text-navy">
          © {new Date().getFullYear()} FaciCheck. Prototipe akademik.
        </p>
      </footer>    
    </div>
  );
}