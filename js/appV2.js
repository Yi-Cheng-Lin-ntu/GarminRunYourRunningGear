import { loadContent } from "./contentData.js";
import { classifyAnswers } from "./classificationEngine.js";
import { classificationRules } from "./classificationRules.js";
import { derivePrizeEligibility } from "./prizeEligibility.js";
import { getHydrationEquipment } from "./hydrationEquipment.js";
import { resolveProjectAsset } from "./projectAssets.js";
import { renderRedemptionView } from "./redemptionView.js";
import { renderResultSharePng } from "./shareCard.js";
import { APPS_SCRIPT_DEMO_MODE, API_STATUS, MOCK_MODE, submitAnonymousResult as sendAnonymousResult, getPublicCampaignStatus, getExistingAllocation,
  getMockSnapshot, applyMockScenario, setMockStock, resetMockTestData, clearMockData, prizeCatalog } from "./apiClient.js";
import { clearAllocationRecovery, clearPendingRequest, readPendingRequest, savePendingRequest } from "./sessionRecovery.js";

const $ = (selector) => document.querySelector(selector);
const setDownloadButtonsDisabled = (disabled) => document.querySelectorAll('[data-action="download-result"]').forEach((button) => { button.disabled = disabled; });
const RESULT_ILLUSTRATIONS = {
  experience: "./assets/result/賽事收藏家.png",
  lifestyle: "./assets/result/自在巡航員.png",
  performance: "./assets/result/配速計算機.png"
};
const elements = {
  start: $("#start"), quiz: $("#quiz"), result: $("#result"), redemption: $("#redemption"),
  redemptionRunner: $("[data-redemption-runner]"), redemptionTitle: $("[data-redemption-title]"),
  prizeImage: $("[data-prize-image]"), prizeName: $("[data-prize-name]"), sustainabilityMessage: $("[data-sustainability-message]"),
  shareStage: $("[data-share-stage]"), shareContext: $("[data-share-context]"), shareRoot: $("[data-share-root]"),
  sharePreview: $("[data-share-preview]"), shareStatus: $("[data-share-status]"),
  sustainabilityResultMark: $("[data-sustainability-result-mark]"),
  igImage: $("[data-ig-image]")
};
let content;
const state = { language: "zh", answers: {}, orders: {}, index: 0, result: null, hydrationCommitment: null,
  displayedAllocation: null, requestId: null, sessionId: null, submitInProgress: false,
  shareCardBlob: null, shareCardUrl: null, shareCardPromise: null };
let shareRenderGeneration = 0;
const text = (value) => value?.[state.language] || value?.zh || value?.en || "";
const copy = (key) => text(content?.ui[key]);
const id = () => globalThis.crypto?.randomUUID?.() || `v2-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function centerHydrationChoiceText() {
  if (state.language !== "zh") return;
  document.querySelectorAll(".hydration-choices .choice-card strong").forEach((label) => {
    const match = label.textContent.match(/^(.+?)([!！?？.,，。．、:：;；~～…]+)$/u);
    if (!match) return;
    const text = document.createElement("span");
    text.className = "choice-label-text";
    text.textContent = match[1];
    const punctuation = document.createElement("span");
    punctuation.className = "choice-label-punctuation";
    punctuation.textContent = match[2];
    text.append(punctuation);
    label.replaceChildren(text);
  });
}

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
  centerHydrationChoiceText();
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", copy(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-content]").forEach((element) => {
    element.setAttribute("content", copy(element.dataset.i18nContent));
  });
  $("[data-language-label]").textContent = copy(state.language === "zh" ? "language.toEnglish" : "language.toChinese");
  const modeNotice = $("[data-mode-notice]");
  if (modeNotice) modeNotice.textContent = copy(APPS_SCRIPT_DEMO_MODE ? "v2.demoNotice" : "v2.mode");
}
function reset({ clearRecovery = true } = {}) {
  shareRenderGeneration += 1;
  if (state.shareCardUrl) URL.revokeObjectURL(state.shareCardUrl);
  Object.assign(state, { answers: {}, orders: {}, index: 0, result: null, hydrationCommitment: null,
    displayedAllocation: null, requestId: null, sessionId: id(), submitInProgress: false,
    shareCardBlob: null, shareCardUrl: null, shareCardPromise: null });
  $("[data-result-error]").hidden = true;
  $("[data-action=continue]").disabled = false;
  $("[data-action=continue]").textContent = copy("v2.continue");
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
  elements.shareRoot.replaceChildren();
  elements.shareContext.removeAttribute("style");
  elements.shareStatus.textContent = copy("v2.sharePreparing");
  setDownloadButtonsDisabled(true);
  elements.sustainabilityResultMark.removeAttribute("src");
  elements.sustainabilityResultMark.hidden = true;
  if (clearRecovery) {
    clearAllocationRecovery();
    clearPendingRequest();
  }
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
    headerPrefix: copy("brand.headerPrefix"),
    headerRun: copy("brand.headerRun"),
    headerSuffix: copy("v2.shareCardHeaderSuffix"),
    footer: copy("v2.startFooter"),
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
  state.shareCardPromise = renderResultSharePng({
    card: $("[data-result-card]"),
    stage: elements.shareStage,
    context: elements.shareContext,
    root: elements.shareRoot
  }).then((blob) => {
    if (generation !== shareRenderGeneration) return null;
    state.shareCardBlob = blob;
    state.shareCardUrl = URL.createObjectURL(blob);
    elements.sharePreview.src = state.shareCardUrl;
    elements.sharePreview.hidden = false;
    elements.sharePreview.alt = `${model.title} — ${copy("v2.shareDownload")}`;
    elements.shareStatus.textContent = copy("v2.shareReady");
    setDownloadButtonsDisabled(false);
    return blob;
  }).catch((error) => {
    if (generation !== shareRenderGeneration) return null;
    console.error("Result share PNG generation failed.", error?.name, error?.message, error);
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
    input.disabled = Boolean(state.requestId) || state.submitInProgress;
    input.closest(".choice-card").classList.toggle("is-selected", input.checked);
  });
  const submitButton = $("[data-action=continue]");
  submitButton.disabled = !API_STATUS.configured || state.submitInProgress;
  if (!API_STATUS.configured) {
    $("[data-result-error]").textContent = copy("v2.serviceUnavailable");
    $("[data-result-error]").hidden = false;
  }
  prepareShareCard(viewModel);
}
async function submitAnonymousResult() {
  if (!state.result) return;
  if (state.submitInProgress) return;
  if (!state.result.sustainability && !["joined", "considering"].includes(state.hydrationCommitment)) {
    $("[data-result-error]").textContent = copy("v2.chooseError");
    $("[data-result-error]").hidden = false;
    return;
  }
  if (!API_STATUS.configured) {
    $("[data-result-error]").textContent = copy("v2.serviceUnavailable");
    $("[data-result-error]").hidden = false;
    return;
  }
  $("[data-result-error]").hidden = true;
  const eligibility = derivePrizeEligibility({
    runnerType: state.result.runnerType,
    existingSelfHydration: state.result.sustainability,
    hydrationCommitment: state.hydrationCommitment
  });
  if (!state.requestId) state.requestId = id();
  const payload = {
    submissionVersion: 1,
    quizVersion: 2,
    answers: { ...state.answers },
    runnerType: state.result.runnerType,
    hydrationStyle: state.result.hydrationStyle,
    q4Answer: state.result.q4Answer,
    ...eligibility,
    requestId: state.requestId,
    sessionId: state.sessionId
  };
  savePendingRequest({ sessionId: state.sessionId, requestId: state.requestId, payload });
  state.submitInProgress = true;
  const button = $("[data-action=continue]");
  button.disabled = true;
  button.textContent = copy("v2.processing");
  document.querySelectorAll("[data-hydration-choice]").forEach((input) => { input.disabled = true; });
  try {
    const status = await getPublicCampaignStatus();
    if (!MOCK_MODE && Boolean(status.demoMode) !== APPS_SCRIPT_DEMO_MODE) throw new Error("API_ENVIRONMENT_MISMATCH");
    if (!status.ok || status.quizVersion !== 2 || status.submissionVersion !== 1) throw new Error(status.code || "UNSUPPORTED_QUIZ_VERSION");
    const response = await sendAnonymousResult(payload);
    if (!response.ok) throw new Error(response.code || "SUBMISSION_FAILED");
    clearPendingRequest();
    renderRedemption(response);
  } catch (failure) {
    const messageKey = ["API_NOT_CONFIGURED", "API_ENVIRONMENT_NOT_CONFIGURED", "API_ENVIRONMENT_MISMATCH", "ALLOCATION_PAUSED"].includes(failure.message) ? "v2.serviceUnavailable" :
      failure.message === "UNSUPPORTED_QUIZ_VERSION" ? "v2.backendOld" : "v2.submitError";
    $("[data-result-error]").textContent = copy(messageKey);
    $("[data-result-error]").hidden = false;
  } finally {
    state.submitInProgress = false;
    button.disabled = !API_STATUS.configured;
    button.textContent = copy("v2.retrySubmit");
  }
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
  if (action.startsWith("mock-") && !MOCK_MODE) return;
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
  if (action === "continue") submitAnonymousResult();
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
  if (input.matches("[data-hydration-choice]") && !state.requestId && !state.submitInProgress) {
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

$("[data-action=start]").disabled = true;
reset({ clearRecovery: false });
showScreen(elements.start);
const developmentControls = [$(".mock-tools-button")];
developmentControls.forEach((element) => { if (element) element.hidden = !MOCK_MODE; });
if (!MOCK_MODE) {
  const panel = $("[data-mock-panel]");
  if (panel) panel.hidden = true;
}
window.addEventListener("pageshow", (event) => { if (event.persisted) restorePendingSubmission(); });

async function restorePendingSubmission() {
  const pending = readPendingRequest();
  if (!pending?.sessionId || !pending?.requestId) return;
  try {
    const recovery = await getExistingAllocation(pending);
    if (recovery?.ok && recovery.found) {
      clearPendingRequest();
      renderRedemption(recovery.allocation || recovery);
      return;
    }
  } catch {
    // Keep the pending anonymous payload and request ID so the user can retry safely.
  }
  if (!pending.payload || !content) return;
  state.answers = { ...pending.payload.answers };
  state.sessionId = pending.sessionId;
  state.requestId = pending.requestId;
  state.result = classifyAnswers({ questions: content.quizData.questions, answers: state.answers, runnerTypes: content.runnerTypes, rules: classificationRules });
  state.hydrationCommitment = pending.payload.hydrationCommitment;
  renderResult();
  showScreen(elements.result);
  $("[data-result-error]").textContent = copy("v2.submitError");
  $("[data-result-error]").hidden = false;
  $("[data-action=continue]").textContent = copy("v2.retrySubmit");
}
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
  restorePendingSubmission();
}).catch(() => { $("[data-i18n='v2.startDescription']").textContent = copy("v2.startLoadError") || "無法載入測驗內容，請重新整理。"; });
