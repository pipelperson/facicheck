import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CameraOff, Check, Info, LoaderCircle, ScanFace, SwitchCamera, TriangleAlert, type LucideIcon } from "lucide-react";
import { useCamera, type CameraStatus } from "@/hooks/use-camera";
import { useLiveCheck } from "@/hooks/use-live-check";
import { capturePhoto } from "@/lib/capture";
import { REASON_MESSAGES, type CapturedPhoto, type FrameReason, type LiveState } from "@/lib/screening";
import { USE_SIMULATION, restartSimulation, setSimMode, type SimMode } from "@/lib/screeningApi";

const FRAME_W = "min(100%, 28rem, calc(72svh * 0.75))";

const NOTICES: Record<Exclude<CameraStatus, "ready">, { icon: LucideIcon; title: string; text: string; retry: boolean }> = {
  requesting: { icon: LoaderCircle, title: "Meminta izin kamera…", text: "Pilih “Izinkan” pada jendela yang muncul di browser.", retry: false },
  denied: {
    icon: CameraOff,
    title: "Akses kamera ditolak.",
    text: "FaciCheck hanya menerima foto langsung dari kamera. Izinkan akses kamera lewat ikon di bilah alamat browser, lalu coba lagi.",
    retry: true,
  },
  unavailable: {
    icon: CameraOff,
    title: "Kamera tidak ditemukan.",
    text: "Gunakan perangkat yang memiliki kamera. Foto tidak dapat diunggah dari galeri.",
    retry: true,
  },
  insecure: { icon: TriangleAlert, title: "Kamera memerlukan koneksi aman.", text: "Buka FaciCheck lewat alamat yang diawali https://.", retry: false },
  error: { icon: TriangleAlert, title: "Kamera tidak dapat dibuka.", text: "Tutup aplikasi lain yang sedang memakai kamera, lalu coba lagi.", retry: true },
};

function CameraNotice({ status, onRetry }: { status: Exclude<CameraStatus, "ready">; onRetry: () => void }) {
  const { icon: Icon, title, text, retry } = NOTICES[status];
  return (
    <div className="absolute inset-0 grid place-items-center bg-navy p-8 text-center text-secondary-foreground">
      <div>
        <Icon className={`mx-auto h-9 w-9 text-rose ${status === "requesting" ? "animate-spin" : ""}`} aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/85">{text}</p>
        {retry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
}

/** Oval panduan: putus-putus saat mencari wajah, rose saat perlu disesuaikan, sage tebal saat pas. */
function Guide({ state }: { state: LiveState }) {
  const stroke = state === "ready" ? "var(--sage)" : state === "adjust" ? "var(--rose)" : "rgba(255,255,255,0.85)";
  const t = "stroke .35s, stroke-width .35s, stroke-opacity .35s";
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <path fill="var(--navy)" fillOpacity=".38" fillRule="evenodd" d="M0 0H300V400H0Z M50 185a100 135 0 1 0 200 0a100 135 0 1 0 -200 0Z" />
      <ellipse cx="150" cy="185" rx="100" ry="135" fill="none" stroke="var(--sage)" strokeWidth="14" strokeOpacity={state === "ready" ? 0.28 : 0} style={{ transition: t }} />
      <ellipse
        cx="150"
        cy="185"
        rx="100"
        ry="135"
        fill="none"
        stroke={stroke}
        strokeWidth={state === "ready" ? 5 : 3.5}
        strokeDasharray={state === "searching" ? "9 9" : undefined}
        style={{ transition: t }}
      />
      <g stroke={stroke} strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="4 6" style={{ transition: t }}>
        <line x1="150" y1="60" x2="150" y2="310" />
        <line x1="85" y1="150" x2="215" y2="150" />
      </g>
    </svg>
  );
}

const TONE: Record<LiveState, { border: string; badge: string; icon: LucideIcon }> = {
  searching: { border: "border-navy/30", badge: "bg-navy/10 text-navy", icon: ScanFace },
  adjust: { border: "border-rose", badge: "bg-rose/30 text-navy", icon: Info },
  ready: { border: "border-sage", badge: "bg-sage/40 text-navy", icon: Check },
};

function LiveHint({ preparing, state, reason, stuck }: { preparing: boolean; state: LiveState; reason: FrameReason | null; stuck: boolean }) {
  const tone = TONE[preparing ? "searching" : state];
  const Icon = tone.icon;
  const text = preparing
    ? "Menyiapkan kamera…"
    : state === "ready"
      ? "Posisi pas. Tahan sebentar, lalu tekan tombol foto."
      : REASON_MESSAGES[reason ?? "tidak_ada_wajah"];
  return (
    <div role="status" aria-live="polite" className={`mt-6 border-l-2 pl-4 transition-colors duration-300 ${tone.border}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${tone.badge}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-lg leading-snug font-semibold text-navy">{text}</p>
      </div>
      {stuck && !preparing && state !== "ready" && (
        <p className="mt-2 pl-10 text-sm leading-relaxed text-olive">
          Sulit mendapat posisi pas? Anda tetap bisa mengambil foto, lalu sistem akan memeriksanya.
        </p>
      )}
    </div>
  );
}

const SIM_MODES: { mode: SimMode; label: string }[] = [
  { mode: "auto", label: "Otomatis" },
  { mode: "tidak_ada_wajah", label: "Tanpa wajah" },
  { mode: "menoleh", label: "Menoleh" },
  { mode: "senyum", label: "Senyum" },
  { mode: "ok", label: "Posisi pas" },
];

function SimBar() {
  const [active, setActive] = useState<SimMode>("auto");
  return (
    <div className="mt-8 border-t border-dashed border-navy/20 pt-4">
      <p className="text-xs font-semibold text-olive">Mode simulasi (hilang otomatis setelah backend terhubung)</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SIM_MODES.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            aria-pressed={active === mode}
            onClick={() => {
              setActive(mode);
              if (mode === "auto") restartSimulation();
              else setSimMode(mode);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active === mode ? "border-burgundy bg-burgundy text-primary-foreground" : "border-navy/25 text-navy hover:bg-card/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CameraStep({ onBack, onCaptured }: { onBack: () => void; onCaptured: (photo: CapturedPhoto) => void }) {
  const { videoRef, status, facing, canFlip, retry, flip } = useCamera();
  const ready = status === "ready";
  const live = useLiveCheck(videoRef, ready);
  const [countdownOn, setCountdownOn] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [stuck, setStuck] = useState(false);
  const mirrored = facing === "user";
  const counting = count !== null;

  useEffect(() => {
    restartSimulation();
  }, []);

  // jika posisi tak kunjung pas, tetap izinkan mengambil foto (pemeriksaan dilakukan di langkah berikutnya)
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setStuck(true), 12000);
    return () => window.clearTimeout(id);
  }, [ready]);

  const shoot = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 140);
    const photo = await capturePhoto(video, mirrored);
    if (photo) onCaptured(photo);
  }, [videoRef, mirrored, onCaptured]);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      setCount(null);
      void shoot();
      return;
    }
    const id = window.setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [count, shoot]);

  const canShoot = ready && !counting && (live.state === "ready" || stuck);
  const onShutter = () => {
    if (counting) setCount(null);
    else if (canShoot) {
      if (countdownOn) setCount(3);
      else void shoot();
    }
  };

  return (
    <div className="grid gap-x-16 gap-y-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
      {/* Judul */}
      <div>
        <h1 className="font-display text-3xl leading-[1.08] tracking-[-0.03em] text-balance text-navy sm:text-4xl lg:text-5xl">
          Posisikan wajah di dalam oval.
        </h1>
      </div>

      {/* Kamera */}
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="mx-auto" style={{ width: FRAME_W }}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-navy shadow-soft">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              aria-label="Pratinjau kamera"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
            />
            {ready ? <Guide state={live.state} /> : <CameraNotice status={status as Exclude<CameraStatus, "ready">} onRetry={retry} />}

            {count !== null && count > 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-navy/20" aria-hidden="true">
                <span key={count} className="animate-in font-display text-9xl text-white duration-300 fade-in zoom-in-50">
                  {count}
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-300" style={{ opacity: flash ? 0.7 : 0 }} aria-hidden="true" />
          </div>

          <div className="mt-5 grid grid-cols-3 items-center">
            <div />
            <button
              type="button"
              onClick={onShutter}
              disabled={!canShoot && !counting}
              aria-label={counting ? "Batalkan hitung mundur" : "Ambil foto"}
              aria-describedby="shutter-hint"
              className={`group mx-auto grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border-4 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${
                canShoot || counting ? "border-burgundy shadow-cta enabled:active:scale-95" : "cursor-not-allowed border-navy/20"
              }`}
            >
              <span
                className={`transition-all ${counting ? "h-6 w-6 rounded-md" : "h-12 w-12 rounded-full"} ${
                  canShoot || counting ? "bg-burgundy group-hover:brightness-110" : "bg-navy/20"
                }`}
              />
            </button>
            <div className="justify-self-end">
              {canFlip && ready && (
                <button
                  type="button"
                  onClick={flip}
                  disabled={counting}
                  aria-label="Ganti kamera"
                  title="Ganti kamera"
                  className="grid h-12 w-12 place-items-center rounded-full border border-navy/20 text-navy transition hover:bg-card/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
                >
                  <SwitchCamera className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <p id="shutter-hint" className="mt-3 text-center text-sm text-olive">
            {counting
              ? "Tahan posisi… tekan lagi untuk membatalkan."
              : canShoot
                ? live.state === "ready"
                  ? "Tekan tombol untuk mengambil foto."
                  : "Posisi belum pas, tetapi Anda tetap bisa mengambil foto."
                : "Tombol aktif saat posisi sudah pas."}
          </p>
        </div>
      </div>

      {/* Panduan langsung */}
      <div className="lg:col-start-1 lg:row-start-2">
        <LiveHint preparing={!ready} state={live.state} reason={live.reason} stuck={stuck} />

        <ul className="mt-8 space-y-2 text-base leading-relaxed text-olive">
          <li>Hadap lurus, ekspresi netral, mulut tertutup.</li>
          <li>Pegang kamera setinggi mata dan tahan dengan stabil.</li>
          <li>Cahaya dari depan wajah, bukan dari belakang.</li>
        </ul>

        <label className="mt-8 flex cursor-pointer items-center gap-3 py-1 text-base text-navy">
          <input
            type="checkbox"
            checked={countdownOn}
            onChange={(e) => setCountdownOn(e.target.checked)}
            className="h-5 w-5 shrink-0 cursor-pointer accent-burgundy"
          />
          Hitung mundur 3 detik sebelum foto diambil
        </label>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-navy transition hover:bg-card/70 hover:text-burgundy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke persiapan
        </button>

        {USE_SIMULATION && <SimBar />}
      </div>
    </div>
  );
}