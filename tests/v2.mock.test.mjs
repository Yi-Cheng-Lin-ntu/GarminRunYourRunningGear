import test from "node:test";
import assert from "node:assert/strict";
const store = new Map();
globalThis.localStorage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) };
const api = await import("../js/apiClient.js");
function data(style = "rest", commitment = "considering", requestId = "v2-mock") {
  const existing = style === "pioneer";
  return {
    quizVersion: 2, demoMode: true, requestId, sessionId: "mock-session",
    answers: { q1: "q1_experience", q2: "q2_experience", q3: "q3_experience", q4: `q4_${style}`, q5: "q5_experience" },
    runnerType: "experience", hydrationStyle: style, q4Answer: `q4_${style}`, existingSelfHydration: existing,
    hydrationCommitment: existing ? "existing" : commitment,
    premiumPrizeEligible: existing, sustainabilityRewardEligible: existing || commitment === "joined",
    raffleOptIn: true, name: "Mock Runner", email: "mock@example.com",
    privacyNoticeVersion: "DRAFT_NOT_APPROVED", privacyConfirmed: true, privacyAcknowledgedAt: "2026-11-09T00:00:00Z"
  };
}
test("V2 Mock preserves request idempotency, all contact registration, Q4 metadata and qualification", async () => {
  api.resetMockTestData();
  for (const [style, commitment] of [["pioneer", "existing"], ["rest", "joined"], ["precision", "considering"]]) {
    const payload = data(style, commitment, `v2-${style}`);
    const first = await api.submitParticipation(payload);
    const stock = { ...api.getMockSnapshot().stock };
    const replay = await api.submitParticipation(payload);
    assert.equal(replay.idempotentReplay, true);
    assert.deepEqual(api.getMockSnapshot().stock, stock);
    assert.equal(first.prize.prizeId === "shopping_bag", style === "pioneer");
  }
  const snapshot = api.getMockSnapshot();
  assert.equal(snapshot.participants.length, 3);
  assert.ok(snapshot.participants.every((p) => p.raffleOptIn && p.quizVersion === 2 && p.q4Answer === `q4_${p.hydrationStyle}`));
  const invalid = await api.submitParticipation({ ...data(), name: "" });
  assert.equal(invalid.code, "INVALID_RAFFLE_NAME");
  api.applyMockScenario("all_empty");
  const paused = await api.submitParticipation(data("rest", "joined", "v2-paused"));
  assert.equal(paused.allocationStatus, "paused");
  assert.equal(api.getMockSnapshot().participants.at(-1).q4Answer, "q4_rest");
});
