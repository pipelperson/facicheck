import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "./Brand";

export const NAV_LINKS = [
  { href: "#beranda", label: "Beranda" },
  { href: "#tentang", label: "Tentang" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#catatan", label: "Catatan" },
];

// "mulai" ikut dipantau supaya saat di penutup tidak ada link yang menyala keliru
const TRACKED_IDS = [...NAV_LINKS.map((l) => l.href.slice(1)), "mulai"];
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function CtaButton({ children = "Mulai Skrining", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <a
      href="#mulai"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-cta transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.97] ${focus} ${className}`}
    >
      {children}
    </a>
  );
}

const linkBase = `relative inline-block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 active:scale-[0.97] lg:px-4 after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:origin-left after:rounded-full after:transition-transform after:duration-300 lg:after:inset-x-4 ${focus}`;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("#beranda");
  const lockUntil = useRef(0);

  useEffect(() => {
    const els = TRACKED_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return;
        for (const e of entries) if (e.isIntersecting) setCurrent(`#${e.target.id}`);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (href: string) => {
    lockUntil.current = Date.now() + 1500; // cegah indikator loncat saat auto-scroll
    setCurrent(href);
    setOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav aria-label="Navigasi utama" className="glass mx-auto max-w-6xl rounded-2xl px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => {
              const isActive = current === l.href;
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => go(l.href)}
                    aria-current={isActive ? "location" : undefined}
                    className={`${linkBase} ${
                      isActive
                        ? "font-semibold text-burgundy after:scale-x-100 after:bg-burgundy"
                        : "text-navy/80 after:scale-x-0 after:bg-rose hover:bg-card/70 hover:text-navy hover:after:scale-x-100"
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
            <CtaButton />
          </div>
          <button
            type="button"
            className={`grid h-10 w-10 place-items-center rounded-lg text-navy md:hidden ${focus}`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <ul id="mobile-menu" className="mt-3 flex flex-col gap-1 border-t border-border/60 pt-3 md:hidden">
            {NAV_LINKS.map((l) => {
              const isActive = current === l.href;
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => go(l.href)}
                    aria-current={isActive ? "location" : undefined}
                    className={`block rounded-lg px-3 py-3 text-base font-medium transition-colors ${focus} ${
                      isActive ? "bg-accent font-semibold text-burgundy" : "text-navy hover:bg-card/70"
                    }`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
            <li className="pt-2 pb-1" onClick={() => setOpen(false)}>
              <CtaButton className="w-full" />
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}