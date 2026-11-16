import test from "node:test";
import assert from "node:assert/strict";

test("production Pages host ignores Mock query flags, scrubs legacy Mock contacts, and fails closed", async () => {
  const local = new Map([["garminRunMockParticipants", JSON.stringify([
    { participantId: "legacy", name: "legacy value", email: "legacy@example.invalid", raffleOptIn: true, runnerType: "experience" }
  ])]]);
  const session = new Map();
  globalThis.location = { hostname: "yi-cheng-lin-ntu.github.io", search: "?mode=mock" };
  globalThis.localStorage = { getItem: (key) => local.get(key) ?? null, setItem: (key, value) => local.set(key, String(value)), removeItem: (key) => local.delete(key) };
  globalThis.sessionStorage = { getItem: (key) => session.get(key) ?? null, setItem: (key, value) => session.set(key, String(value)), removeItem: (key) => session.delete(key) };
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error("Unexpected network call"); };

  const api = await import(`../js/apiClient.js?production-isolation=${Date.now()}`);
  assert.equal(api.API_STATUS.environment, "production");
  assert.equal(api.API_STATUS.configured, false);
  assert.equal(api.MOCK_MODE, false);
  assert.deepEqual(JSON.parse(local.get("garminRunMockParticipants")), [
    { participantId: "legacy", runnerType: "experience" }
  ]);

  const result = await api.submitAnonymousResult({
    submissionVersion: 1,
    quizVersion: 2,
    requestId: "production-unconfigured-request",
    sessionId: "production-session",
    answers: { q1: "q1_experience", q2: "q2_experience", q3: "q3_experience", q4: "q4_rest", q5: "q5_experience" },
    runnerType: "experience",
    hydrationStyle: "rest",
    q4Answer: "q4_rest",
    existingSelfHydration: false,
    hydrationCommitment: "considering",
    sustainabilityRewardEligible: false,
    premiumPrizeEligible: false
  });
  assert.equal(result.code, "API_NOT_CONFIGURED");
  assert.equal(fetchCalls, 0);
  assert.equal(api.getMockSnapshot().requestCount, 0);
});

test("apps-script-demo URL selects staging while ordinary entries keep their host environment", async () => {
  const { resolveAPIEnvironment } = await import(`../js/environment.js?routing-test=${Date.now()}`);
  assert.equal(resolveAPIEnvironment({ hostname: "yi-cheng-lin-ntu.github.io", search: "?mode=apps-script-demo" }), "staging");
  assert.equal(resolveAPIEnvironment({ hostname: "yi-cheng-lin-ntu.github.io", search: "" }), "production");
  assert.equal(resolveAPIEnvironment({ hostname: "localhost", search: "" }), "development");
});
