var RUNNER_TYPES = ["experience", "lifestyle", "performance"];
var HYDRATION_STYLES = ["precision", "rest", "pioneer"];
var HYDRATION_COMMITMENTS = ["existing", "joined", "considering"];
var FORBIDDEN_PERSONAL_FIELDS = ["name", "email", "phone", "address", "raffleOptIn",
  "privacyConfirmed", "privacyNoticeVersion", "privacyAcknowledgedAt", "testDataConfirmed"];

function validateAnonymousSubmission(raw, demoMode) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("INVALID_PAYLOAD");
  if (raw.submissionVersion !== 1 || raw.quizVersion !== 2) throw new Error("UNSUPPORTED_SUBMISSION_VERSION");
  FORBIDDEN_PERSONAL_FIELDS.forEach(function (field) {
    if (Object.prototype.hasOwnProperty.call(raw, field)) throw new Error("PERSONAL_DATA_NOT_ALLOWED");
  });
  ["requestId", "sessionId"].forEach(function (key) {
    if (typeof raw[key] !== "string" || !raw[key].trim() || raw[key].length > 128) {
      throw new Error(key === "requestId" ? "INVALID_REQUEST_ID" : "INVALID_SESSION_ID");
    }
  });
  var classified = classifyServerAnswers(raw.answers);
  var existing = classified.existingSelfHydration;
  var commitment = existing ? "existing" : raw.hydrationCommitment;
  if (HYDRATION_COMMITMENTS.indexOf(commitment) < 0 || (existing && raw.hydrationCommitment !== "existing")) {
    throw new Error("INVALID_HYDRATION_COMMITMENT");
  }
  var sustainabilityEligible = existing || commitment === "joined";
  if (raw.runnerType !== classified.runnerType || raw.hydrationStyle !== classified.hydrationStyle ||
      raw.q4Answer !== classified.q4Answer || raw.existingSelfHydration !== existing ||
      raw.hydrationCommitment !== commitment || raw.sustainabilityRewardEligible !== sustainabilityEligible ||
      raw.premiumPrizeEligible !== existing) {
    throw new Error("ELIGIBILITY_MISMATCH");
  }
  return {
    submissionVersion: 1,
    quizVersion: 2,
    requestId: raw.requestId,
    sessionId: raw.sessionId,
    answers: { q1: raw.answers.q1, q2: raw.answers.q2, q3: raw.answers.q3, q4: raw.answers.q4, q5: raw.answers.q5 },
    runnerType: classified.runnerType,
    hydrationStyle: classified.hydrationStyle,
    q4Answer: classified.q4Answer,
    existingSelfHydration: existing,
    hydrationCommitment: commitment,
    sustainabilityRewardEligible: sustainabilityEligible,
    premiumPrizeEligible: existing,
    demoMode: demoMode === true
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
  var style = HYDRATION_STYLES.filter(function (candidate) { return answers.q4 === "q4_" + candidate; })[0];
  if (!style) throw new Error("INVALID_ANSWER");
  var highest = Math.max(scores.experience, scores.lifestyle, scores.performance);
  var candidates = RUNNER_TYPES.filter(function (type) { return scores[type] === highest; });
  return {
    runnerType: candidates.length === 1 ? candidates[0] : answers.q2.slice(3),
    scores: scores,
    hydrationStyle: style,
    q4Answer: answers.q4,
    existingSelfHydration: style === "pioneer",
    sustainability: style === "pioneer"
  };
}
