/**
 * Public origin of the app (used when ChatGPT loads the widget iframe).
 *
 * Set BASE_URL (or NEXT_PUBLIC_BASE_URL) to your tunnel / production HTTPS
 * origin so assets and API calls resolve correctly inside the iframe.
 */
export function getBaseUrl(): string {
  const explicit =
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
