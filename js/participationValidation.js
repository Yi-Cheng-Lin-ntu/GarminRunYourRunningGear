import { classifyV2AnswerIds } from "./classificationEngine.js";

export function isTestEmail(email) {
  return /@(?:[a-z0-9-]+\.)*(?:example\.(?:com|org|net)|[a-z0-9-]+\.(?:test|invalid))$/i.test(email);
}

// V2 validation is shared by the UI and Mock adapter. Never logs contact data.
export function validateV2Payload(raw, { mode = "mock" } = {}) {
  const fail = (code) => { throw new Error(code); };
  if (!raw || raw.quizVersion !== 2) fail("UNSUPPORTED_QUIZ_VERSION");
  for (const key of ["requestId", "sessionId"]) {
    if (typeof raw[key] !== "string" || !raw[key].trim() || raw[key].length > 128) fail(key === "requestId" ? "INVALID_REQUEST_ID" : "INVALID_SESSION_ID");
  }
  const classified = classifyV2AnswerIds(raw.answers);
  const existing = classified.sustainability;
  const commitment = raw.hydrationCommitment;
  if (classified.runnerType !== raw.runnerType || classified.hydrationStyle !== raw.hydrationStyle
    || classified.q4Answer !== raw.q4Answer || existing !== raw.existingSelfHydration
    || (existing ? commitment !== "existing" : !["joined", "considering"].includes(commitment))
    || raw.premiumPrizeEligible !== existing
    || raw.sustainabilityRewardEligible !== (existing || commitment === "joined")) fail("ELIGIBILITY_MISMATCH");
  if (raw.raffleOptIn !== true) fail("INVALID_RAFFLE_OPTION");
  if (typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 80) fail("INVALID_RAFFLE_NAME");
  if (typeof raw.email !== "string" || raw.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) fail("INVALID_RAFFLE_EMAIL");
  if (raw.privacyConfirmed !== true || typeof raw.privacyAcknowledgedAt !== "string" || !Number.isFinite(Date.parse(raw.privacyAcknowledgedAt))) fail("INVALID_PRIVACY_ACKNOWLEDGEMENT");
  if (mode === "production") fail("PRIVACY_NOTICE_NOT_APPROVED");
  if (raw.privacyNoticeVersion !== (mode === "demo" ? "DEMO_ONLY" : "DRAFT_NOT_APPROVED")) fail("PRIVACY_NOTICE_NOT_APPROVED");
  if (mode === "demo" && (raw.testDataConfirmed !== true || !isTestEmail(raw.email))) fail("TEST_DATA_REQUIRED");
  return { ...raw, name: raw.name.trim(), email: raw.email.trim() };
}
