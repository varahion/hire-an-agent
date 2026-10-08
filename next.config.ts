import type { NextConfig } from "next";
import { withEve } from "eve/next";

const config: NextConfig = { devIndicators: false, poweredByHeader: false };

// The eve agent is mounted only when enabled, so the site builds without credentials.
export default process.env.EVE_ENABLED === "true" ? withEve(config) : config;
