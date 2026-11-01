import process from "node:process";

/** Prefixes of the Nest API, proxied same-origin via `app/backend/[...path]`. */
const API_PREFIXES = [
  "api",
  "competitions",
  "contests",
  "administrators",
  "teams",
  "questions",
  "me",
];

const buildModeEnv = process.env.BUILD_MODE;
const buildMode = buildModeEnv === "standalone" ? "standalone" : buildModeEnv === "development" ? undefined : undefined;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: buildMode,
  // Hostnames only (no protocol/port). Comma-separated, e.g. "127.0.0.1,*.localhost"
  // localhost is already allowed by Next when this is empty/absent.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
    : [],
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/home",
        permanent: false,
      },
      {
        source: "/admin/competicoes/:id/times",
        destination: "/admin/competicoes/:id/competidores",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return API_PREFIXES.flatMap((prefix) => [
      { source: `/${prefix}`, destination: `/backend/${prefix}` },
      { source: `/${prefix}/:path*`, destination: `/backend/${prefix}/:path*` },
    ]);
  },
};

export default nextConfig;
