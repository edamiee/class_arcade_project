import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Penelope's Learning Arcade",
    short_name: "Arcade",
    description: "Classroom quiz arcade",
    start_url: "/join",
    display: "standalone",
    background_color: "#060613",
    theme_color: "#060613",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
