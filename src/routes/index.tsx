import { createFileRoute } from "@tanstack/react-router";
// import { ArrowRight, Compass, ScanFace, MessageSquareText, ShieldAlert } from "lucide-react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Awareness } from "@/components/landing/Awareness";
import { Navbar, CtaButton, NAV_LINKS } from "@/components/landing/Navbar";
import { FaceIllustration } from "@/components/landing/FaceIllustration";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Reveal } from "@/components/landing/Reveal";
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

const DISCLAIMER =
  "FaciCheck merupakan prototipe skrining awal dan bukan alat diagnosis medis. Hasil analisis tidak dapat memastikan ada atau tidaknya Bell’s palsy dan tidak menggantikan pemeriksaan tenaga kesehatan profesional. Jika mengalami perubahan wajah secara mendadak, terutama disertai kelemahan anggota tubuh, gangguan bicara, atau gejala neurologis lainnya, segera cari pertolongan medis darurat.";

function Index() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        {/* HERO */}
        <section
          id="beranda"
          className="relative px-5 pt-28 pb-12 sm:pt-32 lg:pb-16"
        >
          <div
            className="pointer-events-none absolute top-20 -left-32 h-96 w-96 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--sage) 22%, transparent), transparent)",
            }}
          />
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-10">
            {/* KIRI: Fakta */}
            <Reveal delay={150} className="order-2 lg:order-1">
              <span
                aria-hidden="true"
                className="block h-0.5 w-10 rounded-full bg-burgundy"
              />
              <p className="mt-5 flex items-baseline gap-2 font-extrabold tracking-tighter text-navy tabular-nums">
                <span className="text-6xl leading-none xl:text-7xl">1</span>
                <span className="text-base font-semibold tracking-normal text-olive">
                  dari
                </span>
                <span className="text-6xl leading-none xl:text-7xl">60</span>
              </p>
              <p className="mt-4 max-w-[15rem] text-base leading-relaxed text-pretty text-olive">
                perkiraan risiko seseorang mengalami Bell’s palsy sepanjang
                hidupnya.
              </p>
            </Reveal>

            {/* TENGAH: Visual */}
            <Reveal className="order-1 lg:order-2">
              <FaceIllustration />
            </Reveal>

            {/* KANAN: Copy + CTA */}
            <Reveal delay={300} className="order-3">
              <p className="inline-block rounded-md bg-accent px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-burgundy">
                SKRINING AWAL WAJAH
              </p>
              <h1 className="mt-5 text-3xl leading-[1.15] font-bold tracking-tight text-balance text-navy xl:text-4xl">
                Bagaimana jika perubahan itu{" "}
                <span className="text-burgundy">terlihat lebih awal?</span>
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-olive sm:text-lg">
                FaciCheck membantu Anda mengamati kemungkinan asimetri wajah
                melalui skrining visual yang sederhana.
              </p>
              <div className="mt-7">
                <CtaButton className="px-7 py-4 text-base">
                  Mulai Skrining <ArrowRight className="h-5 w-5" />
                </CtaButton>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm font-medium text-olive">
                <ShieldAlert className="h-4 w-4 text-burgundy" /> Bukan alat
                diagnosis medis.
              </p>
            </Reveal>
          </div>
        </section>

        {/* TENTANG */}
        <section
          id="tentang"
          aria-labelledby="tentang-title"
          className="px-5 py-12 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <Awareness />
          </div>
        </section>



        <HowItWorks />

        {/* DISCLAIMER */}
        <section aria-labelledby="disclaimer-title" className="px-5 py-10">
          <Reveal className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-5 rounded-3xl border border-rose/40 bg-card p-8 sm:flex-row sm:p-10">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-burgundy">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <h2
                  id="disclaimer-title"
                  className="text-xl font-bold text-navy"
                >
                  Catatan Medis Penting
                </h2>
                <p className="mt-3 text-base leading-relaxed text-navy/85 sm:text-lg">
                  {DISCLAIMER}
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FINAL CTA */}
        <section id="mulai" className="px-5 py-12">
          <Reveal className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-secondary px-8 py-16 text-center sm:px-16">
              <div
                className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, color-mix(in oklab, var(--rose) 35%, transparent), transparent)",
                }}
              />
              <div
                className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, color-mix(in oklab, var(--sage) 28%, transparent), transparent)",
                }}
              />
              <h2 className="relative text-3xl font-bold tracking-tight text-secondary-foreground sm:text-4xl">
                Mulai dengan Memahami Prosesnya.
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-lg text-secondary-foreground/80">
                Luangkan waktu sejenak untuk membaca petunjuk pengambilan gambar
                sebelum memulai, agar hasil skrining lebih bermakna.
              </p>
              <div className="relative mt-8">
                <CtaButton className="px-8 py-4 text-base">
                  Mulai Skrining <ArrowRight className="h-5 w-5" />
                </CtaButton>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1.4fr]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-olive">
              Prototipe web skrining awal kemungkinan asimetri wajah melalui
              analisis visual.
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
                  <a
                    href={l.href}
                    className="text-sm text-olive hover:text-burgundy"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-sm leading-relaxed text-olive">
            <span className="font-semibold text-navy">Disclaimer: </span>
            FaciCheck bukan alat diagnosis medis dan tidak menggantikan
            pemeriksaan tenaga kesehatan profesional.
          </p>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-xs text-olive">
          © {new Date().getFullYear()} FaciCheck. Prototipe akademik.
        </p>
      </footer>
    </div>
  );
}
