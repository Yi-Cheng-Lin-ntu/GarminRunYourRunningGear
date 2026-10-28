import { classificationRules } from "./classificationRules.js";
import { classifyAnswers } from "./classificationEngine.js";
import { loadContent } from "./contentData.js";

let quizData;
let runnerTypes;
let resultData;
let uiContent;

const translations = {
  zh: {
    "start.eyebrow": "GARMIN RUN 2026",
    "start.label": "跑者風格測驗",
    "start.title": "找到你的跑者節奏",
    "start.description": "五個跑步情境，測出最像你的跑者風格，看看哪種補水方式適合你。",
    "start.button": "開始測驗",
    "start.note": "約 1 分鐘完成・無需登入",
  },
  en: {
    "start.eyebrow": "GARMIN RUN 2026",
    "start.label": "RUNNER STYLE QUIZ",
    "start.title": "Find your running rhythm",
    "start.description": "Five running moments reveal your runner style and the hydration approach that fits you.",
    "start.button": "Start quiz",
    "start.note": "About 1 minute・No sign-in",
  }
};

const state = {
  currentQuestionIndex: 0,
  answers: {},
  optionOrder: {},
  result: null,
  language: "zh"
};

const elements = {
  startButton: document.querySelector('[data-action="start"]'),
  startDescription: document.querySelector('[data-i18n="start.description"]'),
  start: document.querySelector("#start"),
  quiz: document.querySelector("#quiz"),
  result: document.querySelector("#result"),
  questionCount: document.querySelector("[data-question-count]"),
  questionNumber: document.querySelector("[data-question-number]"),
  questionPrompt: document.querySelector("[data-question-prompt]"),
  optionsList: document.querySelector("[data-options-list]"),
  progressTrack: document.querySelector("[data-progress-track]"),
  nextButton: document.querySelector('[data-action="next"]'),
  resultVisual: document.querySelector("[data-result-visual]"),
  resultTitle: document.querySelector("[data-result-title]"),
  resultDescription: document.querySelector("[data-result-description]"),
  resultDetail: document.querySelector("[data-result-detail]"),
  hydrationTitle: document.querySelector("[data-result-hydration-title]"),
  hydrationDescription: document.querySelector("[data-result-hydration-description]"),
  resultCta: document.querySelector("[data-result-cta]"),
  resultGear: document.querySelector("[data-result-gear]"),
  gearPanel: document.querySelector("[data-gear-panel]"),
  recommendationSection: document.querySelector("[data-recommendation-section]"),
  languageLabel: document.querySelector("[data-language-label]")
};

function text(value) {
  return value?.[state.language] || value?.zh || value?.en || "";
}

function updateStaticText() {
  document.documentElement.lang = state.language === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const value = uiContent?.[key]?.[state.language] || translations[state.language][key];
    if (value) {
      element.textContent = value;
    }
  });
  elements.languageLabel.textContent = state.language === "zh" ? "EN" : "中";
}

function showScreen(screen) {
  [elements.start, elements.quiz, elements.result].forEach((item) => {
    const isVisible = item === screen;
    item.hidden = !isVisible;
    item.classList.toggle("is-active", isVisible);
    if (isVisible) {
      item.classList.remove("is-entering");
      requestAnimationFrame(() => item.classList.add("is-entering"));
    }
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function shuffleOptions(options) {
  const shuffledOptions = [...options];

  for (let index = shuffledOptions.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledOptions[index], shuffledOptions[randomIndex]] = [
      shuffledOptions[randomIndex],
      shuffledOptions[index]
    ];
  }

  return shuffledOptions;
}

function createOptionOrder() {
  return Object.fromEntries(
    quizData.questions.map((question) => [question.id, shuffleOptions(question.options)])
  );
}

function renderQuestion() {
  const question = quizData.questions[state.currentQuestionIndex];
  const options = state.optionOrder[question.id] || question.options;
  const selectedAnswer = state.answers[question.id];
  const questionNumber = state.currentQuestionIndex + 1;
  const totalQuestions = quizData.questions.length;

  elements.questionCount.textContent = `${String(questionNumber).padStart(2, "0")} / ${String(totalQuestions).padStart(2, "0")}`;
  elements.questionNumber.textContent = String(questionNumber).padStart(2, "0");
  elements.questionPrompt.textContent = text(question.prompt);
  elements.progressTrack.querySelectorAll("span").forEach((segment, index) => {
    segment.classList.toggle("is-complete", index < questionNumber - 1);
    segment.classList.toggle("is-current", index === questionNumber - 1);
  });
  elements.nextButton.disabled = !selectedAnswer;
  elements.nextButton.textContent = questionNumber === totalQuestions
    ? uiContent["quiz.seeResult"][state.language]
    : uiContent["navigation.next"][state.language];

  elements.optionsList.innerHTML = options.map((option, index) => {
    const isSelected = option.id === selectedAnswer;
    return `
      <div class="option-card${isSelected ? " is-selected" : ""}">
        <input id="${option.id}" name="${question.id}" type="radio" value="${option.id}" ${isSelected ? "checked" : ""} />
        <label for="${option.id}">
          <span class="option-index">${String.fromCharCode(65 + index)}</span>
          <span class="option-text">${text(option.text)}</span>
        </label>
      </div>`;
  }).join("");
}

function renderResult() {
  const result = resultData[state.result.runnerType];
  const isSustainability = state.result.sustainability;
  elements.recommendationSection.classList.toggle("is-sustainability", isSustainability);

  const identityPrefix = state.language === "zh" ? "你是｜" : "You are | ";
  elements.resultTitle.textContent = `${identityPrefix}${text(result.title)}`;
  elements.resultDescription.textContent = text(result.description);
  elements.resultDetail.textContent = text(result.detail);
  elements.resultGear.textContent = text(result.gear);

  if (isSustainability) {
    elements.hydrationTitle.textContent = text(result.sustainability.title);
    elements.hydrationDescription.textContent = text(result.sustainability.description);
    elements.resultCta.textContent = state.language === "zh" ? "永續先鋒隊" : "Sustainability Pioneer";
    elements.gearPanel.hidden = true;
  } else {
    elements.hydrationTitle.textContent = text(result.hydration.title);
    elements.hydrationDescription.textContent = text(result.hydration.description);
    elements.resultCta.textContent = text(result.cta);
    elements.gearPanel.hidden = false;
  }

  elements.resultVisual.innerHTML = "";
  elements.resultVisual.classList.toggle("has-image", Boolean(result.image?.src));
  if (result.image?.src) {
    const image = document.createElement("img");
    image.src = result.image.src;
    image.alt = text(result.image.alt);
    elements.resultVisual.append(image);
  } else {
    const marks = { experience: "EX\nPER", lifestyle: "LI\nFE", performance: "PB\n01" };
    const runnerMark = document.createElement("span");
    runnerMark.className = "result-visual-placeholder";
    runnerMark.textContent = marks[state.result.runnerType] || "RUN\n01";
    elements.resultVisual.append(runnerMark);
  }
}

function startQuiz() {
  state.currentQuestionIndex = 0;
  state.answers = {};
  state.optionOrder = createOptionOrder();
  state.result = null;
  renderQuestion();
  showScreen(elements.quiz);
}

function selectAnswer(optionId) {
  const question = quizData.questions[state.currentQuestionIndex];
  state.answers[question.id] = optionId;
  renderQuestion();
}

function goNext() {
  if (!state.answers[quizData.questions[state.currentQuestionIndex].id]) {
    return;
  }

  if (state.currentQuestionIndex < quizData.questions.length - 1) {
    state.currentQuestionIndex += 1;
    renderQuestion();
    return;
  }

  state.result = classifyAnswers({
    questions: quizData.questions,
    answers: state.answers,
    runnerTypes,
    rules: classificationRules
  });
  renderResult();
  showScreen(elements.result);
}

function goBack() {
  if (state.currentQuestionIndex === 0) {
    showScreen(elements.start);
    return;
  }
  state.currentQuestionIndex -= 1;
  renderQuestion();
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) {
    return;
  }

  if (action === "start") startQuiz();
  if (action === "next") goNext();
  if (action === "back") goBack();
  if (action === "retry") startQuiz();
  if (action === "toggle-language") {
    state.language = state.language === "zh" ? "en" : "zh";
    if (uiContent) updateStaticText();
    if (!elements.quiz.hidden) renderQuestion();
    if (!elements.result.hidden && state.result) renderResult();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("input[type=radio]")) {
    selectAnswer(event.target.value);
  }
});

elements.startButton.disabled = true;
loadContent().then((content) => {
  ({ quizData, runnerTypes, resultData, ui: uiContent } = content);
  elements.startButton.disabled = false;
  updateStaticText();
}).catch((error) => {
  console.error(error);
  elements.startDescription.textContent = "無法載入測驗內容，請確認 content.csv 可正常讀取後重新整理。";
});
