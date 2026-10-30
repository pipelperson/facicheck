import { useEffect, useRef, useState, type RefObject } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { analyzeFace, loadFaceLandmarker } from "@/lib/face-guide";
import { REASON_PRIORITY, type FrameCheck, type FrameReason, type LiveState } from "@/lib/screening";
import { LIVE_CHECK_MODE, checkFrame } from "@/lib/screeningApi";

export type Engine = "off" | "loading" | "ready" | "failed";
export type Live = { state: LiveState; reason: FrameReason | null; engine: Engine };

const INITIAL = { state: "searching" as LiveState, reason: "tidak_ada_wajah" as FrameReason | null };

export function useLiveCheck(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean): Live {
  const [guide, setGuide] = useState(INITIAL);
  const [engine, setEngine] = useState<Engine>(LIVE_CHECK_MODE === "off" ? "off" : "loading");
  const okStreak = useRef(0);
  const badStreak = useRef(0);

  useEffect(() => {
    if (!enabled || LIVE_CHECK_MODE === "off") {
      setGuide(INITIAL);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    okStreak.current = 0;
    badStreak.current = 0;

    // peredam kedip: "pas" setelah 2 hasil bagus berturut-turut; kembali "belum pas" setelah 2 hasil buruk berturut-turut
    const apply = (res: FrameCheck) => {
      if (res.ok) {
        okStreak.current += 1;
        badStreak.current = 0;
      } else {
        badStreak.current += 1;
        okStreak.current = 0;
      }
      setGuide((prev) => {
        let next = prev;
        if (!res.faceFound) {
          next = INITIAL;
        } else if (res.ok) {
          if (okStreak.current >= 2) next = { state: "ready", reason: null };
        } else if (!(prev.state === "ready" && badStreak.current < 2)) {
          const reason = REASON_PRIORITY.find((r) => res.reasons.includes(r)) ?? res.reasons[0] ?? "tidak_ada_wajah";
          next = { state: "adjust", reason };
        }
        return next.state === prev.state && next.reason === prev.reason ? prev : next;
      });
    };

    const run = async () => {
      if (LIVE_CHECK_MODE === "simulation") {
        setEngine("ready");
        const tick = async () => {
          try {
            const res = await checkFrame(null);
            if (!cancelled) apply(res);
          } catch {
            /* abaikan */
          }
          if (!cancelled) timer = window.setTimeout(tick, 500);
        };
        timer = window.setTimeout(tick, 500);
        return;
      }

      // "local": deteksi wajah di browser
      setEngine("loading");
      let landmarker: FaceLandmarker;
      try {
        landmarker = await loadFaceLandmarker();
      } catch {
        if (!cancelled) setEngine("failed");
        return;
      }
      if (cancelled) return;
      setEngine("ready");

      const tick = () => {
        const video = videoRef.current;
        if (video) {
          try {
            apply(analyzeFace(landmarker, video));
          } catch {
            /* abaikan, coba lagi di putaran berikutnya */
          }
        }
        if (!cancelled) timer = window.setTimeout(tick, 160);
      };
      tick();
    };

    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, videoRef]);

  return { ...guide, engine };
}