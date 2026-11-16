import test from "node:test";
import assert from "node:assert/strict";

test("production Pages host ignores Mock query flags and scrubs legacy Mock contacts", async () => {
  const local = new Map([["garminRunMockParticipants", JSON.stringify([
    { participantId: "legacy", name: "legacy value", email: "legacy@example.invalid", raffleOptIn: true, runnerType: "experience" }
  ])]]);
  const session = new Map();
  globalThis.location = { hostname: "yi-cheng-lin-ntu.github.io", search: "?mode=mock" };
  globalThis.localStorage = { getItem: (key) => local.get(key) ?? null, setItem: (key, value) => local.set(key, String(value)), removeItem: (key) => local.delete(key) };
  globalThis.sessionStorage = { getItem: (key) => session.get(key) ?? null, setItem: (key, value) => session.set(key, String(value)), removeItem: (key) => session.delete(key) };

  const api = await import(`../js/apiClient.js?production-isolation=${Date.now()}`);
  assert.equal(api.API_STATUS.environment, "production");
  assert.equal(api.API_STATUS.configured, true);
  assert.equal(api.MOCK_MODE, false);
  assert.deepEqual(JSON.parse(local.get("garminRunMockParticipants")), [
    { participantId: "legacy", runnerType: "experience" }
  ]);
  assert.equal(api.getMockSnapshot().requestCount, 0);
});

test("apps-script-demo selects Demo tabs on the shared Apps Script endpoint", async () => {
  globalThis.location = { hostname: "yi-cheng-lin-ntu.github.io", search: "?mode=apps-script-demo" };
  const demo = await import(`../js/environment.js?demo-routing=${Date.now()}`);
  const demoApi = new URL(demo.API_URL);
  assert.equal(demo.API_ENVIRONMENT, "staging");
  assert.equal(demo.API_DEMO_MODE, true);
  assert.equal(demoApi.searchParams.get("mode"), "apps-script-demo");

  globalThis.location = { hostname: "yi-cheng-lin-ntu.github.io", search: "" };
  const production = await import(`../js/environment.js?production-routing=${Date.now()}`);
  const productionApi = new URL(production.API_URL);
  assert.equal(production.API_ENVIRONMENT, "production");
  assert.equal(production.API_DEMO_MODE, false);
  assert.equal(productionApi.searchParams.has("mode"), false);
  assert.equal(production.API_URL, demo.API_URL.replace("?mode=apps-script-demo", ""));
  assert.equal(production.resolveAPIEnvironment({ hostname: "localhost", search: "" }), "development");
});
