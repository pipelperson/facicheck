import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { FrameCheck, FrameReason } from "./screening";

/** Ambang panduan. Ini hanya saran awal di perangkat; penilaian resmi tetap oleh backend. Silakan disetel. */
export const GUIDE = {
  maxYaw: 12, // derajat: menoleh ke kiri/kanan
  maxPitch: 15, // derajat: mendongak/menunduk
  maxRoll: 10, // derajat: kepala miring
  jawOpen: 0.12, // 0–1: mulut terbuka
  smile: 0.3, // 0–1: tersenyum
  minBrightness: 55, // 0–255: terlalu gelap
  minFace: 0.62, // tinggi wajah / tinggi oval: di bawah ini = terlalu jauh
  maxFace: 1.05, // di atas ini = terlalu dekat
  maxOffset: 0.45, // pergeseran dari tengah oval
};

/** Ubah ke true sementara untuk melihat angka di Console saat menyetel ambang. */
const DEBUG = false;

// Oval panduan (sama dengan gambar di CameraStep: viewBox 300x400)
const OVAL = { cx: 0.5, cy: 185 / 400, rx: 100 / 300, ry: 135 / 400 };

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

/** Memuat model sekali saja (di-cache). File ada di /public. */
export function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const options = {
        runningMode: "VIDEO" as const,
        numFaces: 2,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      };
      try {
        return await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate: "GPU" },
          ...options,
        });
      } catch {
        return await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate: "CPU" },
          ...options,
        });
      }
    })();
    landmarkerPromise.catch(() => {
      landmarkerPromise = null; // izinkan mencoba lagi
    });
  }
  return landmarkerPromise;
}

const NO_FACE: FrameCheck = { faceFound: false, ok: false, reasons: ["tidak_ada_wajah"] };

/** Potongan tengah video 3:4, sama dengan yang terlihat di pratinjau dan yang difoto. */
function frameBox(vw: number, vh: number) {
  const ratio = 3 / 4;
  let sw = vw;
  let sh = vw / ratio;
  if (sh > vh) {
    sh = vh;
    sw = vh * ratio;
  }
  return { sx: (vw - sw) / 2, sy: (vh - sh) / 2, sw, sh };
}

/** Radian ke derajat (nilai mutlak), tahan terhadap pembalikan sumbu 180°. */
const deg = (rad: number) => {
  const d = Math.abs((rad * 180) / Math.PI);
  return d > 90 ? 180 - d : d;
};

let probe: HTMLCanvasElement | null = null;
function brightness(video: HTMLVideoElement): number {
  probe ??= Object.assign(document.createElement("canvas"), { width: 32, height: 24 });
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 255;
  ctx.drawImage(video, 0, 0, 32, 24);
  const px = ctx.getImageData(0, 0, 32, 24).data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) sum += 0.299 * (px[i] ?? 0) + 0.587 * (px[i + 1] ?? 0) + 0.114 * (px[i + 2] ?? 0);
  return sum / (px.length / 4);
}

export function analyzeFace(landmarker: FaceLandmarker, video: HTMLVideoElement): FrameCheck {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (video.readyState < 2 || !vw || !vh) return NO_FACE;

  const res = landmarker.detectForVideo(video, performance.now());
  const pts = res.faceLandmarks[0];
  if (!pts || pts.length === 0) return NO_FACE;

  const reasons: FrameReason[] = [];
  if (res.faceLandmarks.length > 1) reasons.push("banyak_wajah");

  // posisi dan ukuran terhadap oval
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const { sx, sy, sw, sh } = frameBox(vw, vh);
  const cx = (((minX + maxX) / 2) * vw - sx) / sw;
  const cy = (((minY + maxY) / 2) * vh - sy) / sh;
  const faceSize = ((maxY - minY) * vh) / sh / (OVAL.ry * 2);
  const offset = Math.hypot((cx - OVAL.cx) / OVAL.rx, (cy - OVAL.cy) / OVAL.ry);
  if (offset > GUIDE.maxOffset) reasons.push("tidak_di_tengah");
  if (faceSize < GUIDE.minFace) reasons.push("terlalu_jauh");
  else if (faceSize > GUIDE.maxFace) reasons.push("terlalu_dekat");

  // arah kepala (dari matriks pose; hanya besarnya sudut yang dipakai)
  let yaw = 0;
  let pitch = 0;
  let roll = 0;
  const m = res.facialTransformationMatrixes?.[0]?.data;
  if (m && m.length >= 11) {
    yaw = deg(Math.asin(Math.max(-1, Math.min(1, -(m[2] ?? 0)))));
    pitch = deg(Math.atan2(m[6] ?? 0, m[10] ?? 1));
    roll = deg(Math.atan2(m[1] ?? 0, m[0] ?? 1));
    if (yaw > GUIDE.maxYaw) reasons.push("menoleh");
    if (pitch > GUIDE.maxPitch) reasons.push("dongak");
    if (roll > GUIDE.maxRoll) reasons.push("miring");
  }

  // ekspresi
  const cats = res.faceBlendshapes?.[0]?.categories ?? [];
  const score = (name: string) => cats.find((c) => c.categoryName === name)?.score ?? 0;
  const jaw = score("jawOpen");
  const smile = (score("mouthSmileLeft") + score("mouthSmileRight")) / 2;
  if (jaw > GUIDE.jawOpen) reasons.push("mulut_terbuka");
  if (smile > GUIDE.smile) reasons.push("senyum");

  // cahaya
  const light = brightness(video);
  if (light < GUIDE.minBrightness) reasons.push("cahaya");

  if (DEBUG) {
    console.log({ yaw, pitch, roll, jaw, smile, light, faceSize, offset, reasons });
  }
  return { faceFound: true, ok: reasons.length === 0, reasons };
}