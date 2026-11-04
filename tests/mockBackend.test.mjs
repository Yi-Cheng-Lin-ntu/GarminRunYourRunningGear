import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.has(key) ? store.get(key) : null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key)
};

const mockApi = await import(`../js/apiClient.js?test=${Date.now()}`);
const { derivePrizeEligibility } = await import("../js/prizeEligibility.js");

function basePayload(requestId, overrides = {}) {
  return {
    requestId,
    sessionId: `session-${requestId}`,
    runnerType: "lifestyle",
    existingSelfHydration: false,
    hydrationCommitment: "considering",
    sustainabilityRewardEligible: false,
    premiumPrizeEligible: false,
    raffleOptIn: false,
    ...overrides
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

  const existing = await mockApi.submitParticipation(basePayload("premium-existing", {
    runnerType: "experience",
    existingSelfHydration: true,
    hydrationCommitment: "existing",
    sustainabilityRewardEligible: true,
    premiumPrizeEligible: true
  }));
  assert.equal(existing.ok, true);
  assert.equal(existing.prize.prizeId, "shopping_bag");
  assert.equal(existing.allocationMethod, "premium_priority");
  assert.equal(mockApi.getMockSnapshot().stock.shopping_bag, 0);

  mockApi.applyMockScenario("premium_available");
  const joined = await mockApi.submitParticipation(basePayload("premium-joined", {
    existingSelfHydration: false,
    hydrationCommitment: "joined",
    sustainabilityRewardEligible: true,
    premiumPrizeEligible: false
  }));
  assert.notEqual(joined.prize.prizeId, "shopping_bag");
});

test("premium fallback moves to general pool when shopping bag is empty", async () => {
  mockApi.resetMockTestData();
  mockApi.applyMockScenario("premium_empty");
  const result = await mockApi.submitParticipation(basePayload("premium-fallback", {
    runnerType: "performance",
    existingSelfHydration: true,
    hydrationCommitment: "existing",
    sustainabilityRewardEligible: true,
    premiumPrizeEligible: true
  }));
  assert.equal(result.ok, true);
  assert.equal(result.allocationMethod, "premium_fallback");
  assert.notEqual(result.prize.prizeId, "shopping_bag");
});

test("general-empty allocation pauses without deducting stock or creating records", async () => {
  mockApi.resetMockTestData();
  mockApi.applyMockScenario("general_empty");
  const before = mockApi.getMockSnapshot();
  const result = await mockApi.submitParticipation(basePayload("general-empty"));
  const after = mockApi.getMockSnapshot();

  assert.equal(result.ok, false);
  assert.equal(result.code, "ALLOCATION_PAUSED");
  assert.equal(after.requestCount, before.requestCount);
  assert.equal(after.allocations.length, before.allocations.length);
  assert.equal(Object.values(after.stock).filter((value) => value < 0).length, 0);
});

test("same requestId is replayed without duplicate deduction or records", async () => {
  mockApi.resetMockTestData();
  const payload = basePayload("repeat-request");
  const first = await mockApi.submitParticipation(payload);
  const stockAfterFirst = mockApi.getMockSnapshot().stock;
  const replay = await mockApi.submitParticipation(payload);
  const snapshot = mockApi.getMockSnapshot();

  assert.equal(replay.idempotentReplay, true);
  assert.equal(first.prize.prizeId, replay.prize.prizeId);
  assert.equal(snapshot.requestCount, 1);
  assert.equal(snapshot.allocations.length, 1);
  assert.equal(snapshot.participants.length, 1);
  assert.deepEqual(snapshot.stock, stockAfterFirst);
});

test("raffle opt-in validates name and email, while opt-out requires none", async () => {
  mockApi.resetMockTestData();
  const invalid = await mockApi.submitParticipation(basePayload("invalid-raffle", {
    raffleOptIn: true,
    name: "",
    email: "not-an-email"
  }));
  assert.equal(invalid.ok, false);
  assert.equal(invalid.code, "INVALID_RAFFLE_NAME");

  const valid = await mockApi.submitParticipation(basePayload("valid-raffle", {
    raffleOptIn: true,
    name: "測試跑者",
    email: "test@example.com"
  }));
  assert.equal(valid.ok, true);
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

  for (let index = 0; index < draws; index += 1) {
    counts[mockApi.weightedPrize(stock)] += 1;
  }
  const totalStock = Object.values(stock).reduce((sum, value) => sum + value, 0);
  for (const prizeId of Object.keys(stock)) {
    const observed = counts[prizeId] / draws;
    const expected = stock[prizeId] / totalStock;
    assert.ok(Math.abs(observed - expected) < 0.012, `${prizeId}: observed=${observed}, expected=${expected}`);
  }
});
