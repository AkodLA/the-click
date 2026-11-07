import type { MetadataRoute } from "next";

/** Lets learners add Snakk to their home screen like an app (mobile-first). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Snakk: learn the Norwegian people actually speak",
    short_name: "Snakk",
    description: "Speak Norwegian from day one: voice tutor, slang with context, formal vs. informal, A0–C2.",
    start_url: "/learn",
    display: "standalone",
    background_color: "#dfeffc",
    theme_color: "#1f7acc",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
