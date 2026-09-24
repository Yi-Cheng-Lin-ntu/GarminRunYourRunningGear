function getOptionForAnswer(question, answers) {
  const selectedOptionId = answers[question.id];
  return question.options.find((option) => option.id === selectedOptionId);
}

function getTraits(option) {
  return Array.isArray(option?.traits) ? option.traits : [];
}

function isRunnerTypeQuestion(question) {
  return question.id !== "q6";
}

export function countRunnerTraits(questions, answers, runnerTypes) {
  const scores = Object.fromEntries(runnerTypes.map((type) => [type, 0]));

  questions.filter(isRunnerTypeQuestion).forEach((question) => {
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
  const scores = countRunnerTraits(questions, answers, runnerTypes);
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
