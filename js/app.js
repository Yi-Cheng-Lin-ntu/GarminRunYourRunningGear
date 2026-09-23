import { quizData, runnerTypes } from "./quizData.js";
import { classificationRules } from "./classificationRules.js";
import { classifyAnswers } from "./classificationEngine.js";
import { resultData } from "./resultData.js";

const translations = {
  zh: {
    "start.eyebrow": "GARMIN RUN 2026",
    "start.label": "跑者風格測驗",
    "start.title": "找到你的跑者節奏",
    "start.description": "五個跑步情境，測出最像你的跑者風格，看看哪種補水方式適合你。",
    "start.button": "開始測驗",
    "start.note": "約 1 分鐘完成・無需登入",
    "navigation.back": "返回",
    "navigation.next": "下一題",
    "result.eyebrow": "YOUR RUNNER STYLE",
    "result.label": "你的跑者風格是",
    "result.hydrationLabel": "適合你的補水方式",
    "result.note": "每一種跑法，都能找到適合自己的補水方式。",
    "result.retry": "重新測驗"
  },
  en: {
    "start.eyebrow": "GARMIN RUN 2026",
    "start.label": "RUNNER STYLE QUIZ",
    "start.title": "Find your running rhythm",
    "start.description": "Five running moments reveal your runner style and the hydration approach that fits you.",
    "start.button": "Start quiz",
    "start.note": "About 1 minute・No sign-in",
    "navigation.back": "Back",
    "navigation.next": "Next",
    "result.eyebrow": "YOUR RUNNER STYLE",
    "result.label": "Your runner style is",
    "result.hydrationLabel": "Your hydration match",
    "result.note": "Every running style can find a hydration approach of its own.",
    "result.retry": "Try again"
  }
};

const state = {
  currentQuestionIndex: 0,
  answers: {},
  result: null,
  language: "zh"
};

const elements = {
  start: document.querySelector("#start"),
  quiz: document.querySelector("#quiz"),
  result: document.querySelector("#result"),
  questionCount: document.querySelector("[data-question-count]"),
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
    const value = translations[state.language][element.dataset.i18n];
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

function renderQuestion() {
  const question = quizData.questions[state.currentQuestionIndex];
  const selectedAnswer = state.answers[question.id];
  const questionNumber = state.currentQuestionIndex + 1;
  const totalQuestions = quizData.questions.length;

  elements.questionCount.textContent = `${questionNumber} / ${totalQuestions}`;
  elements.questionNumber.textContent = state.language === "zh"
    ? `QUESTION ${String(questionNumber).padStart(2, "0")}`
    : `QUESTION ${String(questionNumber).padStart(2, "0")}`;
  elements.questionPrompt.textContent = text(question.prompt);
  elements.progressBar.style.width = `${(questionNumber / totalQuestions) * 100}%`;
  elements.nextButton.disabled = !selectedAnswer;
  elements.nextButton.textContent = questionNumber === totalQuestions
    ? (state.language === "zh" ? "看結果" : "See result")
    : translations[state.language]["navigation.next"];

  elements.optionsList.innerHTML = question.options.map((option, index) => {
    const isSelected = option.id === selectedAnswer;
    return `
      <div class="option-card${isSelected ? " is-selected" : ""}">
        <input id="${option.id}" name="${question.id}" type="radio" value="${option.id}" ${isSelected ? "checked" : ""} />
        <label for="${option.id}">
          <span class="option-index">${String.fromCharCode(65 + index)}</span>
          <span class="option-text">${text(option.text)}</span>
          ${option.detail ? `<span class="option-detail">${text(option.detail)}</span>` : ""}
        </label>
      </div>`;
  }).join("");
}

function renderResult() {
  const result = resultData[state.result.type];
  elements.resultTitle.textContent = text(result.title);
  elements.resultDescription.textContent = text(result.description);
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
    updateStaticText();
    if (!elements.quiz.hidden) renderQuestion();
    if (!elements.result.hidden && state.result) renderResult();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("input[type=radio]")) {
    selectAnswer(event.target.value);
  }
});

updateStaticText();
