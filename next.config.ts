import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig: NextConfig = {
  // Catatan: `next dev` memakai Turbopack, sedangkan build produksi memakai
  // webpack (lihat script "build": "next build --webpack") karena
  // @ducanh2912/next-pwa membutuhkan workbox-webpack-plugin.
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  fallbacks: {
    document: "/~offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  },
});

export default function konfigurasi(phase: string): NextConfig {
  // Service worker hanya dibangun saat build produksi, jadi dev server
  // (Turbopack) tetap jalan tanpa konfigurasi webpack.
  if (phase === PHASE_PRODUCTION_BUILD) {
    return withPWA(nextConfig);
  }

  return nextConfig;
}
