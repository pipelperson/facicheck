import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "requesting" | "ready" | "denied" | "unavailable" | "insecure" | "error";
export type Facing = "user" | "environment";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reqRef = useRef(0);
  const [facing, setFacing] = useState<Facing>("user");
  const [status, setStatus] = useState<CameraStatus>("requesting");
  const [canFlip, setCanFlip] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(
    async (mode: Facing) => {
      const id = ++reqRef.current;
      stop();
      if (!window.isSecureContext) {
        setStatus("insecure");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }
      setStatus("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (id !== reqRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        if (id !== reqRef.current) return;
        const actual = stream.getVideoTracks()[0]?.getSettings().facingMode;
        setFacing(actual === "environment" ? "environment" : actual === "user" ? "user" : mode);
        setStatus("ready");
        navigator.mediaDevices
          .enumerateDevices()
          .then((d) => setCanFlip(d.filter((x) => x.kind === "videoinput").length > 1))
          .catch(() => undefined);
      } catch (e) {
        if (id !== reqRef.current) return;
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") setStatus("denied");
        else if (name === "NotFoundError" || name === "OverconstrainedError") setStatus("unavailable");
        else setStatus("error");
      }
    },
    [stop],
  );

  useEffect(() => {
    void start("user");
    return () => {
      reqRef.current += 1;
      stop();
    };
  }, [start, stop]);

  const retry = useCallback(() => void start(facing), [facing, start]);
  const flip = useCallback(() => void start(facing === "user" ? "environment" : "user"), [facing, start]);

  return { videoRef, status, facing, canFlip, retry, flip };
}