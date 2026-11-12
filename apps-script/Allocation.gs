function weightedPrize(prizeRows, randomValue) {
  var generalIds = ["cap", "soft_cup", "socks", "arm_sleeves"];
  var stockById = {};
  for (var i = 0; i < prizeRows.length; i++) {
    stockById[String(prizeRows[i][0])] = {
      remaining: Math.max(0, Number(prizeRows[i][5]) || 0),
      enabled: prizeRows[i][7] === true || String(prizeRows[i][7]).toLowerCase() === "true"
    };
  }
  var total = 0;
  for (var g = 0; g < generalIds.length; g++) {
    var item = stockById[generalIds[g]];
    if (item && item.enabled) total += item.remaining;
  }
  if (total <= 0) return null;
  var cursor = Math.max(0, Math.min(0.999999999, randomValue)) * total;
  for (var h = 0; h < generalIds.length; h++) {
    var prizeId = generalIds[h];
    var current = stockById[prizeId];
    if (!current || !current.enabled) continue;
    cursor -= current.remaining;
    if (cursor < 0) return prizeId;
  }
  return null;
}

function getPrizeImagePath(prizeId) {
  var paths = {
    cap: "./assets/prizes/Garmin漁夫帽.png",
    soft_cup: "./assets/prizes/Garmin軟水杯.png",
    socks: "./assets/prizes/Garmin襪子.png",
    arm_sleeves: "./assets/prizes/Garmin袖套.png",
    shopping_bag: "./assets/prizes/Garmin簍空購物袋.png"
  };
  return paths[prizeId] || "";
}

function submitAnonymousResult(payload) {
  var now = new Date();
  var names = getModeSheetNames(payload.demoMode);
  var ss = SpreadsheetApp.getActive();
  var requestSheet = ss.getSheetByName(names.requests);
  var prizeSheet = ss.getSheetByName(names.prizes);
  var participantSheet = ss.getSheetByName(names.participants);
  var allocationSheet = ss.getSheetByName(names.allocations);
  var inventorySheet = ss.getSheetByName(names.inventoryLog);
  if (!requestSheet || !prizeSheet || !participantSheet || !allocationSheet || !inventorySheet) throw new Error("SHEET_SETUP_REQUIRED");
  requireAnonymousSchema(participantSheet, requestSheet);

  var fingerprint = getSubmissionFingerprint(payload);
  var existing = findRequest(payload.requestId, payload.demoMode);
  if (existing) {
    if (existing.values[1] !== payload.sessionId || existing.values[8] !== fingerprint) throw new Error("REQUEST_ID_CONFLICT");
    if ((existing.values[3] === "allocated" || existing.values[3] === "paused") && existing.values[4]) {
      var replay = JSON.parse(existing.values[4]);
      replay.idempotentReplay = true;
      return replay;
    }
    throw new Error("REQUEST_PENDING_RETRY");
  }

  if (!payload.demoMode && getSettingValue("allocationEnabled") !== "true") {
    return allocationPausedResult(payload, names, requestSheet, now, "ALLOCATION_PAUSED");
  }

  var prizeId = null;
  var allocationMethod = null;
  var prizeRows = prizeSheet.getDataRange().getValues();
  var premium = findPrize("shopping_bag", payload.demoMode);
  if (payload.premiumPrizeEligible && premium && Number(premium.values[5]) > 0 &&
      (premium.values[7] === true || String(premium.values[7]).toLowerCase() === "true")) {
    prizeId = "shopping_bag";
    allocationMethod = "premium_priority";
  } else {
    prizeId = weightedPrize(prizeRows, Math.random());
    allocationMethod = payload.premiumPrizeEligible ? "premium_fallback" : "general_weighted";
  }
  if (!prizeId) return allocationPausedResult(payload, names, requestSheet, now, "ALLOCATION_PAUSED");

  var prize = findPrize(prizeId, payload.demoMode);
  var remaining = Number(prize.values[5]);
  var allocated = Number(prize.values[6]) || 0;
  if (remaining <= 0) return allocationPausedResult(payload, names, requestSheet, now, "ALLOCATION_PAUSED");
  var participantId = (payload.demoMode ? "staging_" : "participant_") + Utilities.getUuid();
  var allocationId = "allocation_" + Utilities.getUuid();
  var redemptionCode = (payload.demoMode ? "STG-" : "GR26-") + payload.requestId.slice(-8).toUpperCase();
  var result = {
    ok: true,
    demoMode: payload.demoMode,
    participantId: participantId,
    requestId: payload.requestId,
    sessionId: payload.sessionId,
    allocationStatus: "allocated",
    runnerType: payload.runnerType,
    prize: {
      prizeId: prizeId,
      nameZh: prize.values[1],
      nameEn: prize.values[2],
      imagePath: String(prize.values[8] || "").trim() || getPrizeImagePath(prizeId)
    },
    redemptionCode: redemptionCode,
    allocationMethod: allocationMethod,
    sustainabilityRewardEligible: payload.sustainabilityRewardEligible
  };

  requestSheet.appendRow([
    payload.requestId, payload.sessionId, participantId, "processing", JSON.stringify(result), now, now,
    payload.submissionVersion, fingerprint
  ]);
  prizeSheet.getRange(prize.row, 6).setValue(remaining - 1);
  prizeSheet.getRange(prize.row, 7).setValue(allocated + 1);
  participantSheet.appendRow(getParticipantRow(payload, participantId, now, prizeId, "allocated", redemptionCode, "unverified"));
  allocationSheet.appendRow([
    allocationId, participantId, payload.requestId, prizeId, now, allocationMethod, "allocated"
  ]);
  inventorySheet.appendRow([
    "inventory_" + Utilities.getUuid(), now, prizeId, "allocation", -1, remaining, remaining - 1,
    allocationMethod, allocationId, payload.demoMode ? "staging-system" : "public-api"
  ]);

  var completedRequest = findRequest(payload.requestId, payload.demoMode);
  if (completedRequest) {
    requestSheet.getRange(completedRequest.row, 4).setValue("allocated");
    requestSheet.getRange(completedRequest.row, 5).setValue(JSON.stringify(result));
    requestSheet.getRange(completedRequest.row, 7).setValue(new Date());
  }
  return result;
}

function allocationPausedResult(payload, names, requestSheet, now, code) {
  var participantId = (payload.demoMode ? "staging_" : "participant_") + Utilities.getUuid();
  var result = {
    ok: true,
    retryable: false,
    demoMode: payload.demoMode,
    code: code || "ALLOCATION_PAUSED",
    message: {
      zh: "現場獎品已贈送完畢，謝謝您的參與~",
      en: "All prizes have been given out. Thank you for participating!"
    },
    participantId: participantId,
    sessionId: payload.sessionId,
    allocationStatus: "paused",
    runnerType: payload.runnerType,
    prize: null,
    sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
    requestId: payload.requestId
  };
  var participantSheet = SpreadsheetApp.getActive().getSheetByName(names.participants);
  requestSheet.appendRow([
    payload.requestId, payload.sessionId, participantId, "paused", JSON.stringify(result), now, now,
    payload.submissionVersion, getSubmissionFingerprint(payload)
  ]);
  participantSheet.appendRow(getParticipantRow(payload, participantId, now, "", "paused", "", "not_applicable"));
  return result;
}

function getParticipantRow(payload, participantId, now, prizeId, status, redemptionCode, redemptionStatus) {
  return [
    participantId, payload.requestId, now, payload.runnerType, payload.existingSelfHydration,
    payload.hydrationCommitment, payload.sustainabilityRewardEligible, payload.premiumPrizeEligible,
    false, "", "", "", "", prizeId, status, now, redemptionCode, redemptionStatus,
    payload.quizVersion, payload.hydrationStyle, payload.q4Answer, payload.submissionVersion,
    payload.answers.q1, payload.answers.q2, payload.answers.q3, payload.answers.q5
  ];
}

function getSubmissionFingerprint(payload) {
  return JSON.stringify({
    answers: [payload.answers.q1, payload.answers.q2, payload.answers.q3, payload.answers.q4, payload.answers.q5],
    runnerType: payload.runnerType,
    hydrationStyle: payload.hydrationStyle,
    hydrationCommitment: payload.hydrationCommitment,
    sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
    premiumPrizeEligible: payload.premiumPrizeEligible,
    submissionVersion: payload.submissionVersion
  });
}
