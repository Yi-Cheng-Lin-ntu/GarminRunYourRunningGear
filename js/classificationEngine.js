function getOptionForAnswer(question, answers) {
  const selectedOptionId = answers[question.id];
  return question.options.find((option) => option.id === selectedOptionId);
}

function getTraits(option) {
  if (!option) {
    return [];
  }

  if (Array.isArray(option.traits)) {
    return option.traits;
  }

  return option.type ? [option.type] : [];
}

export function countTraits(questions, answers, runnerTypes) {
  const counts = Object.fromEntries(runnerTypes.map((type) => [type, 0]));

  questions.forEach((question) => {
    getTraits(getOptionForAnswer(question, answers)).forEach((trait) => {
      if (trait in counts) {
        counts[trait] += 1;
      }
    });
  });

  return counts;
}

function getHighestScoringTypes(counts) {
  const highestScore = Math.max(...Object.values(counts));
  return Object.keys(counts).filter((type) => counts[type] === highestScore);
}

function breakTieByQuestion(priorityQuestions, candidates, questions, answers) {
  for (const questionId of priorityQuestions) {
    const question = questions.find((item) => item.id === questionId);
    const selectedOption = question && getOptionForAnswer(question, answers);
    const selectedTraits = getTraits(selectedOption);
    const matchingCandidate = selectedTraits.find((trait) => candidates.includes(trait));

    if (matchingCandidate) {
      return matchingCandidate;
    }
  }

  return null;
}

export function classifyAnswers({ questions, answers, runnerTypes, rules }) {
  const counts = countTraits(questions, answers, runnerTypes);
  const candidates = getHighestScoringTypes(counts);

  if (candidates.length === 1) {
    return { type: candidates[0], counts };
  }

  const priorityQuestions = rules?.tieBreak?.priorityQuestions || [];
  const priorityResult = breakTieByQuestion(priorityQuestions, candidates, questions, answers);

  if (priorityResult) {
    return { type: priorityResult, counts };
  }

  if (rules?.tieBreak?.fallback === "last_answer") {
    for (let index = questions.length - 1; index >= 0; index -= 1) {
      const selectedOption = getOptionForAnswer(questions[index], answers);
      const matchingCandidate = getTraits(selectedOption).find((trait) => candidates.includes(trait));

      if (matchingCandidate) {
        return { type: matchingCandidate, counts };
      }
    }
  }

  return { type: rules?.tieBreak?.fallbackType || runnerTypes[0], counts };
}
