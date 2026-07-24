import process from "node:process";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hostnames only (no protocol/port). Comma-separated, e.g. "127.0.0.1,*.localhost"
  // localhost is already allowed by Next when this is empty/absent.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
    : [],
  cacheComponents: true,
};

export default nextConfig;
