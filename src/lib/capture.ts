import type { CapturedPhoto } from "./screening";

const RATIO = 3 / 4; // sama dengan bingkai pratinjau

/** Potong tengah video ke rasio 3:4, persis seperti yang terlihat di pratinjau (object-cover). */
function cropRect(v: HTMLVideoElement) {
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  let sw = vw;
  let sh = vw / RATIO;
  if (sh > vh) {
    sh = vh;
    sw = vh * RATIO;
  }
  return { sx: (vw - sw) / 2, sy: (vh - sh) / 2, sw, sh };
}

function draw(v: HTMLVideoElement, outW: number) {
  const { sx, sy, sw, sh } = cropRect(v);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = Math.round(outW / RATIO);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const toBlob = (c: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => c.toBlob(resolve, "image/jpeg", quality));

/** Frame kecil untuk cek langsung (dipakai saat backend sudah terhubung). */
export async function grabFrame(v: HTMLVideoElement): Promise<Blob | null> {
  if (!v.videoWidth) return null;
  const c = draw(v, 320);
  return c ? toBlob(c, 0.7) : null;
}

/** Foto final. Tidak dicerminkan: sesuai apa adanya dari kamera. `mirrored` hanya untuk tampilan. */
export async function capturePhoto(v: HTMLVideoElement, mirrored: boolean): Promise<CapturedPhoto | null> {
  if (!v.videoWidth) return null;
  const c = draw(v, Math.min(768, Math.round(cropRect(v).sw)));
  if (!c) return null;
  const blob = await toBlob(c, 0.9);
  return blob ? { blob, url: URL.createObjectURL(blob), mirrored } : null;
}