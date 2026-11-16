// One Web App URL; Apps Script routes Demo requests to Demo* sheets by mode.
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzpY0s-HZ5o0fTqinyFqZotoN5wWmLn9toWL1SZefK_WODZ_t3iGHz8UWpWH-okIV3fEw/exec";

// Add the dedicated staging host here after it has been provisioned.
const STAGING_HOSTS = new Set(["garminrun-staging.example.invalid"]);

export function resolveAPIEnvironment(location = globalThis.location) {
  const hostname = location?.hostname?.toLowerCase() || "localhost";
  const mode = new URLSearchParams(location?.search || "").get("mode");
  if (mode === "apps-script-demo") return "staging";

  const isDevelopmentHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" ||
    hostname.endsWith(".app.github.dev") || hostname.endsWith(".github.dev");
  return isDevelopmentHost ? "development" : STAGING_HOSTS.has(hostname) ? "staging" : "production";
}

export const API_ENVIRONMENT = resolveAPIEnvironment();
export const IS_DEVELOPMENT = API_ENVIRONMENT === "development";
const selectedAPIBase = API_ENVIRONMENT === "development" ? "" : APPS_SCRIPT_WEB_APP_URL;
export const API_URL = (() => {
  if (!selectedAPIBase) return "";
  const url = new URL(selectedAPIBase);
  if (API_ENVIRONMENT === "staging") url.searchParams.set("mode", "apps-script-demo");
  else url.searchParams.delete("mode");
  return url.toString();
})();
export const API_DEMO_MODE = API_ENVIRONMENT === "staging";
export const API_CONFIGURED = IS_DEVELOPMENT || Boolean(API_URL);

export function environmentStatus() {
  return {
    environment: API_ENVIRONMENT,
    configured: API_CONFIGURED,
    demoMode: API_DEMO_MODE,
    apiUrl: API_URL
  };
}
