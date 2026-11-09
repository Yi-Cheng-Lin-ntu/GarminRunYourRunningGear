export const classificationRules = {
  version: 1,
  runnerTypes: ["experience", "lifestyle", "performance"],
  tieBreak: {
    order: ["experience", "lifestyle", "performance"],
    fallback: "first_in_order"
  }
};
