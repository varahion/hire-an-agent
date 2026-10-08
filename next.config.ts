import type { NextConfig } from "next";
import { withEve } from "eve/next";

const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // Pin the workspace root to this project. Without it, a stray lockfile in a
  // parent folder can make Turbopack watch that folder and rebuild endlessly.
  turbopack: { root: import.meta.dirname },
};

// The eve agent is mounted only when enabled, so the site builds without credentials.
export default process.env.EVE_ENABLED === "true" ? withEve(config) : config;
