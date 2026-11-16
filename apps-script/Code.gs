function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  try {
    var demoMode = resolveDemoMode(e);
    if (action === "getExistingAllocation") {
      var requestId = String(e.parameter.requestId || "");
      var sessionId = String(e.parameter.sessionId || "");
      if (!requestId || !sessionId) return jsonResponse({ ok: false, code: "INVALID_RECOVERY_ID" });
      var found = findRequest(requestId, demoMode);
      if (!found || found.values[1] !== sessionId || ["allocated", "paused"].indexOf(found.values[3]) < 0) {
        return jsonResponse({ ok: true, found: false, demoMode: demoMode });
      }
      var result = JSON.parse(found.values[4]);
      return jsonResponse({ ok: true, found: true, demoMode: demoMode, allocation: result });
    }
    if (action === "getPublicCampaignStatus") {
      return jsonResponse({
        ok: true,
        quizVersion: 2,
        submissionVersion: 1,
        demoMode: demoMode,
        allocationEnabled: demoMode || getSettingValue("allocationEnabled") === "true",
        campaignName: demoMode ? "Garmin Run 2026 Staging" : getSettingValue("campaignName")
      });
    }
    return jsonResponse({ ok: false, code: "UNKNOWN_ACTION" });
  } catch (error) {
    var getCode = String(error && error.message || "");
    return jsonResponse({ ok: false, retryable: false, code: getCode === "INVALID_API_MODE" ? getCode : "BAD_REQUEST" });
  }
}

function doPost(e) {
  try {
    var rawText = e && e.postData ? e.postData.contents : "";
    if (!rawText) return jsonResponse({ ok: false, code: "INVALID_PAYLOAD" });
    var raw = JSON.parse(rawText);
    if (Object.prototype.hasOwnProperty.call(raw, "demoMode")) throw new Error("ENVIRONMENT_OVERRIDE_NOT_ALLOWED");
    var demoMode = resolveDemoMode(e);
    var payload = validateAnonymousSubmission(raw, demoMode);

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
      return jsonResponse({
        ok: false,
        retryable: true,
        code: "LOCK_BUSY",
        message: {
          zh: "伺服器忙碌中，請稍後重試；請保留相同提交編號。",
          en: "The server is busy. Please retry with the same request ID."
        },
        requestId: payload.requestId
      });
    }

    try {
      var result = submitAnonymousResult(payload);
      return jsonResponse(result);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    var code = String(error && error.message ? error.message : "INTERNAL_ERROR");
    var validationCodes = [
      "INVALID_PAYLOAD","INVALID_REQUEST_ID","INVALID_SESSION_ID","INVALID_ANSWERS",
      "INVALID_ANSWER","ELIGIBILITY_MISMATCH","INVALID_HYDRATION_COMMITMENT",
      "PERSONAL_DATA_NOT_ALLOWED","ENVIRONMENT_OVERRIDE_NOT_ALLOWED","REQUEST_ID_CONFLICT",
      "SHEET_SETUP_REQUIRED","UNSUPPORTED_SUBMISSION_VERSION","V2_MIGRATION_REQUIRED",
      "ANONYMOUS_SCHEMA_MIGRATION_REQUIRED","INVALID_API_MODE"
    ];
    return jsonResponse({
      ok: false,
      retryable: code === "REQUEST_PENDING_RETRY",
      code: validationCodes.indexOf(code) >= 0 ? code : "INTERNAL_ERROR"
    });
  }
}

// One Web App can route to Demo* tabs only when explicitly requested.
// An absent mode is Production; this parameter is routing, not authorization.
function resolveDemoMode(e) {
  var parameters = e && e.parameter ? e.parameter : {};
  var mode = String(parameters.mode || "");
  if (mode === "apps-script-demo" || (!mode && String(parameters.demoMode || "") === "true")) return true;
  if (mode === "" || mode === "production" || (!mode && String(parameters.demoMode || "") === "false")) return false;
  throw new Error("INVALID_API_MODE");
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
