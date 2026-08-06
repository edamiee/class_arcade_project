import { ImageResponse } from "next/og";

export const contentType = "image/png";

// Two sizes from one route: Android/Chrome's installability check (and
// Lighthouse's PWA audit) specifically look for a 192px icon in addition
// to 512px, not just the larger one scaled down.
export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 } },
    { id: "512", size: { width: 512, height: 512 } },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const px = (await id) === "192" ? 192 : 512;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060613",
        }}
      >
        <div style={{ fontSize: px * 0.625, lineHeight: 1 }}>🕹️</div>
      </div>
    ),
    { width: px, height: px }
  );
}
