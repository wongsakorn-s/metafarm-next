import { useEffect, useRef, useState } from "react";
import { th } from "../../i18n/th";

export function QRScanner({ onScan }: { onScan: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState("");
  onScanRef.current = onScan;

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(th.admin.noCameraScanner);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    let frame = 0;
    let lastScan = 0;
    let stream: MediaStream | null = null;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const scan = (decode: typeof import("jsqr").default, timestamp: number) => {
      if (!active) return;
      if (context && video.videoWidth > 0 && timestamp - lastScan >= 150) {
        lastScan = timestamp;
        canvas.width = Math.min(video.videoWidth, 640);
        canvas.height = Math.round(
          (video.videoHeight * canvas.width) / video.videoWidth,
        );
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const result = decode(pixels.data, pixels.width, pixels.height, {
          inversionAttempts: "dontInvert",
        });
        if (result?.data) {
          active = false;
          onScanRef.current(result.data);
          return;
        }
      }
      frame = window.requestAnimationFrame((time) => scan(decode, time));
    };
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(async (media) => {
        stream = media;
        if (!active) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = media;
        await video.play();
        const { default: decode } = await import("jsqr");
        frame = window.requestAnimationFrame((time) => scan(decode, time));
      })
      .catch(() => {
        if (active) setError(th.admin.cameraFailed);
      });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label={th.admin.scanQr}
        className="aspect-square w-full rounded-card bg-stone-950 object-cover"
      />
      {error && (
        <p role="alert" className="mt-3 text-warning-700">
          {error}
        </p>
      )}
    </div>
  );
}
