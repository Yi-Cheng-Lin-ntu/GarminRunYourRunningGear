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
    "quiz.progress": "Quiz progress",
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
  progressTrack: document.querySelector(".progress-track"),
  questionNumber: document.querySelector("[data-question-number]"),
  questionPrompt: document.querySelector("[data-question-prompt]"),
  optionsList: document.querySelector("[data-options-list]"),
  progressBar: document.querySelector("[data-progress-bar]"),
  nextButton: document.querySelector('[data-action="next"]'),
  resultVisual: document.querySelector("[data-result-visual]"),
  resultTitle: document.querySelector("[data-result-title]"),
  resultDescription: document.querySelector("[data-result-description]"),
  hydrationTitle: document.querySelector("[data-result-hydration-title]"),
  hydrationDescription: document.querySelector("[data-result-hydration-description]"),
  resultCta: document.querySelector("[data-result-cta]"),
  languageLabel: document.querySelector("[data-language-label]")
};

function text(value) {
  return value[state.language] || value.zh || value.en || "";
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
  elements.progressTrack.setAttribute("aria-valuenow", String(questionNumber));
  elements.progressTrack.setAttribute("aria-valuemax", String(totalQuestions));
  elements.progressTrack.setAttribute(
    "aria-label",
    state.language === "zh" ? "測驗進度" : translations.en["quiz.progress"]
  );
  elements.questionNumber.textContent = state.language === "zh"
    ? `QUESTION ${String(questionNumber).padStart(2, "0")}`
    : `QUESTION ${String(questionNumber).padStart(2, "0")}`;
  elements.questionPrompt.textContent = text(question.prompt);
  elements.progressBar.style.width = `${(questionNumber / totalQuestions) * 100}%`;
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
  const resultContent = state.result.sustainability ? result.sustainability : result;
  elements.resultTitle.textContent = text(resultContent.title);
  elements.resultDescription.textContent = text(resultContent.description);
  elements.hydrationTitle.textContent = text(result.hydration.title);
  elements.hydrationDescription.textContent = text(result.hydration.description);
  elements.resultCta.textContent = text(result.cta);

  elements.resultVisual.innerHTML = "";
  elements.resultVisual.classList.toggle("has-image", Boolean(result.image?.src));
  if (result.image?.src) {
    const image = document.createElement("img");
    image.src = result.image.src;
    image.alt = text(result.image.alt);
    elements.resultVisual.append(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "result-visual-placeholder";
    placeholder.textContent = state.language === "zh" ? "IMAGE / COMING SOON" : "IMAGE / COMING SOON";
    elements.resultVisual.append(placeholder);
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
