import { classificationRules } from "./classificationRules.js";
import { classifyAnswers } from "./classificationEngine.js";
import { loadContent } from "./contentData.js";
import { derivePrizeEligibility } from "./prizeEligibility.js";
import {
  APPS_SCRIPT_DEMO_MODE,
  submitParticipation,
  resetMockTestData,
  clearMockData,
  setMockStock,
  applyMockScenario,
  getMockSnapshot,
  getExistingAllocation,
  prizeCatalog
} from "./apiClient.js";
import {
  clearAllocationRecovery,
  clearPendingRequest,
  readPendingRequest,
  savePendingRequest
} from "./sessionRecovery.js";

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
  displayedAllocation: null,
  language: "zh",
  eligibility: null,
  raffleOptIn: false,
  hydrationCommitment: null,
  submitInProgress: false,
  requestId: null,
  sessionId: null
};

const elements = {
  startButton: document.querySelector('[data-action="start"]'),
  startDescription: document.querySelector('[data-i18n="start.description"]'),
  start: document.querySelector("#start"),
  quiz: document.querySelector("#quiz"),
  result: document.querySelector("#result"),
  participation: document.querySelector("#participation"),
  redemption: document.querySelector("#redemption"),
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
  languageLabel: document.querySelector("[data-language-label]"),
  participationForm: document.querySelector("[data-participation-form]"),
  raffleToggle: document.querySelector("[data-raffle-toggle]"),
  raffleFields: document.querySelector("[data-raffle-fields]"),
  nameInput: document.querySelector("[data-name]"),
  emailInput: document.querySelector("[data-email]"),
  privacyCheck: document.querySelector("[data-privacy-check]"),
  existingHydration: document.querySelector("[data-existing-hydration]"),
  hydrationOptions: document.querySelector("[data-hydration-options]"),
  formError: document.querySelector("[data-form-error]"),
  submitButton: document.querySelector("[data-submit]"),
  redemptionRunner: document.querySelector("[data-redemption-runner]"),
  redemptionTitle: document.querySelector("[data-redemption-title]"),
  prizeImage: document.querySelector("[data-prize-image]"),
  prizeName: document.querySelector("[data-prize-name]"),
  sustainabilityMessage: document.querySelector("[data-sustainability-message]"),
  mockPanel: document.querySelector("[data-mock-panel]"),
  mockStockEditor: document.querySelector("[data-mock-stock-editor]"),
  mockPrizes: document.querySelector("[data-mock-prizes]"),
  mockParticipants: document.querySelector("[data-mock-participants]"),
  mockAllocations: document.querySelector("[data-mock-allocations]"),
  mockInventoryLog: document.querySelector("[data-mock-inventory-log]")
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
  [elements.start, elements.quiz, elements.result, elements.participation, elements.redemption].forEach((item) => {
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

function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `garmin-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resetFlowState({ preservePendingRequest = false } = {}) {
  state.currentQuestionIndex = 0;
  state.answers = {};
  state.optionOrder = {};
  state.result = null;
  state.displayedAllocation = null;
  state.eligibility = null;
  state.raffleOptIn = false;
  state.hydrationCommitment = null;
  state.submitInProgress = false;
  state.requestId = null;
  state.sessionId = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  elements.raffleToggle.checked = false;
  elements.raffleFields.hidden = true;
  elements.nameInput.value = "";
  elements.emailInput.value = "";
  elements.privacyCheck.checked = false;
  elements.formError.hidden = true;
  elements.formError.textContent = "";
  elements.submitButton.disabled = false;
  elements.submitButton.textContent = state.language === "zh"
    ? "確認並領取現場獎品"
    : "Confirm and collect your gift";
  document.querySelectorAll("[data-hydration-choice]").forEach((input) => {
    input.checked = false;
    input.closest(".choice-card")?.classList.remove("is-selected");
  });
  elements.redemptionRunner.textContent = "";
  elements.redemptionTitle.textContent = "";
  elements.prizeName.textContent = "";
  elements.sustainabilityMessage.textContent = "";
  elements.sustainabilityMessage.hidden = true;
  elements.redemptionTitle.hidden = false;
  elements.prizeImage.classList.remove("has-image");
  elements.prizeImage.replaceChildren();
  elements.prizeImage.hidden = false;
  clearAllocationRecovery();
  elements.redemption.classList.remove("is-sustainable");
  elements.redemption.classList.remove("is-non-sustainable");
  elements.prizeImage.classList.remove("is-non-sustainable");
  if (!preservePendingRequest) clearPendingRequest();
}

function startQuiz() {
  resetFlowState();
  state.currentQuestionIndex = 0;
  state.answers = {};
  state.optionOrder = createOptionOrder();
  state.result = null;
  state.displayedAllocation = null;
  state.eligibility = null;
  state.hydrationCommitment = null;
  renderQuestion();
  showScreen(elements.quiz);
}

function goHome() {
  resetFlowState();
  showScreen(elements.start);
}

function renderParticipation() {
  if (!state.result) return;

  state.eligibility = derivePrizeEligibility({
    runnerType: state.result.runnerType,
    existingSelfHydration: state.result.sustainability
  });

  const existing = state.eligibility.existingSelfHydration;
  elements.existingHydration.hidden = !existing;
  elements.hydrationOptions.hidden = existing;
  if (existing) {
    state.hydrationCommitment = "existing";
  } else if (!["joined", "considering"].includes(state.hydrationCommitment)) {
    state.hydrationCommitment = null;
  }

  document.querySelectorAll("[data-hydration-choice]").forEach((input) => {
    input.checked = input.value === state.hydrationCommitment;
  });
  elements.formError.hidden = true;
  showScreen(elements.participation);
}

function renderRedemption(allocation) {
  state.displayedAllocation = allocation;
  const runnerType = allocation.runnerType || state.result?.runnerType;
  const runnerTitle = runnerType && resultData?.[runnerType]
    ? text(resultData[runnerType].title)
    : runnerType || "";
  const identityPrefix = state.language === "zh" ? "跑者類型｜" : "Runner type | ";
  elements.redemptionRunner.textContent = `${identityPrefix}${runnerTitle}`;

  const prize = allocation.prize;
  const allocationPaused = allocation.allocationStatus === "paused";
  elements.prizeName.textContent = allocationPaused
    ? text(allocation.message)
    : prize
      ? text({ zh: prize.nameZh, en: prize.nameEn })
      : (state.language === "zh" ? "獎品資料尚未確認" : "Prize details unavailable");

  elements.prizeImage.classList.remove("has-image");
  elements.prizeImage.replaceChildren();
  const catalogPrize = prize?.prizeId ? prizeCatalog[prize.prizeId] : null;
  const prizeImagePath = prize?.imagePath || catalogPrize?.imagePath || "";
  if (allocationPaused) {
    elements.prizeImage.hidden = true;
  } else if (prizeImagePath) {
    elements.prizeImage.hidden = false;
    const image = document.createElement("img");
    image.src = prizeImagePath;
    image.alt = text({ zh: prize.nameZh, en: prize.nameEn });
    image.onerror = () => {
      elements.prizeImage.classList.remove("has-image");
      elements.prizeImage.replaceChildren();
      const placeholder = document.createElement("span");
      placeholder.textContent = state.language === "zh"
        ? "獎品圖片尚未提供"
        : "Prize image not yet available";
      elements.prizeImage.append(placeholder);
    };
    elements.prizeImage.append(image);
    elements.prizeImage.classList.add("has-image");
  } else {
    elements.prizeImage.hidden = false;
    const placeholder = document.createElement("span");
    placeholder.textContent = state.language === "zh"
      ? "獎品圖片尚未提供"
      : "Prize image not yet available";
    elements.prizeImage.append(placeholder);
  }

  const greenVersion = allocation.sustainabilityRewardEligible === true;
  elements.redemption.classList.toggle("is-sustainable", greenVersion);
  elements.redemption.classList.toggle("is-non-sustainable", !greenVersion);
  elements.prizeImage.classList.toggle("is-non-sustainable", !greenVersion);
  if (allocationPaused) {
    elements.redemptionTitle.textContent = "";
    elements.redemptionTitle.hidden = true;
  } else {
    elements.redemptionTitle.hidden = false;
    elements.redemptionTitle.textContent = state.language === "zh"
      ? "你的獲得獎品"
      : "Your prize";
  }

  if (greenVersion) {
    elements.sustainabilityMessage.hidden = false;
    elements.sustainabilityMessage.textContent = state.language === "zh"
      ? "謝謝你一起響應自帶補水行動｜另可領取永續行動貼紙與飄帶"
      : "Thank you for supporting reusable hydration | You may also receive a sustainability sticker and ribbon";
  } else {
    elements.sustainabilityMessage.hidden = true;
    elements.sustainabilityMessage.textContent = "";
  }
  const redemptionInstruction = document.querySelector(".redemption-instruction");
  if (allocationPaused && redemptionInstruction) {
    redemptionInstruction.hidden = true;
  } else if (redemptionInstruction) {
    redemptionInstruction.hidden = false;
    redemptionInstruction.textContent = state.language === "zh"
      ? "請至攤位找工作人員領取 Garmin 周邊"
      : "Please visit the booth to collect Garmin merchandise from a staff member";
  }
  showScreen(elements.redemption);
}

function renderMockTable(container, columns, rows) {
  if (!container) return;
  container.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.textContent = state.language === "zh" ? "目前沒有資料" : "No records";
    container.append(empty);
    return;
  }
  const table = document.createElement("table");
  table.className = "mock-table";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.label;
    headRow.append(th);
  });
  head.append(headRow);
  table.append(head);
  const body = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((column) => {
      const td = document.createElement("td");
      const value = row[column.key];
      td.textContent = value === true ? "true" : value === false ? "false" : (value ?? "");
      tr.append(td);
    });
    body.append(tr);
  });
  table.append(body);
  container.append(table);
}

function renderMockTools() {
  const snapshot = getMockSnapshot();
  elements.mockStockEditor.replaceChildren();
  snapshot.prizes.forEach((prize) => {
    const label = document.createElement("label");
    label.textContent = state.language === "zh" ? prize.nameZh : prize.nameEn;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.dataset.mockPrize = prize.prizeId;
    input.value = String(prize.remainingStock);
    label.append(input);
    elements.mockStockEditor.append(label);
  });
  const addApplyButton = document.createElement("button");
  addApplyButton.type = "button";
  addApplyButton.className = "button button-primary";
  addApplyButton.dataset.action = "mock-set-stock";
  addApplyButton.textContent = state.language === "zh" ? "套用庫存數量" : "Apply stock quantities";
  elements.mockStockEditor.append(addApplyButton);

  renderMockTable(elements.mockPrizes, [
    { key: "prizeId", label: "Prize ID" },
    { key: "initialStock", label: "Initial" },
    { key: "allocatedCount", label: "Allocated" },
    { key: "remainingStock", label: "Remaining" }
  ], snapshot.prizes);
  renderMockTable(elements.mockParticipants, [
    { key: "participantId", label: "Participant" },
    { key: "runnerType", label: "Type" },
    { key: "existingSelfHydration", label: "Existing" },
    { key: "hydrationCommitment", label: "Commitment" },
    { key: "raffleOptIn", label: "Raffle" },
    { key: "prizeId", label: "Prize" },
    { key: "allocationStatus", label: "Status" }
  ], snapshot.participants);
  renderMockTable(elements.mockAllocations, [
    { key: "allocationId", label: "Allocation" },
    { key: "requestId", label: "Request" },
    { key: "prizeId", label: "Prize" },
    { key: "allocationMethod", label: "Method" },
    { key: "allocationStatus", label: "Status" }
  ], snapshot.allocations);
  renderMockTable(elements.mockInventoryLog, [
    { key: "prizeId", label: "Prize" },
    { key: "quantityDelta", label: "Delta" },
    { key: "beforeStock", label: "Before" },
    { key: "afterStock", label: "After" },
    { key: "reason", label: "Reason" }
  ], snapshot.inventoryLog);
}

function validateParticipation() {
  if (!state.raffleOptIn && !state.eligibility?.existingSelfHydration && !state.hydrationCommitment) {
    return state.language === "zh"
      ? "請選擇「加入永續先鋒行動」或「我會好好考慮的」。"
      : "Please choose one of the two hydration commitment options.";
  }
  if (!state.eligibility?.existingSelfHydration && !state.hydrationCommitment) {
    return state.language === "zh"
      ? "請選擇你對下一場跑步的補水意願。"
      : "Please choose your hydration commitment for your next run.";
  }
  if (state.raffleOptIn) {
    if (!elements.nameInput.value.trim()) {
      return state.language === "zh" ? "參加抽獎需填寫姓名。" : "Name is required to enter the raffle.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(elements.emailInput.value.trim())) {
      return state.language === "zh" ? "請輸入有效的 Email。" : "Please enter a valid email address.";
    }
    if (!elements.privacyCheck.checked) {
      return state.language === "zh" ? "參加抽獎需確認個資告知。" : "Privacy acknowledgement is required for raffle entry.";
    }
  }
  return "";
}

function selectAnswer(optionId) {
  const question = quizData.questions[state.currentQuestionIndex];
  const restoreFocus = elements.optionsList.contains(document.activeElement);
  state.answers[question.id] = optionId;
  renderQuestion();
  if (restoreFocus) document.getElementById(optionId)?.focus({ preventScroll: true });
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
    resetFlowState();
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
  if (action === "home") event.preventDefault();

  if (action === "start") startQuiz();
  if (action === "next") goNext();
  if (action === "back") goBack();
  if (action === "home") goHome();
  if (action === "retry") goHome();
  if (action === "restart") goHome();
  if (action === "continue") renderParticipation();
  if (action === "mock-tools") {
    elements.mockPanel.hidden = false;
    renderMockTools();
  }
  if (action === "close-mock-tools") {
    elements.mockPanel.hidden = true;
  }
  if (action === "mock-scenario") {
    applyMockScenario(event.target.dataset.scenario);
    renderMockTools();
  }
  if (action === "mock-reset") {
    resetMockTestData();
    renderMockTools();
  }
  if (action === "mock-clear") {
    if (window.confirm(state.language === "zh"
      ? "確定清除所有 Mock 測試參與、庫存與分配紀錄？"
      : "Clear all Mock participants, stock, and allocation records?")) {
      clearMockData();
      renderMockTools();
    }
  }
  if (action === "mock-set-stock") {
    const stock = Object.fromEntries(
      Array.from(elements.mockStockEditor.querySelectorAll("[data-mock-prize]"))
        .map((input) => [input.dataset.mockPrize, input.value])
    );
    const result = setMockStock(stock);
    if (!result.ok) {
      window.alert(state.language === "zh" ? "庫存數量必須是 0 或正整數。" : "Stock quantities must be non-negative integers.");
      return;
    }
    renderMockTools();
  }
  if (action === "toggle-language") {
    state.language = state.language === "zh" ? "en" : "zh";
    if (uiContent) updateStaticText();
    if (!elements.quiz.hidden) renderQuestion();
    if (!elements.result.hidden && state.result) renderResult();
    if (!elements.participation.hidden) renderParticipation();
    if (!elements.redemption.hidden && state.displayedAllocation) renderRedemption(state.displayedAllocation);
    if (elements.mockPanel.isConnected && !elements.mockPanel.hidden) renderMockTools();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("input[type=radio]")) {
    if (event.target.matches("[data-hydration-choice]")) {
      state.hydrationCommitment = event.target.value;
      document.querySelectorAll("[data-hydration-choice]").forEach((input) => {
        input.closest(".choice-card").classList.toggle("is-selected", input.checked);
      });
    } else {
      selectAnswer(event.target.value);
    }
  }
  if (event.target.matches("[data-raffle-toggle]")) {
    state.raffleOptIn = event.target.checked;
    elements.raffleFields.hidden = !state.raffleOptIn;
    if (!state.raffleOptIn) {
      elements.nameInput.value = "";
      elements.emailInput.value = "";
      elements.privacyCheck.checked = false;
    }
  }
});

elements.participationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.submitInProgress) return;

  const validationError = validateParticipation();
  if (validationError) {
    elements.formError.textContent = validationError;
    elements.formError.hidden = false;
    return;
  }

  if (!state.requestId) state.requestId = createRequestId();
  savePendingRequest({ sessionId: state.sessionId, requestId: state.requestId });
  const existing = state.eligibility.existingSelfHydration;
  const eligibility = derivePrizeEligibility({
    runnerType: state.result.runnerType,
    existingSelfHydration: existing,
    hydrationCommitment: state.hydrationCommitment
  });

  const payload = {
    demoMode: true,
    requestId: state.requestId,
    sessionId: state.sessionId,
    answers: { ...state.answers },
    runnerType: eligibility.runnerType,
    hydrationCommitment: eligibility.hydrationCommitment,
    existingSelfHydration: eligibility.existingSelfHydration,
    sustainabilityRewardEligible: eligibility.sustainabilityRewardEligible,
    premiumPrizeEligible: eligibility.premiumPrizeEligible,
    raffleOptIn: state.raffleOptIn
  };

  if (state.raffleOptIn) {
    payload.name = elements.nameInput.value.trim();
    payload.email = elements.emailInput.value.trim();
    payload.privacyNoticeVersion = APPS_SCRIPT_DEMO_MODE
      ? "DEMO_ONLY"
      : "DRAFT_NOT_APPROVED";
    payload.privacyAcknowledgedAt = new Date().toISOString();
  }

  state.submitInProgress = true;
  elements.submitButton.disabled = true;
  elements.submitButton.textContent = state.language === "zh" ? "處理中…" : "Processing…";
  elements.formError.hidden = true;

  try {
    const response = await submitParticipation(payload);
    if (!response.ok && response.allocationStatus !== "paused") {
      throw new Error(state.language === "zh" ? response.message.zh : response.message.en);
    }
    clearPendingRequest();
    if (!elements.mockPanel.hidden) renderMockTools();
    renderRedemption(response);
  } catch (error) {
    elements.formError.textContent = error.message || (state.language === "zh"
      ? "提交失敗，請檢查網路後重試。"
      : "Submission failed. Please check your connection and try again.");
    elements.formError.hidden = false;
  } finally {
    state.submitInProgress = false;
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = state.language === "zh"
      ? "確認並領取現場獎品"
      : "Confirm and collect your gift";
  }
});

elements.startButton.disabled = true;
resetFlowState({ preservePendingRequest: true });

if (APPS_SCRIPT_DEMO_MODE) {
  document.querySelector(".mock-mode-badge")?.replaceChildren(
    document.createTextNode("APPS SCRIPT DEMO")
  );
  document.querySelector(".mock-tools-button")?.remove();
  elements.mockPanel?.remove();
}

showScreen(elements.start);
window.addEventListener("pageshow", (event) => {
  if (!event.persisted) return;
  resetFlowState({ preservePendingRequest: true });
  showScreen(elements.start);
});

const pendingRequest = readPendingRequest();
if (pendingRequest?.sessionId && pendingRequest?.requestId) {
  getExistingAllocation()
    .then((result) => {
      if (result?.ok && result?.found) clearPendingRequest();
    })
    .catch(() => {
      // Keep the short-lived pending request for a later reload/retry check.
    });
}

loadContent().then((content) => {
  ({ quizData, runnerTypes, resultData, ui: uiContent } = content);
  elements.startButton.disabled = false;
  updateStaticText();
}).catch((error) => {
  console.error(error);
  elements.startDescription.textContent = "無法載入測驗內容，請確認 content.csv 可正常讀取後重新整理。";
});
