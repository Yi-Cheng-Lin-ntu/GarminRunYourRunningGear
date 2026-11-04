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

function submitParticipation(payload) {
  var now = new Date();
  var names = getModeSheetNames(payload.demoMode);
  var ss = SpreadsheetApp.getActive();
  var requestSheet = ss.getSheetByName(names.requests);
  var prizeSheet = ss.getSheetByName(names.prizes);
  var participantSheet = ss.getSheetByName(names.participants);
  var allocationSheet = ss.getSheetByName(names.allocations);
  var inventorySheet = ss.getSheetByName(names.inventoryLog);
  if (!requestSheet || !prizeSheet || !participantSheet || !allocationSheet || !inventorySheet) {
    throw new Error("SHEET_SETUP_REQUIRED");
  }

  var existing = findRequest(payload.requestId, payload.demoMode);
  if (existing) {
    if (existing.values[3] === "allocated" && existing.values[4]) {
      var replay = JSON.parse(existing.values[4]);
      replay.idempotentReplay = true;
      return replay;
    }
    if (existing.values[3] === "paused" && existing.values[4]) {
      var paused = JSON.parse(existing.values[4]);
      paused.idempotentReplay = true;
      return paused;
    }
    throw new Error("REQUEST_PENDING_RETRY");
  }

  if (!payload.demoMode && getSettingValue("allocationEnabled") !== "true") {
    return allocationPausedResult(payload, names, requestSheet, now);
  }
  if (!payload.demoMode && getSettingValue("raffleEnabled") !== "true" && payload.raffleOptIn) {
    return allocationPausedResult(payload, names, requestSheet, now, "RAFFLE_DISABLED");
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
  if (!prizeId) {
    return allocationPausedResult(payload, names, requestSheet, now);
  }

  var prize = findPrize(prizeId, payload.demoMode);
  var remaining = Number(prize.values[5]);
  var allocated = Number(prize.values[6]) || 0;
  if (remaining <= 0) return allocationPausedResult(payload, names, requestSheet, now);

  var participantId = payload.demoMode
    ? "demo_" + Utilities.getUuid()
    : "participant_" + Utilities.getUuid();
  var allocationId = "allocation_" + Utilities.getUuid();
  var redemptionCode = payload.demoMode
    ? "DEMO-" + payload.requestId.slice(-6).toUpperCase()
    : "GR26-" + payload.requestId.slice(-8).toUpperCase();

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
    payload.requestId, payload.sessionId, participantId, "processing", JSON.stringify(result), now, now
  ]);

  prizeSheet.getRange(prize.row, 6).setValue(remaining - 1);
  prizeSheet.getRange(prize.row, 7).setValue(allocated + 1);

  participantSheet.appendRow([
    participantId, payload.requestId, now, payload.runnerType, payload.existingSelfHydration,
    payload.hydrationCommitment, payload.sustainabilityRewardEligible, payload.premiumPrizeEligible,
    payload.raffleOptIn, payload.name, payload.email, payload.privacyNoticeVersion,
    payload.privacyAcknowledgedAt, prizeId, "allocated", now, redemptionCode, "unverified"
  ]);
  allocationSheet.appendRow([
    allocationId, participantId, payload.requestId, prizeId, now, allocationMethod, "allocated"
  ]);
  inventorySheet.appendRow([
    "inventory_" + Utilities.getUuid(), now, prizeId, "allocation", -1, remaining, remaining - 1,
    allocationMethod, allocationId, payload.demoMode ? "demo-system" : "public-api"
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
  var participantId = payload.demoMode
    ? "demo_" + Utilities.getUuid()
    : "participant_" + Utilities.getUuid();
  var pausedZh = code === "RAFFLE_DISABLED"
    ? "賽後抽獎目前暫停，但感謝你的參與"
    : "現場獎品已贈送完畢，謝謝您的參與~";
  var pausedEn = code === "RAFFLE_DISABLED"
    ? "Raffle registration is paused, but thank you for participating."
    : "All prizes have been given out. Thank you for participating!";
  var result = {
    ok: true,
    retryable: false,
    demoMode: payload.demoMode,
    code: code || "ALLOCATION_PAUSED",
    message: {
      zh: pausedZh,
      en: pausedEn
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
  participantSheet.appendRow([
    participantId, payload.requestId, now, payload.runnerType, payload.existingSelfHydration,
    payload.hydrationCommitment, payload.sustainabilityRewardEligible, payload.premiumPrizeEligible,
    payload.raffleOptIn, payload.name, payload.email, payload.privacyNoticeVersion,
    payload.privacyAcknowledgedAt, "", "paused", now, "", "not_applicable"
  ]);
  requestSheet.appendRow([
    payload.requestId, payload.sessionId, participantId, "paused", JSON.stringify(result), now, now
  ]);
  return result;
}
