import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitHash() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

/**
 * Latest commit that touched ANYTHING inside the Adaptívny model DAP:
 * - config/model/**       (questionBank.json, scoringConfig.json, benchmarkData.json, methodology docs)
 * - data/**               (scoringConfig.ts, benchmarkData.ts)
 * - engines/**            (scoringEngine, roiEngine, questionEngine, riskEngine)
 *
 * If none of those paths has ever been committed, fall back to HEAD.
 */
function getModelHash() {
  try {
    const out = execSync(
      'git log -1 --format=%h -- config/model data engines'
    )
      .toString()
      .trim();
    return out || getGitHash();
  } catch {
    return "dev";
  }
}

const commitHash = getGitHash();
const modelHash = getModelHash();

/**
 * Content Security Policy.
 * - 'unsafe-inline' on style-src is required for Tailwind's inline styles.
 * - 'unsafe-inline' on script-src is still required for Next.js hydration data.
 *   A stricter nonce-based CSP would require dynamic rendering on every page,
 *   which defeats Next.js static optimization for this mostly-static site.
 * - 'unsafe-eval' is only present in development (React DevTools needs it);
 *   in production it is dropped entirely.
 * - data: + blob: for inline icons and generated OG images.
 */
const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "media-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: csp,
  },
  {
    // Prevent the site from being framed by external origins (clickjacking).
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Refuse to load resources whose declared MIME type does not match.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Only forward the origin (not the full URL) on cross-origin requests.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Force HTTPS for 2 years, including subdomains; enable HSTS preload.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Disable powerful browser APIs we do not need.
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "interest-cohort=()",
    ].join(", "),
  },
  {
    // Legacy IE/Edge XSS filter. Modern browsers ignore this but it's harmless.
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
    NEXT_PUBLIC_MODEL_COMMIT_HASH: modelHash,
  },
  poweredByHeader: false, // Hide the "X-Powered-By: Next.js" header.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
