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
};

export default nextConfig;
