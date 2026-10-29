import { useEffect, useRef, useState, type RefObject } from "react";
import { grabFrame } from "@/lib/capture";
import { REASON_PRIORITY, type FrameReason, type LiveState } from "@/lib/screening";
import { checkFrame, USE_SIMULATION } from "@/lib/screeningApi";

const INTERVAL_MS = 500;

export type Live = { state: LiveState; reason: FrameReason | null };
const INITIAL: Live = { state: "searching", reason: "tidak_ada_wajah" };

export function useLiveCheck(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean): Live {
  const [live, setLive] = useState<Live>(INITIAL);
  const okStreak = useRef(0);
  const badStreak = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setLive(INITIAL);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    okStreak.current = 0;
    badStreak.current = 0;

    const tick = async () => {
      try {
        const video = videoRef.current;
        const frame = USE_SIMULATION || !video ? null : await grabFrame(video);
        const res = await checkFrame(frame);
        if (cancelled) return;

        if (res.ok) {
          okStreak.current += 1;
          badStreak.current = 0;
        } else {
          badStreak.current += 1;
          okStreak.current = 0;
        }

        setLive((prev) => {
          let next: Live = prev;
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
      } catch {
        /* abaikan, coba lagi pada putaran berikutnya */
      }
      if (!cancelled) timer = window.setTimeout(tick, INTERVAL_MS);
    };

    timer = window.setTimeout(tick, INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, videoRef]);

  return live;
}