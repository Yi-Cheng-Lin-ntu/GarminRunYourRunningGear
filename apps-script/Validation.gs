var RUNNER_TYPES = ["experience", "lifestyle", "performance"];
var HYDRATION_COMMITMENTS = ["existing", "joined", "considering"];

function validateParticipationPayload(raw) {
  if (!raw || typeof raw !== "object") throw new Error("INVALID_PAYLOAD");
  if (raw.quizVersion !== 2) throw new Error("UNSUPPORTED_QUIZ_VERSION");
  ["requestId", "sessionId"].forEach(function (key) {
    if (typeof raw[key] !== "string" || !raw[key].trim() || raw[key].length > 128) {
      throw new Error(key === "requestId" ? "INVALID_REQUEST_ID" : "INVALID_SESSION_ID");
    }
  });
  var classified = classifyServerAnswers(raw.answers);
  var existing = classified.sustainability;
  if (raw.runnerType !== classified.runnerType || raw.hydrationStyle !== classified.hydrationStyle ||
      raw.q4Answer !== classified.q4Answer || raw.existingSelfHydration !== existing ||
      (existing ? raw.hydrationCommitment !== "existing" : ["joined", "considering"].indexOf(raw.hydrationCommitment) < 0) ||
      raw.premiumPrizeEligible !== existing ||
      raw.sustainabilityRewardEligible !== (existing || raw.hydrationCommitment === "joined")) {
    throw new Error("ELIGIBILITY_MISMATCH");
  }
  if (raw.raffleOptIn !== true) throw new Error("INVALID_RAFFLE_OPTION");
  if (typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 80) throw new Error("INVALID_RAFFLE_NAME");
  if (typeof raw.email !== "string" || raw.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) throw new Error("INVALID_RAFFLE_EMAIL");
  if (raw.privacyConfirmed !== true || typeof raw.privacyAcknowledgedAt !== "string" || isNaN(Date.parse(raw.privacyAcknowledgedAt))) {
    throw new Error("INVALID_PRIVACY_ACKNOWLEDGEMENT");
  }
  var demo = raw.demoMode === true;
  var expected = getSettingValue(demo ? "demoPrivacyNoticeVersion" : "privacyNoticeVersion");
  if (!expected || (!demo && /^(DRAFT|DEMO)/i.test(expected)) || /^DRAFT/i.test(expected) || raw.privacyNoticeVersion !== expected) {
    throw new Error("PRIVACY_NOTICE_NOT_APPROVED");
  }
  if (demo && (raw.testDataConfirmed !== true || !/@(?:[a-z0-9-]+\.)*(?:example\.(?:com|org|net)|[a-z0-9-]+\.(?:test|invalid))$/i.test(raw.email))) {
    throw new Error("TEST_DATA_REQUIRED");
  }
  return {
    quizVersion: 2, requestId: raw.requestId, sessionId: raw.sessionId,
    runnerType: classified.runnerType, hydrationStyle: classified.hydrationStyle, q4Answer: classified.q4Answer,
    existingSelfHydration: existing, hydrationCommitment: raw.hydrationCommitment,
    sustainabilityRewardEligible: existing || raw.hydrationCommitment === "joined", premiumPrizeEligible: existing,
    raffleOptIn: true, name: sanitizeText(raw.name, 80), email: sanitizeText(raw.email, 254),
    privacyNoticeVersion: expected, privacyAcknowledgedAt: raw.privacyAcknowledgedAt, demoMode: demo
  };
}

function classifyServerAnswers(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new Error("INVALID_ANSWERS");
  var scores = { experience: 0, lifestyle: 0, performance: 0 };
  ["q1", "q2", "q3", "q5"].forEach(function (id) {
    var type = RUNNER_TYPES.filter(function (candidate) { return answers[id] === id + "_" + candidate; })[0];
    if (!type) throw new Error("INVALID_ANSWER");
    scores[type]++;
  });
  var style = ["precision", "rest", "pioneer"].filter(function (candidate) { return answers.q4 === "q4_" + candidate; })[0];
  if (!style) throw new Error("INVALID_ANSWER");
  var highest = Math.max(scores.experience, scores.lifestyle, scores.performance);
  var candidates = RUNNER_TYPES.filter(function (type) { return scores[type] === highest; });
  return {
    runnerType: candidates.length === 1 ? candidates[0] : answers.q2.slice(3),
    scores: scores, hydrationStyle: style, q4Answer: answers.q4,
    sustainability: style === "pioneer", existingSelfHydration: style === "pioneer"
  };
}

function sanitizeText(value, maxLength) {
  var text = String(value == null ? "" : value).trim().slice(0, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
