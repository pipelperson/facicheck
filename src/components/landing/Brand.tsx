import { useEffect, useRef, useState } from "react";

/**
 * File logo asli HARUS ada di: public/icons/logo-facicheck.jpeg
 * (Vite menyajikan isi folder public/ dari root, jadi URL-nya "/icons/logo-facicheck.jpeg").
 *
 * Sebelumnya logo memakai src/assets/logo-facicheck.jpeg.asset.json yang berisi URL
 * "/__l5e/assets-v1/..." — path internal hosting Lovable yang tidak ada di dev server lokal,
 * sehingga browser menampilkan ikon gambar rusak (tanda tanya).
 */
const LOGO_SRC = "/icons/logo-facicheck.jpeg";

export function Brand() {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Gambar bisa gagal dimuat sebelum hydration selesai (onError terlewat): cek manual.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <a
      href="#beranda"
      className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-card">
        {failed ? (
          // Cadangan sementara jika file logo belum ada. Bukan logo asli.
          <span aria-hidden="true" className="font-display text-xl font-semibold text-burgundy">
            F
          </span>
        ) : (
          <img
            ref={ref}
            src={LOGO_SRC}
            alt=""
            width={40}
            height={40}
            decoding="async"
            onError={() => setFailed(true)}
            className="h-10 w-10 object-contain"
          />
        )}
      </span>
      <span className="truncate text-lg font-semibold tracking-[-0.02em] text-navy">FaciCheck</span>
    </a>
  );
}