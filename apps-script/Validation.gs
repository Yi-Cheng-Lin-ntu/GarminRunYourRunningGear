var RUNNER_TYPES = ["experience", "lifestyle", "performance"];
var HYDRATION_COMMITMENTS = ["existing", "joined", "considering"];

function validateParticipationPayload(raw) {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_PAYLOAD");
  if (typeof raw.requestId !== "string" || raw.requestId.length < 1 || raw.requestId.length > 128) {
    throw new Error("INVALID_REQUEST_ID");
  }
  if (typeof raw.sessionId !== "string" || raw.sessionId.length < 1 || raw.sessionId.length > 128) {
    throw new Error("INVALID_SESSION_ID");
  }
  if (RUNNER_TYPES.indexOf(raw.runnerType) < 0) throw new Error("INVALID_RUNNER_TYPE");
  if (HYDRATION_COMMITMENTS.indexOf(raw.hydrationCommitment) < 0) throw new Error("INVALID_HYDRATION_COMMITMENT");
  if (typeof raw.existingSelfHydration !== "boolean") throw new Error("INVALID_EXISTING_SELF_HYDRATION");
  if (!raw.answers || typeof raw.answers !== "object" || Array.isArray(raw.answers)) {
    throw new Error("INVALID_ANSWERS");
  }

  var classified = classifyServerAnswers(raw.answers);
  if (classified.runnerType !== raw.runnerType || classified.sustainability !== raw.existingSelfHydration) {
    throw new Error("ELIGIBILITY_MISMATCH");
  }
  if (raw.hydrationCommitment === "existing" && !raw.existingSelfHydration) {
    throw new Error("ELIGIBILITY_MISMATCH");
  }
  if (raw.hydrationCommitment === "joined" && raw.existingSelfHydration) {
    throw new Error("ELIGIBILITY_MISMATCH");
  }
  if (raw.hydrationCommitment === "considering" && raw.existingSelfHydration) {
    throw new Error("ELIGIBILITY_MISMATCH");
  }
  if (raw.raffleOptIn !== true && raw.raffleOptIn !== false) throw new Error("INVALID_RAFFLE_OPTION");
  if (raw.raffleOptIn === true) {
    if (typeof raw.name !== "string" || raw.name.trim().length === 0 || raw.name.length > 80) {
      throw new Error("INVALID_RAFFLE_NAME");
    }
    if (typeof raw.email !== "string" || raw.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) {
      throw new Error("INVALID_RAFFLE_EMAIL");
    }
    if (raw.privacyAcknowledgedAt !== undefined && raw.privacyAcknowledgedAt !== null) {
      if (typeof raw.privacyAcknowledgedAt !== "string" || isNaN(Date.parse(raw.privacyAcknowledgedAt))) {
        throw new Error("INVALID_PRIVACY_ACKNOWLEDGEMENT");
      }
    }
    var privacySettingKey = raw.demoMode === true ? "demoPrivacyNoticeVersion" : "privacyNoticeVersion";
    var expectedPrivacyVersion = getSettingValue(privacySettingKey);
    if (!expectedPrivacyVersion ||
        expectedPrivacyVersion.indexOf("DRAFT") === 0 ||
        (!raw.demoMode && expectedPrivacyVersion.indexOf("DEMO") === 0) ||
        raw.privacyNoticeVersion !== expectedPrivacyVersion) {
      throw new Error("PRIVACY_NOTICE_NOT_APPROVED");
    }
  }

  return {
    requestId: raw.requestId,
    sessionId: raw.sessionId,
    runnerType: classified.runnerType,
    existingSelfHydration: classified.sustainability,
    hydrationCommitment: raw.hydrationCommitment,
    sustainabilityRewardEligible: classified.sustainability || raw.hydrationCommitment === "joined",
    premiumPrizeEligible: classified.sustainability,
    raffleOptIn: raw.raffleOptIn,
    name: raw.raffleOptIn === true ? sanitizeText(raw.name, 80) : "",
    email: raw.raffleOptIn === true ? sanitizeText(raw.email, 254) : "",
    privacyNoticeVersion: raw.raffleOptIn === true ? raw.privacyNoticeVersion : "",
    privacyAcknowledgedAt: raw.raffleOptIn === true ? raw.privacyAcknowledgedAt || "" : "",
    demoMode: raw.demoMode === true
  };
}

function classifyServerAnswers(answers) {
  var allowed = {
    q1: { q1_experience: "experience", q1_lifestyle: "lifestyle", q1_performance: "performance" },
    q2: { q2_experience: "experience", q2_lifestyle: "lifestyle", q2_performance: "performance", q2_sustainability: null },
    q3: { q3_experience: "experience", q3_lifestyle: "lifestyle", q3_performance: "performance", q3_meme: null },
    q4: { q4_experience: "experience", q4_lifestyle: "lifestyle", q4_performance: "performance", q4_sustainability: null },
    q5: { q5_experience: "experience", q5_lifestyle: "lifestyle", q5_performance: "performance", q5_meme: null }
  };
  var scores = { experience: 0, lifestyle: 0, performance: 0 };
  var sustainability = false;
  var keys = ["q1", "q2", "q3", "q4", "q5"];

  for (var i = 0; i < keys.length; i++) {
    var questionId = keys[i];
    var optionId = answers[questionId];
    var registry = allowed[questionId];
    if (!registry || typeof optionId !== "string" || !registry.hasOwnProperty(optionId)) {
      throw new Error("INVALID_ANSWER");
    }
    var trait = registry[optionId];
    if (trait) scores[trait]++;
    if ((questionId === "q2" && optionId === "q2_sustainability") ||
        (questionId === "q4" && optionId === "q4_sustainability")) {
      sustainability = true;
    }
  }

  var highest = Math.max(scores.experience, scores.lifestyle, scores.performance);
  var candidates = [];
  if (scores.experience === highest) candidates.push("experience");
  if (scores.lifestyle === highest) candidates.push("lifestyle");
  if (scores.performance === highest) candidates.push("performance");
  var tieBreakOrder = ["experience", "lifestyle", "performance"];
  var runnerType = tieBreakOrder.filter(function (type) { return candidates.indexOf(type) >= 0; })[0] || "experience";
  return { runnerType: runnerType, sustainability: sustainability, scores: scores };
}

function sanitizeText(value, maxLength) {
  var text = String(value == null ? "" : value).trim().slice(0, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
