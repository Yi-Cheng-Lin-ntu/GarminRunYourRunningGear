// UI entry only: API mode remains owned by the shared API client.
import "../js/app.js";
const link = document.querySelector("[data-urban-link]");
const mode = new URLSearchParams(location.search).get("mode");
if (mode === "apps-script-demo") link.search = "?mode=apps-script-demo";
