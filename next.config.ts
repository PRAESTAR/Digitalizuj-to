import type { NextConfig } from "next";
import { execSync } from "child_process";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

// Google Analytics 4 (gtag.js). Pripája sa až po súhlase, ale CSP musí tie
// zdroje povoliť tak či tak — inak by sa po súhlase ticho nenačítal.
// Wildcard v connect-src je nutnosť, nie pohodlnosť: GA4 posiela zásahy na
// REGIONÁLNE endpointy (region1.google-analytics.com), takže samotné
// www.google-analytics.com by v EÚ meranie zabilo.
// Reklamné domény (doubleclick, googlesyndication) tu ZÁMERNE nie sú — treba
// ich až pri prepojení na Google Ads / Google Signals, ktoré nepoužívame.
const GA_SCRIPT_SRC = "https://www.googletagmanager.com";
const GA_CONNECT_SRC =
  "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${GA_SCRIPT_SRC}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' ${GA_CONNECT_SRC}`,
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

/**
 * STATIC_EXPORT=1 prepína build do režimu `output: 'export'` pre Apache/PHP
 * webhosting (fixná konfigurácia, žiadny Node runtime — deploy cez FTP).
 * V exporte Next nepodporuje headers(), redirects() ani proxy — ich úlohu
 * preberá public/.htaccess, ktorý sa exportom dostane do koreňa balíka.
 * Lokálny vývoj a klasický build zostávajú bezo zmeny.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),
  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
    NEXT_PUBLIC_MODEL_COMMIT_HASH: modelHash,
  },
  poweredByHeader: false, // Hide the "X-Powered-By: Next.js" header.
  // headers/redirects v export režime ÚPLNE vynechané (nie prázdne polia):
  // samotná prítomnosť kľúčov spúšťa build warningy. Ich úlohu preberá
  // public/.htaccess.
  ...(isStaticExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: securityHeaders,
            },
          ];
        },
      }),
  /**
   * Trvalé presmerovania zo starých, nejazykových adries. Pred zavedením
   * viacjazyčnosti žila stránka na /peers, /changelog atď. — tie adresy sú
   * odkazované zvonku aj zaindexované, takže musia skončiť 301-kou na
   * slovenskú mutáciu, nie 404-kou. Koreň / rieši middleware.
   */
  ...(isStaticExport
    ? {}
    : {
        async redirects() {
          const legacyPaths = ["peers", "changelog", "quiz", "results"];
          return [
            ...legacyPaths.map((p) => ({
              source: `/${p}`,
              destination: `/sk/${p}`,
              permanent: true,
            })),
            // Zdieľané výsledky: staré /r/<hash> odkazy žijú v QR kódoch a
            // správach — bez tohto pravidla dostávali len 307 od middlewaru,
            // zatiaľ čo ostatné legacy cesty 308. Zjednotené na trvalé.
            {
              source: "/r/:hash",
              destination: "/sk/r/:hash",
              permanent: true,
            },
          ];
        },
      }),
};

export default withNextIntl(nextConfig);
