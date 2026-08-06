"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function JoinQrCode({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(url, { type: "svg", margin: 1, width: 200 }).then(
      (result) => {
        if (!cancelled) setSvg(result);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!svg) return null;

  return (
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt="QR code to join"
      width={160}
      height={160}
      className="rounded-md border-2 border-slate-700 bg-white p-2"
    />
  );
}
