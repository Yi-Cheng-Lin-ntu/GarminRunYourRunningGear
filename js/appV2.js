import { loadContent } from "./contentData.js";
import { classifyAnswers } from "./classificationEngine.js";
import { classificationRules } from "./classificationRules.js";
import { derivePrizeEligibility } from "./prizeEligibility.js";
import { isTestEmail } from "./participationValidation.js";
import { getHydrationEquipment } from "./hydrationEquipment.js";
import { resolveProjectAsset } from "./uiVariant.js";
import { renderRedemptionView } from "./redemptionView.js";
import { APPS_SCRIPT_DEMO_MODE, submitParticipation, getPublicCampaignStatus,
  getMockSnapshot, applyMockScenario, setMockStock, resetMockTestData, clearMockData, prizeCatalog } from "./apiClient.js";
import { clearAllocationRecovery, clearPendingRequest, savePendingRequest } from "./sessionRecovery.js";

const $ = (selector) => document.querySelector(selector);
const elements = {
  start: $("#start"), quiz: $("#quiz"), result: $("#result"), participation: $("#participation"), redemption: $("#redemption"),
  redemptionRunner: $("[data-redemption-runner]"), redemptionTitle: $("[data-redemption-title]"),
  prizeImage: $("[data-prize-image]"), prizeName: $("[data-prize-name]"), sustainabilityMessage: $("[data-sustainability-message]")
};
let content;
const state = { language: "zh", answers: {}, orders: {}, index: 0, result: null, hydrationCommitment: null,
  formErrorKey: null, displayedAllocation: null, requestId: null, sessionId: null, submitInProgress: false };
const text = (value) => value?.[state.language] || value?.zh || value?.en || "";
const copy = (key) => text(content?.ui[key]);
const id = () => globalThis.crypto?.randomUUID?.() || `v2-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function showScreen(screen) {
  for (const item of Object.values(elements).filter((element) => element.classList.contains("screen"))) {
    item.hidden = item !== screen;
    item.classList.toggle("is-active", item === screen);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}
function updateStaticText() {
  document.documentElement.lang = state.language === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = copy(element.dataset.i18n);
    if (value) element.textContent = value;
  });
  $("[data-language-label]").textContent = state.language === "zh" ? "EN" : "中";
  $("[data-mode-notice]").textContent = copy(APPS_SCRIPT_DEMO_MODE ? "v2.demoNotice" : "v2.mode");
  $("[data-submit]").textContent = copy(state.submitInProgress ? "v2.processing" : "participation.submit");
  if (!$("[data-form-error]").hidden && state.formErrorKey) $("[data-form-error]").textContent = copy(state.formErrorKey);
  if (!$("[data-result-error]").hidden) $("[data-result-error]").textContent = copy("v2.chooseError");
}
function reset() {
  Object.assign(state, { answers: {}, orders: {}, index: 0, result: null, hydrationCommitment: null,
    formErrorKey: null, displayedAllocation: null, requestId: null, sessionId: id(), submitInProgress: false });
  $("[data-participation-form]").reset();
  $("[data-form-error]").hidden = true;
  $("[data-result-error]").hidden = true;
  $("[data-submit]").disabled = false;
  document.querySelectorAll("[data-hydration-choice]").forEach((input) => { input.checked = false; });
  $("[data-result-title]").textContent = "";
  $("[data-result-slogan]").textContent = "";
  document.querySelectorAll("[data-result-tag]").forEach((tag) => { tag.textContent = ""; });
  elements.prizeImage.replaceChildren();
  elements.prizeName.textContent = "";
  elements.redemptionRunner.textContent = "";
  elements.redemptionTitle.textContent = "";
  elements.sustainabilityMessage.textContent = "";
  clearAllocationRecovery();
  clearPendingRequest();
  if (content) updateStaticText();
}
function shuffle(options) {
  const result = [...options];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function start() {
  reset();
  state.orders = Object.fromEntries(content.quizData.questions.map((q) => [q.id, shuffle(q.options)]));
  renderQuestion();
  showScreen(elements.quiz);
}
function renderQuestion() {
  const question = content.quizData.questions[state.index];
  $("[data-question-count]").textContent = `${String(state.index + 1).padStart(2, "0")} / 05`;
  $("[data-question-number]").textContent = String(state.index + 1).padStart(2, "0");
  $("[data-question-prompt]").textContent = text(question.prompt);
  $("[data-progress-track]").querySelectorAll("span").forEach((span, i) => {
    span.classList.toggle("is-complete", i < state.index);
    span.classList.toggle("is-current", i === state.index);
  });
  const list = $("[data-options-list]");
  list.replaceChildren();
  state.orders[question.id].forEach((option, index) => {
    const card = document.createElement("div");
    card.className = "option-card";
    card.classList.toggle("is-selected", state.answers[question.id] === option.id);
    const radio = document.createElement("input");
    Object.assign(radio, { type: "radio", id: option.id, name: question.id, value: option.id, checked: state.answers[question.id] === option.id });
    const label = document.createElement("label");
    label.htmlFor = option.id;
    const letter = document.createElement("span");
    letter.className = "option-index";
    letter.textContent = String.fromCharCode(65 + index);
    const description = document.createElement("span");
    description.className = "option-text";
    description.textContent = text(option.text);
    label.append(letter, description);
    card.append(radio, label);
    list.append(card);
  });
  $("[data-action=next]").disabled = !state.answers[question.id];
  $("[data-action=next]").textContent = copy(state.index === 4 ? "quiz.seeResult" : "navigation.next");
}
function renderResult() {
  const result = content.resultData[state.result.runnerType];
  $("[data-result-title]").textContent = text(result.title);
  $("[data-result-slogan]").textContent = text(result.slogan);
  const image = $("[data-dog-image]");
  image.src = resolveProjectAsset(result.image.src);
  image.alt = text(result.image.alt);
  document.querySelectorAll("[data-result-tag]").forEach((tag, index) => {
    const value = result.tags[index]?.[state.language] || "";
    tag.textContent = value;
    if (value) tag.removeAttribute("aria-hidden");
    else tag.setAttribute("aria-hidden", "true");
  });
  const recommendation = content.recommendations[`${state.result.runnerType}:${state.result.hydrationStyle}`];
  $("[data-recommendation-heading]").textContent = text(recommendation.heading);
  $("[data-recommendation-description]").textContent = text(recommendation.description);
  const equipment = getHydrationEquipment(state.result.runnerType, state.result.hydrationStyle);
  const equipmentGallery = $("[data-hydration-equipment]");
  equipmentGallery.replaceChildren();
  equipmentGallery.hidden = equipment.length === 0;
  equipmentGallery.setAttribute("aria-label", state.language === "zh"
    ? "補水裝備圖片"
    : "Hydration equipment images");
  equipment.forEach((item) => {
    const image = document.createElement("img");
    image.className = "hydration-equipment-image";
    image.src = resolveProjectAsset(item.src);
    image.alt = text(item.alt);
    equipmentGallery.append(image);
  });
  $("[data-recommendation-section]").classList.toggle("is-pioneer", state.result.sustainability);
  $("[data-existing-hydration]").hidden = !state.result.sustainability;
  $("[data-hydration-options]").hidden = state.result.sustainability;
  document.querySelectorAll("[data-hydration-choice]").forEach((input) => {
    input.checked = input.value === state.hydrationCommitment;
    input.closest(".choice-card").classList.toggle("is-selected", input.checked);
  });
}
function continueToContact() {
  if (!state.result) return;
  if (!state.result.sustainability && !["joined", "considering"].includes(state.hydrationCommitment)) {
    $("[data-result-error]").textContent = copy("v2.chooseError");
    $("[data-result-error]").hidden = false;
    return;
  }
  $("[data-result-error]").hidden = true;
  showScreen(elements.participation);
}
function renderRedemption(allocation) {
  renderRedemptionView(allocation, { state, elements, resultData: content.resultData, text, prizeCatalog, resolveProjectAsset, showScreen });
}
function renderMockTools() {
  const snapshot = getMockSnapshot();
  const editor = $("[data-mock-stock-editor]");
  editor.replaceChildren();
  for (const prize of snapshot.prizes) {
    const label = document.createElement("label");
    label.textContent = text({ zh: prize.nameZh, en: prize.nameEn });
    const input = document.createElement("input");
    Object.assign(input, { type: "number", min: "0", step: "1", value: prize.remainingStock });
    input.dataset.mockPrize = prize.prizeId;
    label.append(input); editor.append(label);
  }
  const apply = document.createElement("button");
  apply.type = "button"; apply.className = "button button-secondary"; apply.dataset.action = "mock-set-stock";
  apply.textContent = state.language === "zh" ? "套用庫存數量" : "Apply stock";
  editor.append(apply);
  $("[data-mock-prizes]").textContent = snapshot.prizes.map((p) => `${p.prizeId}: ${p.remainingStock}`).join(" | ");
  // Counts only: do not render contact details in the development panel.
  for (const [selector, records] of [["participants", snapshot.participants], ["allocations", snapshot.allocations], ["inventory-log", snapshot.inventoryLog]]) {
    $(`[data-mock-${selector}]`).textContent = `${records.length}`;
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  const action = target?.dataset.action;
  if (!action || !content) return;
  if (state.submitInProgress && ["home", "retry", "restart", "back-result"].includes(action)) { event.preventDefault(); return; }
  if (action === "start") start();
  if (["home", "retry", "restart"].includes(action)) { event.preventDefault(); reset(); showScreen(elements.start); }
  if (action === "next" && state.answers[content.quizData.questions[state.index].id]) {
    if (state.index < 4) { state.index++; renderQuestion(); }
    else {
      state.result = classifyAnswers({ questions: content.quizData.questions, answers: state.answers, runnerTypes: content.runnerTypes, rules: classificationRules });
      state.hydrationCommitment = state.result.sustainability ? "existing" : null;
      renderResult(); showScreen(elements.result);
    }
  }
  if (action === "back") {
    if (state.index > 0) { state.index--; renderQuestion(); }
    else { reset(); showScreen(elements.start); }
  }
  if (action === "continue") continueToContact();
  if (action === "back-result") { renderResult(); showScreen(elements.result); }
  if (action === "toggle-language") {
    state.language = state.language === "zh" ? "en" : "zh";
    updateStaticText();
    if (!elements.quiz.hidden) renderQuestion();
    if (!elements.result.hidden) renderResult();
    if (!elements.redemption.hidden && state.displayedAllocation) renderRedemption(state.displayedAllocation);
    if (!$("[data-mock-panel]").hidden) renderMockTools();
  }
  if (action === "mock-tools") { $("[data-mock-panel]").hidden = false; renderMockTools(); }
  if (action === "close-mock-tools") $("[data-mock-panel]").hidden = true;
  if (action === "mock-scenario") { applyMockScenario(target.dataset.scenario); renderMockTools(); }
  if (action === "mock-reset") { resetMockTestData(); renderMockTools(); }
  if (action === "mock-clear" && window.confirm(state.language === "zh" ? "清除本機 Mock 測試資料？" : "Clear local Mock data?")) { clearMockData(); renderMockTools(); }
  if (action === "mock-set-stock") {
    const stock = Object.fromEntries(Array.from(document.querySelectorAll("[data-mock-prize]")).map((input) => [input.dataset.mockPrize, input.value]));
    if (!setMockStock(stock).ok) window.alert(state.language === "zh" ? "庫存需為非負整數" : "Stock must be non-negative integers");
    renderMockTools();
  }
});
document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.matches("[data-hydration-choice]")) {
    state.hydrationCommitment = input.value;
    $("[data-result-error]").hidden = true;
    renderResult();
  } else if (input.matches(".option-card input")) {
    const focused = document.activeElement === input;
    state.answers[content.quizData.questions[state.index].id] = input.value;
    const selected = input.id;
    renderQuestion();
    if (focused) document.getElementById(selected).focus({ preventScroll: true });
  }
});

$("[data-participation-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.submitInProgress || !state.result) return;
  const name = $("[data-name]").value.trim();
  const email = $("[data-email]").value.trim();
  let errorKey;
  if (!name || name.length > 80) errorKey = "v2.nameError";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errorKey = "v2.emailError";
  else if (!$("[data-privacy-check]").checked) errorKey = "v2.privacyError";
  else if (APPS_SCRIPT_DEMO_MODE && !isTestEmail(email)) errorKey = "v2.demoEmailError";
  const error = $("[data-form-error]");
  if (errorKey) { state.formErrorKey = errorKey; error.textContent = copy(errorKey); error.hidden = false; return; }
  const eligibility = derivePrizeEligibility({ runnerType: state.result.runnerType, existingSelfHydration: state.result.sustainability, hydrationCommitment: state.hydrationCommitment });
  if (!state.requestId) state.requestId = id();
  savePendingRequest({ sessionId: state.sessionId, requestId: state.requestId });
  const payload = {
    ...eligibility, quizVersion: 2, demoMode: true, answers: { ...state.answers },
    hydrationStyle: state.result.hydrationStyle, q4Answer: state.result.q4Answer,
    requestId: state.requestId, sessionId: state.sessionId, raffleOptIn: true, name, email,
    privacyConfirmed: true, testDataConfirmed: true,
    privacyNoticeVersion: APPS_SCRIPT_DEMO_MODE ? "DEMO_ONLY" : "DRAFT_NOT_APPROVED",
    privacyAcknowledgedAt: new Date().toISOString()
  };
  state.submitInProgress = true;
  $("[data-submit]").disabled = true;
  updateStaticText(); error.hidden = true;
  try {
    if (APPS_SCRIPT_DEMO_MODE) {
      const status = await getPublicCampaignStatus();
      if (status.quizVersion !== 2) throw new Error("UNSUPPORTED_QUIZ_VERSION");
    }
    const response = await submitParticipation(payload);
    if (!response.ok) throw new Error(response.code || "SUBMISSION_FAILED");
    clearPendingRequest();
    renderRedemption(response);
  } catch (failure) {
    const known = { UNSUPPORTED_QUIZ_VERSION: "v2.backendOld", INVALID_RAFFLE_NAME: "v2.nameError", INVALID_RAFFLE_EMAIL: "v2.emailError", TEST_DATA_REQUIRED: "v2.demoEmailError", INVALID_PRIVACY_ACKNOWLEDGEMENT: "v2.privacyError" };
    state.formErrorKey = known[failure.message] || "v2.submitError";
    error.textContent = copy(state.formErrorKey);
    error.hidden = false;
  } finally {
    state.submitInProgress = false;
    $("[data-submit]").disabled = false;
    updateStaticText();
  }
});

$("[data-action=start]").disabled = true;
reset();
showScreen(elements.start);
if (APPS_SCRIPT_DEMO_MODE) {
  $(".mock-mode-badge").textContent = "APPS SCRIPT DEMO · V2";
  $(".mock-tools-button").hidden = true;
}
window.addEventListener("pageshow", (event) => { if (event.persisted) { reset(); showScreen(elements.start); } });
loadContent().then((loaded) => {
  content = loaded;
  if (content.version !== 2) throw new Error("V2 content required");
  updateStaticText();
  $("[data-action=start]").disabled = false;
}).catch(() => { $("[data-i18n='v2.startDescription']").textContent = "無法載入 V2 測驗內容，請重新整理。"; });
