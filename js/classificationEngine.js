function getOptionForAnswer(question, answers) {
  const selectedOptionId = answers[question.id];
  return question.options.find((option) => option.id === selectedOptionId);
}

function getTraits(option) {
  return Array.isArray(option?.traits) ? option.traits : [];
}

export function countRunnerTraits(questions, answers, runnerTypes, questionIds = ["q1", "q2", "q3", "q5"]) {
  const scores = Object.fromEntries(runnerTypes.map((type) => [type, 0]));

  questions.filter((question) => !questionIds || questionIds.includes(question.id)).forEach((question) => {
    const option = getOptionForAnswer(question, answers);
    getTraits(option).forEach((trait) => {
      if (trait in scores) {
        scores[trait] += 1;
      }
    });
  });

  return scores;
}

function getHighestScoringTypes(scores, runnerTypes) {
  const highestScore = Math.max(...runnerTypes.map((type) => scores[type]));
  return runnerTypes.filter((type) => scores[type] === highestScore);
}

function selectByTieBreak(candidates, tieBreakOrder, fallbackType) {
  const orderedCandidate = tieBreakOrder.find((type) => candidates.includes(type));
  return orderedCandidate || fallbackType;
}

export function classifyAnswers({ questions, answers, runnerTypes, rules }) {
  if (rules?.version !== 1) return classifyV2AnswerIds(answers);
  const scores = countRunnerTraits(questions, answers, runnerTypes, null);
  const candidates = getHighestScoringTypes(scores, runnerTypes);
  const tieBreakOrder = rules?.tieBreak?.order || runnerTypes;
  const runnerType = candidates.length === 1
    ? candidates[0]
    : selectByTieBreak(candidates, tieBreakOrder, runnerTypes[0]);
  const sustainability = questions.some((question) => {
    const option = getOptionForAnswer(question, answers);
    return option?.sustainability === true;
  });

  return {
    runnerType,
    sustainability,
    scores
  };
}

// V2 IDs are stable regardless of visual option order. Shared by Mock validation.
export function classifyV2AnswerIds(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) throw new Error("INVALID_ANSWERS");
  const types = ["experience", "lifestyle", "performance"];
  const scores = Object.fromEntries(types.map((type) => [type, 0]));
  for (const id of ["q1", "q2", "q3", "q5"]) {
    const type = types.find((candidate) => answers[id] === `${id}_${candidate}`);
    if (!type) throw new Error("INVALID_ANSWER");
    scores[type]++;
  }
  const hydrationStyle = ["precision", "rest", "pioneer"].find((style) => answers.q4 === `q4_${style}`);
  if (!hydrationStyle) throw new Error("INVALID_ANSWER");
  const highest = Math.max(...Object.values(scores));
  const candidates = types.filter((type) => scores[type] === highest);
  const runnerType = candidates.length === 1 ? candidates[0] : answers.q2.slice(3);
  return { runnerType, scores, hydrationStyle, q4Answer: answers.q4,
    sustainability: hydrationStyle === "pioneer", existingSelfHydration: hydrationStyle === "pioneer" };
}
