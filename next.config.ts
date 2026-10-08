import type { NextConfig } from "next";
import { withEve } from "eve/next";
import { BASE_PATH } from "./src/lib/paths";

const config: NextConfig = {
  // Served at varahion.com/tools/hire-an-agent through a rewrite on the main site.
  basePath: BASE_PATH,
  devIndicators: false,
  poweredByHeader: false,
  // Pin the workspace root to this project. Without it, a stray lockfile in a
  // parent folder can make Turbopack watch that folder and rebuild endlessly.
  turbopack: { root: import.meta.dirname },
};

// The eve agent is mounted only when enabled, so the site builds without credentials.
export default process.env.EVE_ENABLED === "true" ? withEve(config) : config;
