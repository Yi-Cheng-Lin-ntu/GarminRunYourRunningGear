export function derivePrizeEligibility({ runnerType, existingSelfHydration, hydrationCommitment = null }) {
  const commitment = existingSelfHydration ? "existing" : hydrationCommitment;

  return {
    runnerType,
    existingSelfHydration: Boolean(existingSelfHydration),
    hydrationCommitment: commitment,
    sustainabilityRewardEligible: Boolean(existingSelfHydration) || commitment === "joined",
    premiumPrizeEligible: Boolean(existingSelfHydration)
  };
}
