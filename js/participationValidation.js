const RUNNER_TYPES = ["experience", "lifestyle", "performance"];
const HYDRATION_STYLES = ["precision", "rest", "pioneer"];
const PERSONAL_FIELDS = ["name", "email", "phone", "address", "raffleOptIn", "privacyConfirmed",
  "privacyNoticeVersion", "privacyAcknowledgedAt", "testDataConfirmed", "demoMode"];

function fail(code) { throw new Error(code); }

export function validateAnonymousPayload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("INVALID_PAYLOAD");
  if (raw.submissionVersion !== 1 || raw.quizVersion !== 2) fail("UNSUPPORTED_SUBMISSION_VERSION");
  if (PERSONAL_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(raw, field))) fail("PERSONAL_DATA_NOT_ALLOWED");
  for (const key of ["requestId", "sessionId"]) {
    if (typeof raw[key] !== "string" || !raw[key].trim() || raw[key].length > 128) fail(key === "requestId" ? "INVALID_REQUEST_ID" : "INVALID_SESSION_ID");
  }
  const answers = raw.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) fail("INVALID_ANSWERS");
  const score = Object.fromEntries(RUNNER_TYPES.map((type) => [type, 0]));
  for (const question of ["q1", "q2", "q3", "q5"]) {
    const answer = answers[question];
    const type = RUNNER_TYPES.find((candidate) => answer === `${question}_${candidate}`);
    if (!type) fail("INVALID_ANSWER");
    score[type] += 1;
  }
  const hydrationStyle = HYDRATION_STYLES.find((style) => answers.q4 === `q4_${style}`);
  if (!hydrationStyle) fail("INVALID_ANSWER");
  const max = Math.max(...Object.values(score));
  const top = RUNNER_TYPES.filter((type) => score[type] === max);
  const runnerType = top.length === 1 ? top[0] : answers.q2.slice(3);
  const existingSelfHydration = hydrationStyle === "pioneer";
  const expectedCommitment = existingSelfHydration ? "existing" : raw.hydrationCommitment;
  if (!existingSelfHydration && !["joined", "considering"].includes(expectedCommitment)) fail("INVALID_HYDRATION_COMMITMENT");
  const sustainabilityRewardEligible = existingSelfHydration || expectedCommitment === "joined";
  const premiumPrizeEligible = existingSelfHydration;
  if (raw.runnerType !== runnerType || raw.hydrationStyle !== hydrationStyle || raw.q4Answer !== answers.q4 ||
      raw.existingSelfHydration !== existingSelfHydration || raw.hydrationCommitment !== expectedCommitment ||
      raw.sustainabilityRewardEligible !== sustainabilityRewardEligible || raw.premiumPrizeEligible !== premiumPrizeEligible) {
    fail("ELIGIBILITY_MISMATCH");
  }
  return {
    submissionVersion: 1,
    quizVersion: 2,
    requestId: raw.requestId,
    sessionId: raw.sessionId,
    answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3, q4: answers.q4, q5: answers.q5 },
    runnerType,
    hydrationStyle,
    q4Answer: answers.q4,
    existingSelfHydration,
    hydrationCommitment: expectedCommitment,
    sustainabilityRewardEligible,
    premiumPrizeEligible
  };
}
