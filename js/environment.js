// Static-host environment routing. API URLs must point to distinct spreadsheets.
// Keep production empty until the approved production deployment is configured.
const APPS_SCRIPT_URLS = Object.freeze({
  staging: "",
  production: ""
});

// Add the dedicated staging host here after it has been provisioned.
const STAGING_HOSTS = new Set(["garminrun-staging.example.invalid"]);
const hostname = globalThis.location?.hostname?.toLowerCase() || "localhost";
const isDevelopmentHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" ||
  hostname.endsWith(".app.github.dev") || hostname.endsWith(".github.dev");

export const API_ENVIRONMENT = isDevelopmentHost ? "development" :
  STAGING_HOSTS.has(hostname) ? "staging" : "production";
export const IS_DEVELOPMENT = API_ENVIRONMENT === "development";
export const API_URL = API_ENVIRONMENT === "development" ? "" :
  API_ENVIRONMENT === "staging" ? APPS_SCRIPT_URLS.staging : APPS_SCRIPT_URLS.production;
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
