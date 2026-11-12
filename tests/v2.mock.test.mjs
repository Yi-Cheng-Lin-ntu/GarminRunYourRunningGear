import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key)
};
globalThis.sessionStorage = {
  getItem: (key) => store.get(`session:${key}`) ?? null,
  setItem: (key, value) => store.set(`session:${key}`, String(value)),
  removeItem: (key) => store.delete(`session:${key}`)
};
const api = await import("../js/apiClient.js");
function data(style = "rest", commitment = "considering", requestId = "anon-mock") {
  const existing = style === "pioneer";
  return {
    submissionVersion: 1, quizVersion: 2, requestId, sessionId: "mock-session",
    answers: { q1: "q1_experience", q2: "q2_experience", q3: "q3_experience", q4: `q4_${style}`, q5: "q5_experience" },
    runnerType: "experience", hydrationStyle: style, q4Answer: `q4_${style}`, existingSelfHydration: existing,
    hydrationCommitment: existing ? "existing" : commitment,
    premiumPrizeEligible: existing, sustainabilityRewardEligible: existing || commitment === "joined"
  };
}
test("Development Mock assigns anonymous entries and replays request IDs without duplicate stock changes", async () => {
  api.resetMockTestData();
  assert.equal(api.API_STATUS.environment, "development");
  for (const [style, commitment] of [["pioneer", "existing"], ["rest", "joined"], ["precision", "considering"]]) {
    const payload = data(style, commitment, `anon-${style}`);
    const first = await api.submitAnonymousResult(payload);
    const stock = { ...api.getMockSnapshot().stock };
    const replay = await api.submitAnonymousResult(payload);
    assert.equal(replay.idempotentReplay, true);
    assert.deepEqual(api.getMockSnapshot().stock, stock);
    assert.equal(first.prize.prizeId === "shopping_bag", style === "pioneer");
  }
  const snapshot = api.getMockSnapshot();
  assert.equal(snapshot.participants.length, 3);
  assert.ok(snapshot.participants.every((p) => p.submissionVersion === 1 && p.quizVersion === 2 && p.q4Answer === `q4_${p.hydrationStyle}`));
  assert.ok(snapshot.participants.every((p) => !("name" in p) && !("email" in p) && !("raffleOptIn" in p)));
  const invalid = await api.submitAnonymousResult({ ...data(), email: "disallowed@example.invalid" });
  assert.equal(invalid.code, "PERSONAL_DATA_NOT_ALLOWED");
  api.applyMockScenario("all_empty");
  const paused = await api.submitAnonymousResult(data("rest", "joined", "anon-paused"));
  assert.equal(paused.allocationStatus, "paused");
  assert.equal(api.getMockSnapshot().participants.at(-1).q4Answer, "q4_rest");
});

test("legacy Mock localStorage contact values are removed when the app loads", async () => {
  store.set("garminRunMockParticipants", JSON.stringify([{ participantId: "legacy", name: "old", email: "old@example.invalid", raffleOptIn: true, runnerType: "experience" }]));
  await import("../js/apiClient.js?legacy-cleanup=1");
  const stored = JSON.parse(store.get("garminRunMockParticipants"));
  assert.deepEqual(stored, [{ participantId: "legacy", runnerType: "experience" }]);
});
