function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : "";
  try {
    if (action === "getExistingAllocation") {
      var requestId = String(e.parameter.requestId || "");
      var sessionId = String(e.parameter.sessionId || "");
      if (!requestId || !sessionId) return jsonResponse({ ok: false, code: "INVALID_RECOVERY_ID" });
      var demoMode = String(e.parameter.demoMode || "false") === "true";
      var found = findRequest(requestId, demoMode);
      if (!found || found.values[1] !== sessionId || found.values[3] !== "allocated") {
        return jsonResponse({ ok: true, found: false, demoMode: demoMode });
      }
      var result = JSON.parse(found.values[4]);
      delete result.name;
      delete result.email;
      return jsonResponse({ ok: true, found: true, demoMode: demoMode, allocation: result });
    }
    if (action === "getPublicCampaignStatus") {
      var demoMode = String(e.parameter.demoMode || "false") === "true";
      return jsonResponse({
        ok: true,
        demoMode: demoMode,
        allocationEnabled: demoMode || getSettingValue("allocationEnabled") === "true",
        raffleEnabled: demoMode || getSettingValue("raffleEnabled") === "true",
        campaignName: demoMode ? "Garmin Run 2026 Mock" : getSettingValue("campaignName")
      });
    }
    return jsonResponse({ ok: false, code: "UNKNOWN_ACTION" });
  } catch (error) {
    return jsonResponse({ ok: false, retryable: false, code: "BAD_REQUEST" });
  }
}

function doPost(e) {
  try {
    var rawText = e && e.postData ? e.postData.contents : "";
    if (!rawText) return jsonResponse({ ok: false, code: "INVALID_PAYLOAD" });
    var raw = JSON.parse(rawText);
    var payload = validateParticipationPayload(raw);

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
      var result = submitParticipation(payload);
      return jsonResponse(result);
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    var code = String(error && error.message ? error.message : "INTERNAL_ERROR");
    var validationCodes = [
      "INVALID_PAYLOAD","INVALID_REQUEST_ID","INVALID_SESSION_ID","INVALID_RUNNER_TYPE",
      "INVALID_HYDRATION_COMMITMENT","INVALID_EXISTING_SELF_HYDRATION","INVALID_ANSWERS",
      "INVALID_ANSWER","ELIGIBILITY_MISMATCH","INVALID_RAFFLE_OPTION","INVALID_RAFFLE_NAME",
      "INVALID_RAFFLE_EMAIL","INVALID_PRIVACY_ACKNOWLEDGEMENT","PRIVACY_NOTICE_NOT_APPROVED",
      "SHEET_SETUP_REQUIRED"
    ];
    return jsonResponse({
      ok: false,
      retryable: code === "REQUEST_PENDING_RETRY",
      code: validationCodes.indexOf(code) >= 0 ? code : "INTERNAL_ERROR"
    });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
