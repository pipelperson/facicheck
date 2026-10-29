import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/landing/Brand";

export function ScreeningHeader() {
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav
        aria-label="Navigasi skrining"
        className="glass mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5"
      >
        <Brand />
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-navy transition hover:bg-card/70 hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali
        </Link>
      </nav>
    </header>
  );
}