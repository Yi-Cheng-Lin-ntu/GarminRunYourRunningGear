import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = { getItem: (key) => store.has(key) ? store.get(key) : null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) };
globalThis.sessionStorage = { getItem: (key) => store.get(`session:${key}`) ?? null, setItem: (key, value) => store.set(`session:${key}`, String(value)), removeItem: (key) => store.delete(`session:${key}`) };

const mockApi = await import(`../js/apiClient.js?mock-backend=${Date.now()}`);
const { derivePrizeEligibility } = await import("../js/prizeEligibility.js");
function payload(requestId, { runnerType = "lifestyle", hydrationStyle = "rest", hydrationCommitment = "considering" } = {}) {
  const existing = hydrationStyle === "pioneer";
  const answers = Object.fromEntries(["q1", "q2", "q3", "q5"].map((q) => [q, `${q}_${runnerType}`]));
  answers.q4 = `q4_${hydrationStyle}`;
  return {
    submissionVersion: 1, quizVersion: 2, requestId, sessionId: `session-${requestId}`, answers,
    ...derivePrizeEligibility({ runnerType, existingSelfHydration: existing, hydrationCommitment }),
    hydrationStyle, q4Answer: answers.q4
  };
}

test("sustainability eligibility distinguishes existing, joined, and considering", () => {
  const existing = derivePrizeEligibility({ runnerType: "experience", existingSelfHydration: true });
  const joined = derivePrizeEligibility({ runnerType: "lifestyle", existingSelfHydration: false, hydrationCommitment: "joined" });
  const considering = derivePrizeEligibility({ runnerType: "performance", existingSelfHydration: false, hydrationCommitment: "considering" });
  assert.equal(existing.premiumPrizeEligible, true);
  assert.equal(existing.sustainabilityRewardEligible, true);
  assert.equal(joined.premiumPrizeEligible, false);
  assert.equal(joined.sustainabilityRewardEligible, true);
  assert.equal(considering.premiumPrizeEligible, false);
  assert.equal(considering.sustainabilityRewardEligible, false);
});

test("premium shopping bag is allocated only to existing hydration", async () => {
  mockApi.resetMockTestData();
  mockApi.applyMockScenario("premium_available");
  const existing = await mockApi.submitAnonymousResult(payload("premium-existing", { runnerType: "experience", hydrationStyle: "pioneer" }));
  assert.equal(existing.ok, true);
  assert.equal(existing.prize.prizeId, "shopping_bag");
  assert.equal(existing.allocationMethod, "premium_priority");
  assert.equal(mockApi.getMockSnapshot().stock.shopping_bag, 0);
  mockApi.applyMockScenario("premium_available");
  const joined = await mockApi.submitAnonymousResult(payload("premium-joined", { hydrationCommitment: "joined" }));
  assert.notEqual(joined.prize.prizeId, "shopping_bag");
});

test("premium fallback moves to general pool when shopping bag is empty", async () => {
  mockApi.resetMockTestData();
  mockApi.applyMockScenario("premium_empty");
  const result = await mockApi.submitAnonymousResult(payload("premium-fallback", { runnerType: "performance", hydrationStyle: "pioneer" }));
  assert.equal(result.ok, true);
  assert.equal(result.allocationMethod, "premium_fallback");
  assert.notEqual(result.prize.prizeId, "shopping_bag");
});

test("all-empty allocation records anonymous request and paused result without prize records", async () => {
  mockApi.resetMockTestData();
  mockApi.applyMockScenario("general_empty");
  const before = mockApi.getMockSnapshot();
  const result = await mockApi.submitAnonymousResult(payload("general-empty"));
  const after = mockApi.getMockSnapshot();
  assert.equal(result.ok, true);
  assert.equal(result.code, "ALLOCATION_PAUSED");
  assert.equal(result.allocationStatus, "paused");
  assert.equal(result.prize, null);
  assert.equal(after.requestCount, before.requestCount + 1);
  assert.equal(after.allocations.length, before.allocations.length);
  assert.equal(after.participants.length, before.participants.length + 1);
  assert.equal(after.participants.at(-1).allocationStatus, "paused");
  assert.ok(after.participants.every((p) => !("name" in p) && !("email" in p)));
  assert.equal(Object.values(after.stock).filter((value) => value < 0).length, 0);
});

test("same requestId is replayed without duplicate deduction or records", async () => {
  mockApi.resetMockTestData();
  const request = payload("repeat-request");
  const first = await mockApi.submitAnonymousResult(request);
  const stockAfterFirst = mockApi.getMockSnapshot().stock;
  const replay = await mockApi.submitAnonymousResult(request);
  const snapshot = mockApi.getMockSnapshot();
  assert.equal(replay.idempotentReplay, true);
  assert.equal(first.prize.prizeId, replay.prize.prizeId);
  assert.equal(snapshot.requestCount, 1);
  assert.equal(snapshot.allocations.length, 1);
  assert.equal(snapshot.participants.length, 1);
  assert.deepEqual(snapshot.stock, stockAfterFirst);
});

test("anonymous validator rejects contact fields and inconsistent answer-derived eligibility", async () => {
  mockApi.resetMockTestData();
  const contact = await mockApi.submitAnonymousResult({ ...payload("personal"), name: "must not be retained" });
  assert.equal(contact.ok, false);
  assert.equal(contact.code, "PERSONAL_DATA_NOT_ALLOWED");
  const inconsistent = await mockApi.submitAnonymousResult({ ...payload("mismatch"), hydrationStyle: "pioneer" });
  assert.equal(inconsistent.ok, false);
  assert.equal(inconsistent.code, "ELIGIBILITY_MISMATCH");
  assert.equal(mockApi.getMockSnapshot().requestCount, 0);
});

test("stock validation rejects negative and fractional quantities", () => {
  assert.equal(mockApi.setMockStock({ cap: -1 }).ok, false);
  assert.equal(mockApi.setMockStock({ socks: 1.5 }).ok, false);
  assert.equal(mockApi.setMockStock({ arm_sleeves: 3 }).ok, true);
});

test("weighted simulation matches remaining-stock proportions", () => {
  const stock = { cap: 150, soft_cup: 260, socks: 470, arm_sleeves: 125 };
  const counts = { cap: 0, soft_cup: 0, socks: 0, arm_sleeves: 0 };
  const draws = 30000;
  for (let index = 0; index < draws; index += 1) counts[mockApi.weightedPrize(stock)] += 1;
  const totalStock = Object.values(stock).reduce((sum, value) => sum + value, 0);
  for (const prizeId of Object.keys(stock)) {
    const observed = counts[prizeId] / draws;
    const expected = stock[prizeId] / totalStock;
    assert.ok(Math.abs(observed - expected) < 0.012, `${prizeId}: observed=${observed}, expected=${expected}`);
  }
});
