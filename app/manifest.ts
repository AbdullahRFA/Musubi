import type { MetadataRoute } from "next";

/** Lets members add Musubi to their phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Musubi",
    short_name: "Musubi",
    description: "Older and younger neighbours in Nagasaki share skills, help each other and build friendships.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf3",
    theme_color: "#fffaf3",
    icons: [
      { src: "/brand/musubi-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
