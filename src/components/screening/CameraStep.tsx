import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CameraOff, LoaderCircle, SwitchCamera, TriangleAlert, type LucideIcon } from "lucide-react";
import { useCamera, type CameraStatus } from "@/hooks/use-camera";
import { useHeldValue } from "@/hooks/use-held-value";
import { useLiveCheck } from "@/hooks/use-live-check";
import { capturePhoto } from "@/lib/capture";
import { guideFull, guideShort, guideState, type GuideKey } from "@/lib/guide-copy";
import type { CapturedPhoto, LiveState } from "@/lib/screening";
import { USE_SIMULATION, restartSimulation, setSimMode, type SimMode } from "@/lib/screeningApi";

const FRAME_W = "min(100%, 28rem, calc(72svh * 0.75))";

/** Warna lampu oval. Ganti di sini bila ingin warna lain. */
const GOOD = "#5DBB8A"; // hijau lembut: posisi pas
const BAD = "#E2666F"; // merah lembut: belum pas
const NEUTRAL = "rgba(255,255,255,0.85)"; // wajah belum terdeteksi

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

/** Oval panduan: putih putus-putus = wajah belum terdeteksi, merah = belum pas, hijau tebal = pas. */
function Guide({ state }: { state: LiveState }) {
  const color = state === "ready" ? GOOD : state === "adjust" ? BAD : NEUTRAL;
  const t = "stroke .3s, stroke-width .3s, stroke-opacity .3s";
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <path fill="var(--navy)" fillOpacity=".38" fillRule="evenodd" d="M0 0H300V400H0Z M50 185a100 135 0 1 0 200 0a100 135 0 1 0 -200 0Z" />
      <ellipse cx="150" cy="185" rx="100" ry="135" fill="none" stroke={GOOD} strokeWidth="14" strokeOpacity={state === "ready" ? 0.28 : 0} style={{ transition: t }} />
      <ellipse
        cx="150"
        cy="185"
        rx="100"
        ry="135"
        fill="none"
        stroke={color}
        strokeWidth={state === "ready" ? 5 : 4}
        strokeDasharray={state === "searching" ? "9 9" : undefined}
        style={{ transition: t }}
      />
      <g stroke={color} strokeOpacity=".55" strokeWidth="1.5" strokeDasharray="4 6" style={{ transition: t }}>
        <line x1="150" y1="60" x2="150" y2="310" />
        <line x1="85" y1="150" x2="215" y2="150" />
      </g>
    </svg>
  );
}

/** Pesan singkat di atas bingkai kamera, tempat mata pengguna memandang. */
function GuideBadge({ gkey }: { gkey: GuideKey }) {
  const text = guideShort(gkey);
  if (!text) return null;
  const state = guideState(gkey);
  const color = state === "ready" ? GOOD : state === "adjust" ? BAD : NEUTRAL;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-3">
      <div className="flex max-w-full items-center gap-2 rounded-full bg-navy/85 px-4 py-2 text-base font-semibold text-white shadow-soft">
        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
        <span key={gkey} className="animate-in truncate duration-200 fade-in">
          {text}
        </span>
      </div>
    </div>
  );
}

const LEGEND = [
  { color: GOOD, text: "Hijau: posisi pas" },
  { color: BAD, text: "Merah: perlu disesuaikan" },
  { color: "rgba(53,68,91,0.45)", text: "Putih putus-putus: wajah belum terdeteksi" },
];

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
      <p className="text-xs font-semibold text-olive">Mode simulasi: data semu, hanya untuk uji tampilan</p>
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
  const gated = live.engine === "ready" || live.engine === "loading";

  // satu kunci tunggal untuk oval, pesan di kamera, dan pengumuman; ditahan agar tidak berkedip
  const rawKey: GuideKey = !ready
    ? "none"
    : live.engine === "loading"
      ? "loading"
      : live.engine === "ready"
        ? live.state === "ready"
          ? "ok"
          : (live.reason ?? "tidak_ada_wajah")
        : "none";
  const key = useHeldValue(rawKey, 800);

  const [countdownOn, setCountdownOn] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const lastSpoke = useRef(0);
  const mirrored = facing === "user";
  const counting = count !== null;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    restartSimulation();
  }, []);

  // jika posisi tak kunjung pas, tetap izinkan mengambil foto (pemeriksaan resmi dilakukan setelahnya)
  useEffect(() => {
    if (!ready || !gated) return;
    const id = window.setTimeout(() => setStuck(true), 12000);
    return () => window.clearTimeout(id);
  }, [ready, gated]);

  // suara panduan (opsional, default mati)
  useEffect(() => {
    if (!voiceOn || !canSpeak || key === "none" || key === "loading") return;
    const now = Date.now();
    if (key !== "ok" && now - lastSpoke.current < 2500) return;
    lastSpoke.current = now;
    const u = new SpeechSynthesisUtterance(guideShort(key));
    u.lang = "id-ID";
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [key, voiceOn, canSpeak]);

  useEffect(
    () => () => {
      if (canSpeak) window.speechSynthesis.cancel();
    },
    [canSpeak],
  );

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

  const canShoot = ready && !counting && (!gated || key === "ok" || stuck);
  const active = canShoot || counting;
  const onShutter = () => {
    if (counting) setCount(null);
    else if (canShoot) {
      if (countdownOn) setCount(3);
      else void shoot();
    }
  };

  const hint = counting
    ? "Tahan posisi… tekan lagi untuk membatalkan."
    : !ready
      ? "Tombol foto muncul setelah kamera siap."
      : canShoot
        ? gated && key !== "ok"
          ? "Posisi belum pas, tetapi Anda tetap bisa mengambil foto."
          : "Tekan tombol putih untuk mengambil foto."
        : gated && key !== "ok" && key !== "none"
          ? guideFull(key)
          : "Tombol aktif saat oval berwarna hijau.";

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
            {ready ? (
              <>
                <Guide state={guideState(key)} />
                <GuideBadge gkey={key} />
              </>
            ) : (
              <CameraNotice status={status as Exclude<CameraStatus, "ready">} onRetry={retry} />
            )}

            {count !== null && count > 0 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-navy/20" aria-hidden="true">
                <span key={count} className="animate-in font-display text-9xl text-white duration-300 fade-in zoom-in-50">
                  {count}
                </span>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-300" style={{ opacity: flash ? 0.7 : 0 }} aria-hidden="true" />

            {/* Kontrol di dalam bingkai: selalu terlihat tanpa scroll */}
            {ready && (
              <div
                className="absolute inset-x-0 bottom-0 grid grid-cols-3 items-center px-4 pt-12 pb-4"
                style={{ background: "linear-gradient(to top, color-mix(in oklab, var(--navy) 70%, transparent), transparent)" }}
              >
                <div />
                <button
                  type="button"
                  onClick={onShutter}
                  disabled={!active}
                  aria-label={counting ? "Batalkan hitung mundur" : "Ambil foto"}
                  aria-describedby="shutter-hint"
                  className={`group mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-white/90 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                    active ? "enabled:active:scale-95" : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <span
                    className={`transition-all ${counting ? "h-5 w-5 rounded-md" : "h-11 w-11 rounded-full"} ${
                      active ? "bg-burgundy group-hover:brightness-110" : "bg-white/40"
                    }`}
                  />
                </button>
                <div className="justify-self-end">
                  {canFlip && (
                    <button
                      type="button"
                      onClick={flip}
                      disabled={counting}
                      aria-label="Ganti kamera"
                      title="Ganti kamera"
                      className="grid h-12 w-12 place-items-center rounded-full border border-white/60 bg-navy/40 text-white transition hover:bg-navy/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40"
                    >
                      <SwitchCamera className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pesan lengkap tepat di bawah kamera, tempat pandangan berada */}
          <p id="shutter-hint" className="mt-3 text-center text-base leading-snug font-medium text-navy">
            {hint}
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {ready ? guideFull(key) : ""}
          </p>
        </div>
      </div>

      {/* Panduan */}
      <div className="lg:col-start-1 lg:row-start-2">
        <ul className="space-y-2 text-base leading-relaxed text-olive">
          <li>Hadap lurus, ekspresi netral, mulut tertutup.</li>
          <li>Pegang kamera setinggi mata dan tahan dengan stabil.</li>
          <li>Cahaya dari depan wajah, bukan dari belakang.</li>
        </ul>

        {live.engine === "ready" && (
          <div className="mt-6">
            <ul className="space-y-1.5 text-sm text-navy">
              {LEGEND.map((l) => (
                <li key={l.text} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: l.color }} />
                  {l.text}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-olive">
              Warna oval hanya panduan awal dari perangkat Anda. Pemeriksaan kualitas resmi tetap dilakukan setelah foto
              diambil.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-1">
          <label className="flex cursor-pointer items-center gap-3 py-1 text-base text-navy">
            <input
              type="checkbox"
              checked={countdownOn}
              onChange={(e) => setCountdownOn(e.target.checked)}
              className="h-5 w-5 shrink-0 cursor-pointer accent-burgundy"
            />
            Hitung mundur 3 detik sebelum foto diambil
          </label>
          {canSpeak && (
            <label className="flex cursor-pointer items-center gap-3 py-1 text-base text-navy">
              <input
                type="checkbox"
                checked={voiceOn}
                onChange={(e) => setVoiceOn(e.target.checked)}
                className="h-5 w-5 shrink-0 cursor-pointer accent-burgundy"
              />
              Suara panduan (dibacakan)
            </label>
          )}
        </div>

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