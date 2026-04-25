import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "turkdunyasi",
  project: "javascript-nextjs",

  // Sentry auth token yokken build hatasını önlemek için source map upload kapalı
  // SENTRY_AUTH_TOKEN Vercel env'e eklenince aşağıdaki satır kaldırılabilir
  sourcemaps: {
    disable: true,
  },

  silent: true,

  tunnelRoute: "/monitoring",

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
