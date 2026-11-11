import { loadContent } from "./contentData.js";
import { classifyAnswers } from "./classificationEngine.js";
import { classificationRules } from "./classificationRules.js";
import { derivePrizeEligibility } from "./prizeEligibility.js";
import { isTestEmail } from "./participationValidation.js";
import { getHydrationEquipment } from "./hydrationEquipment.js";
import { resolveProjectAsset } from "./projectAssets.js";
import { renderRedemptionView } from "./redemptionView.js";
import { renderResultSharePng } from "./shareCard.js";
import { APPS_SCRIPT_DEMO_MODE, submitParticipation, getPublicCampaignStatus,
  getMockSnapshot, applyMockScenario, setMockStock, resetMockTestData, clearMockData, prizeCatalog } from "./apiClient.js";
import { clearAllocationRecovery, clearPendingRequest, savePendingRequest } from "./sessionRecovery.js";

const $ = (selector) => document.querySelector(selector);
const setDownloadButtonsDisabled = (disabled) => document.querySelectorAll('[data-action="download-result"]').forEach((button) => { button.disabled = disabled; });
const RESULT_ILLUSTRATIONS = {
  experience: "./assets/result/賽事收藏家.png",
  lifestyle: "./assets/result/自在巡航員.png",
  performance: "./assets/result/配速計算機.png"
};
const elements = {
  start: $("#start"), quiz: $("#quiz"), result: $("#result"), participation: $("#participation"), redemption: $("#redemption"),
  redemptionRunner: $("[data-redemption-runner]"), redemptionTitle: $("[data-redemption-title]"),
  prizeImage: $("[data-prize-image]"), prizeName: $("[data-prize-name]"), sustainabilityMessage: $("[data-sustainability-message]"),
  shareCanvas: $("[data-share-canvas]"), sharePreview: $("[data-share-preview]"), shareStatus: $("[data-share-status]"),
  sustainabilityResultMark: $("[data-sustainability-result-mark]"),
  igImage: $("[data-ig-image]")
};
let content;
const state = { language: "zh", answers: {}, orders: {}, index: 0, result: null, hydrationCommitment: null,
  formErrorKey: null, displayedAllocation: null, requestId: null, sessionId: null, submitInProgress: false,
  shareCardBlob: null, shareCardUrl: null, shareCardPromise: null };
let shareRenderGeneration = 0;
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
  document.title = copy("meta.title");
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = copy(element.dataset.i18n);
    element.textContent = value;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", copy(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-content]").forEach((element) => {
    element.setAttribute("content", copy(element.dataset.i18nContent));
  });
  $("[data-language-label]").textContent = copy(state.language === "zh" ? "language.toEnglish" : "language.toChinese");
  $(".mock-mode-badge").textContent = copy(APPS_SCRIPT_DEMO_MODE ? "v2.demoBadge" : "v2.mockBadge");
  $("[data-mode-notice]").textContent = copy(APPS_SCRIPT_DEMO_MODE ? "v2.demoNotice" : "v2.mode");
  $("[data-submit]").textContent = copy(state.submitInProgress ? "v2.processing" : "v2.submit");
  if (!$("[data-form-error]").hidden && state.formErrorKey) $("[data-form-error]").textContent = copy(state.formErrorKey);
  if (!$("[data-result-error]").hidden) $("[data-result-error]").textContent = copy("v2.chooseError");
}
function reset() {
  shareRenderGeneration += 1;
  if (state.shareCardUrl) URL.revokeObjectURL(state.shareCardUrl);
  Object.assign(state, { answers: {}, orders: {}, index: 0, result: null, hydrationCommitment: null,
    formErrorKey: null, displayedAllocation: null, requestId: null, sessionId: id(), submitInProgress: false,
    shareCardBlob: null, shareCardUrl: null, shareCardPromise: null });
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
  elements.sharePreview.removeAttribute("src");
  elements.sharePreview.hidden = true;
  elements.shareStatus.textContent = copy("v2.sharePreparing");
  setDownloadButtonsDisabled(true);
  elements.sustainabilityResultMark.removeAttribute("src");
  elements.sustainabilityResultMark.hidden = true;
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
  $("[data-question-number]").textContent = String(state.index + 1).padStart(2, "0");
  const subtitle = $("[data-question-subtitle]");
  const subtitleText = text(question.subtitle);
  subtitle.textContent = subtitleText;
  subtitle.hidden = !subtitleText;
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
function buildResultViewModel() {
  const result = content.resultData[state.result.runnerType];
  const recommendation = content.recommendations[`${state.result.runnerType}:${state.result.hydrationStyle}`];
  return {
    runnerType: state.result.runnerType,
    eyebrow: copy("v2.youAre"),
    title: text(result.title),
    slogan: text(result.slogan),
    image: {
      src: resolveProjectAsset(RESULT_ILLUSTRATIONS[state.result.runnerType]),
      alt: text(result.image.alt)
    },
    tags: result.tags.map((tag) => tag?.[state.language] || ""),
    recommendationLabel: copy("v2.recommendation"),
    pioneerBanner: copy("v2.pioneerThanks"),
    recommendationHeading: text(recommendation.heading),
    recommendationDescription: text(recommendation.description),
    equipment: getHydrationEquipment(state.result.runnerType, state.result.hydrationStyle)
      .map((item) => ({ ...item, src: resolveProjectAsset(item.src) })),
    isPioneer: state.result.hydrationStyle === "pioneer",
    sustainabilityImage: { src: resolveProjectAsset("./assets/永續先鋒隊.png") }
  };
}
function prepareShareCard(model) {
  const generation = ++shareRenderGeneration;
  if (state.shareCardUrl) URL.revokeObjectURL(state.shareCardUrl);
  state.shareCardBlob = null;
  state.shareCardUrl = null;
  elements.sharePreview.removeAttribute("src");
  elements.sharePreview.hidden = true;
  setDownloadButtonsDisabled(true);
  elements.shareStatus.textContent = copy("v2.sharePreparing");
  state.shareCardPromise = renderResultSharePng(elements.shareCanvas, model).then((blob) => {
    if (generation !== shareRenderGeneration) return null;
    state.shareCardBlob = blob;
    state.shareCardUrl = URL.createObjectURL(blob);
    elements.sharePreview.src = state.shareCardUrl;
    elements.sharePreview.hidden = false;
    elements.sharePreview.alt = `${model.title} — ${copy("v2.shareDownload")}`;
    elements.shareStatus.textContent = copy("v2.shareReady");
    setDownloadButtonsDisabled(false);
    return blob;
  }).catch(() => {
    if (generation !== shareRenderGeneration) return null;
    elements.shareStatus.textContent = copy("v2.shareError");
    setDownloadButtonsDisabled(true);
    return null;
  });
}
function renderResult() {
  const viewModel = buildResultViewModel();
  $("[data-result-title]").textContent = viewModel.title;
  $("[data-result-slogan]").textContent = viewModel.slogan;
  const runnerImage = $("[data-runner-image]");
  runnerImage.hidden = !viewModel.image.src;
  if (viewModel.image.src) {
    runnerImage.src = viewModel.image.src;
    runnerImage.alt = viewModel.image.alt;
  }
  else runnerImage.removeAttribute("src");
  document.querySelectorAll("[data-result-tag]").forEach((tag, index) => {
    const value = viewModel.tags[index] || "";
    tag.textContent = value ? `# ${value}` : "";
    tag.hidden = !value;
    if (value) tag.removeAttribute("aria-hidden");
    else tag.setAttribute("aria-hidden", "true");
  });
  $("[data-recommendation-heading]").textContent = viewModel.recommendationHeading;
  $("[data-recommendation-description]").textContent = viewModel.recommendationDescription;
  const equipmentGallery = $("[data-hydration-equipment]");
  equipmentGallery.replaceChildren();
  equipmentGallery.hidden = viewModel.isPioneer || viewModel.equipment.length === 0;
  equipmentGallery.setAttribute("aria-label", copy("v2.equipmentImages"));
  viewModel.equipment.forEach((item) => {
    const image = document.createElement("img");
    image.className = "hydration-equipment-image";
    image.src = item.src;
    image.alt = copy(item.altKey);
    equipmentGallery.append(image);
  });
  elements.sustainabilityResultMark.hidden = !viewModel.isPioneer;
  if (viewModel.isPioneer) elements.sustainabilityResultMark.src = viewModel.sustainabilityImage.src;
  $("[data-recommendation-section]").classList.toggle("is-pioneer", viewModel.isPioneer);
  $("[data-existing-hydration]").hidden = !viewModel.isPioneer;
  $("[data-hydration-options]").hidden = viewModel.isPioneer;
  document.querySelectorAll("[data-hydration-choice]").forEach((input) => {
    input.checked = input.value === state.hydrationCommitment;
    input.closest(".choice-card").classList.toggle("is-selected", input.checked);
  });
  prepareShareCard(viewModel);
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
  renderRedemptionView(allocation, { state, elements, resultData: content.resultData, text, copy, prizeCatalog, resolveProjectAsset, showScreen });
}
function downloadResultCard() {
  if (!state.shareCardPromise) return;
  state.shareCardPromise.then((blob) => {
    if (!blob || !state.shareCardUrl) return;
    const link = document.createElement("a");
    link.href = state.shareCardUrl;
    link.download = `garmin-run-${state.result.runnerType}.png`;
    if ("download" in link) {
      document.body.append(link);
      link.click();
      link.remove();
    } else window.open(state.shareCardUrl, "_blank", "noopener");
  });
}
function renderMockTools() {
  const snapshot = getMockSnapshot();
  const editor = $("[data-mock-stock-editor]");
  editor.replaceChildren();
  for (const prize of snapshot.prizes) {
    const label = document.createElement("label");
    label.textContent = copy(`prize.${prize.prizeId}`);
    const input = document.createElement("input");
    Object.assign(input, { type: "number", min: "0", step: "1", value: prize.remainingStock });
    input.dataset.mockPrize = prize.prizeId;
    label.append(input); editor.append(label);
  }
  const apply = document.createElement("button");
  apply.type = "button"; apply.className = "button button-secondary"; apply.dataset.action = "mock-set-stock";
  apply.textContent = copy("v2.mockApplyStock");
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
  if (action === "download-result") { event.preventDefault(); downloadResultCard(); return; }
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
    if (!elements.redemption.hidden && state.displayedAllocation) {
      renderRedemption(state.displayedAllocation);
      if (state.result) prepareShareCard(buildResultViewModel());
    }
    if (!$("[data-mock-panel]").hidden) renderMockTools();
  }
  if (action === "mock-tools") { $("[data-mock-panel]").hidden = false; renderMockTools(); }
  if (action === "close-mock-tools") $("[data-mock-panel]").hidden = true;
  if (action === "mock-scenario") { applyMockScenario(target.dataset.scenario); renderMockTools(); }
  if (action === "mock-reset") { resetMockTestData(); renderMockTools(); }
  if (action === "mock-clear" && window.confirm(copy("v2.mockClearConfirm"))) { clearMockData(); renderMockTools(); }
  if (action === "mock-set-stock") {
    const stock = Object.fromEntries(Array.from(document.querySelectorAll("[data-mock-prize]")).map((input) => [input.dataset.mockPrize, input.value]));
    if (!setMockStock(stock).ok) window.alert(copy("v2.mockInvalidStock"));
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
  $(".mock-tools-button").hidden = true;
}
window.addEventListener("pageshow", (event) => { if (event.persisted) { reset(); showScreen(elements.start); } });
loadContent().then((loaded) => {
  content = loaded;
  if (content.version !== 2) throw new Error("V2 content required");
  elements.igImage.src = resolveProjectAsset("./assets/Garmin永續故事.png");
  elements.igImage.addEventListener("load", () => {
    elements.igImage.hidden = false;
    $(`[data-ig-fallback]`).hidden = true;
  }, { once: true });
  updateStaticText();
  $("[data-action=start]").disabled = false;
}).catch(() => { $("[data-i18n='v2.startDescription']").textContent = copy("v2.startLoadError") || "無法載入測驗內容，請重新整理。"; });
