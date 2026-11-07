import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy (T13). One policy for every page, so pages can stay static (cacheComponents).
 * - script-src needs 'unsafe-inline': Next streams page data in inline <script> tags, and nonces would make every
 *   page dynamic (see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md). We never use
 *   dangerouslySetInnerHTML or eval, and React escapes all text, so the remaining risk is small.
 * - ElevenLabs: voice sessions over websocket (api.elevenlabs.io) or WebRTC (livekit.rtc.elevenlabs.io).
 *   The SDK's audio worklets load from blob: and, on Firefox only, a resampler from cdn.jsdelivr.net.
 * - Everything else (frames, plugins, other hosts, form posts elsewhere) is blocked.
 */
const ELEVENLABS = "https://api.elevenlabs.io wss://api.elevenlabs.io https://livekit.rtc.elevenlabs.io wss://livekit.rtc.elevenlabs.io";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' blob: https://cdn.jsdelivr.net${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${ELEVENLABS}${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** Security headers on every response (the jury has an ethical hacker). */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Only our own pages may use the microphone; no camera, location, payments or USB.
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=(), usb=()" },
  { key: "Content-Security-Policy", value: csp },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
