import test from "node:test";
import assert from "node:assert/strict";
import { derivePrizeEligibility } from "../js/prizeEligibility.js";

test("existing hydration gets existing commitment and premium eligibility", () => {
  const result = derivePrizeEligibility({
    runnerType: "experience",
    existingSelfHydration: true
  });

  assert.equal(result.hydrationCommitment, "existing");
  assert.equal(result.sustainabilityRewardEligible, true);
  assert.equal(result.premiumPrizeEligible, true);
});

test("joined commitment is sustainable but not premium eligible", () => {
  const result = derivePrizeEligibility({
    runnerType: "lifestyle",
    existingSelfHydration: false,
    hydrationCommitment: "joined"
  });

  assert.equal(result.sustainabilityRewardEligible, true);
  assert.equal(result.premiumPrizeEligible, false);
});

test("considering commitment has neither sustainable reward nor premium eligibility", () => {
  const result = derivePrizeEligibility({
    runnerType: "performance",
    existingSelfHydration: false,
    hydrationCommitment: "considering"
  });

  assert.equal(result.sustainabilityRewardEligible, false);
  assert.equal(result.premiumPrizeEligible, false);
});
