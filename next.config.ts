import type { NextConfig } from "next";

/**
 * Mounted at ronanprugh.com/games via a rewrite in the personal-site repo,
 * exactly as ScoreMate is (see 02-spec-score-mate-integration there).
 *
 * `basePath` is what makes that work: without it every internal link, asset
 * and API route would resolve at the root and 404 behind the rewrite.
 */
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "/games",
  experimental: {
    serverActions: {
      // Behind the personal-site rewrite, the browser's Origin is
      // ronanprugh.com while this app is served from its vercel.app host.
      // Server Actions reject an Origin that does not match, so without this
      // every sign-in and save at ronanprugh.com/games would fail its CSRF
      // check. Same-origin requests to the direct URL are unaffected.
      allowedOrigins: ["ronanprugh.com", "www.ronanprugh.com"],
    },
  },
};

export default nextConfig;
