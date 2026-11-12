import { validateAnonymousPayload } from "./participationValidation.js";
import { API_CONFIGURED, API_DEMO_MODE, API_ENVIRONMENT, API_URL, IS_DEVELOPMENT } from "./environment.js";
import {
  clearAllocationRecovery,
  clearPendingRequest,
  readAllocationRecovery,
  readPendingRequest,
  saveAllocationRecovery
} from "./sessionRecovery.js";

const MOCK_REQUESTS_KEY = "garminRunMockRequests";
const MOCK_STOCK_KEY = "garminRunMockStock";
const MOCK_PARTICIPANTS_KEY = "garminRunMockParticipants";
const MOCK_ALLOCATIONS_KEY = "garminRunMockAllocations";
const MOCK_INVENTORY_LOG_KEY = "garminRunMockInventoryLog";
let mockAllocationQueue = Promise.resolve();

export const APPS_SCRIPT_DEMO_MODE = API_DEMO_MODE;
export const MOCK_MODE = IS_DEVELOPMENT;
export const API_STATUS = Object.freeze({ environment: API_ENVIRONMENT, configured: API_CONFIGURED });

export const prizeCatalog = {
  cap: { nameZh: "Garmin 漁夫帽", nameEn: "Garmin Cap", imagePath: "./assets/prizes/Garmin漁夫帽.png" },
  soft_cup: { nameZh: "Garmin 軟水杯", nameEn: "Garmin Soft Cup", imagePath: "./assets/prizes/Garmin軟水杯.png" },
  socks: { nameZh: "Garmin 襪子", nameEn: "Garmin Socks", imagePath: "./assets/prizes/Garmin襪子.png" },
  arm_sleeves: { nameZh: "Garmin 袖套", nameEn: "Garmin Arm Sleeves", imagePath: "./assets/prizes/Garmin袖套.png" },
  shopping_bag: { nameZh: "Garmin 鏤空購物袋", nameEn: "Garmin Shopping Bag", imagePath: "./assets/prizes/Garmin簍空購物袋.png" }
};

export const DEFAULT_MOCK_STOCK = Object.freeze({
  cap: 150,
  soft_cup: 260,
  socks: 470,
  arm_sleeves: 125,
  shopping_bag: 120
});

function getMockRequests() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_REQUESTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getMockStock() {
  try {
    return { ...DEFAULT_MOCK_STOCK, ...JSON.parse(localStorage.getItem(MOCK_STOCK_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_MOCK_STOCK };
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function weightedPrize(stock, random = Math.random()) {
  const general = ["cap", "soft_cup", "socks", "arm_sleeves"];
  const total = general.reduce((sum, prizeId) => sum + Math.max(0, stock[prizeId] || 0), 0);
  if (total <= 0) return null;

  let cursor = random * total;
  for (const prizeId of general) {
    cursor -= Math.max(0, stock[prizeId] || 0);
    if (cursor < 0) return prizeId;
  }
  return null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mockFingerprint(payload) {
  return JSON.stringify({
    sessionId: payload.sessionId,
    answers: payload.answers,
    runnerType: payload.runnerType,
    hydrationStyle: payload.hydrationStyle,
    hydrationCommitment: payload.hydrationCommitment,
    premiumPrizeEligible: payload.premiumPrizeEligible,
    sustainabilityRewardEligible: payload.sustainabilityRewardEligible
  });
}

function anonymizeStoredMockParticipants() {
  const records = getJsonArray(MOCK_PARTICIPANTS_KEY);
  const sanitized = records.map((record) => {
    const next = { ...record };
    for (const key of ["name", "email", "phone", "address", "raffleOptIn", "privacyNoticeVersion", "privacyAcknowledgedAt"]) delete next[key];
    return next;
  });
  if (JSON.stringify(records) !== JSON.stringify(sanitized)) saveJson(MOCK_PARTICIPANTS_KEY, sanitized);
  return sanitized;
}

function getJsonArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

// Remove contact fields left by earlier Mock builds on this origin, regardless of environment.
anonymizeStoredMockParticipants();

export function resetMockTestData() {
  saveJson(MOCK_REQUESTS_KEY, {});
  saveJson(MOCK_STOCK_KEY, { ...DEFAULT_MOCK_STOCK });
  saveJson(MOCK_PARTICIPANTS_KEY, []);
  saveJson(MOCK_ALLOCATIONS_KEY, []);
  saveJson(MOCK_INVENTORY_LOG_KEY, []);
  clearAllocationRecovery();
  clearPendingRequest();
  return { ok: true, stock: { ...DEFAULT_MOCK_STOCK }, demoMode: true };
}

export function setMockStock(stockChanges) {
  const next = { ...getMockStock() };
  for (const prizeId of Object.keys(DEFAULT_MOCK_STOCK)) {
    if (!Object.prototype.hasOwnProperty.call(stockChanges || {}, prizeId)) continue;
    const value = Number(stockChanges[prizeId]);
    if (!Number.isInteger(value) || value < 0) return { ok: false, code: "INVALID_STOCK" };
    next[prizeId] = value;
  }
  saveJson(MOCK_STOCK_KEY, next);
  return { ok: true, stock: next, demoMode: true };
}

export function applyMockScenario(scenario) {
  if (scenario === "premium_available") {
    return setMockStock({ shopping_bag: 1 });
  }
  if (scenario === "premium_empty") {
    return setMockStock({ shopping_bag: 0 });
  }
  if (scenario === "general_empty") {
    return setMockStock({ cap: 0, soft_cup: 0, socks: 0, arm_sleeves: 0 });
  }
  if (scenario === "all_empty") {
    return setMockStock({ cap: 0, soft_cup: 0, socks: 0, arm_sleeves: 0, shopping_bag: 0 });
  }
  return { ok: false, code: "UNKNOWN_SCENARIO" };
}

export function clearMockData() {
  return resetMockTestData();
}

export function getMockSnapshot() {
  const stock = getMockStock();
  return {
    ok: true,
    demoMode: true,
    mode: "MOCK",
    stock,
    prizes: Object.keys(prizeCatalog).map((prizeId) => ({
      prizeId,
      ...prizeCatalog[prizeId],
      initialStock: DEFAULT_MOCK_STOCK[prizeId],
      remainingStock: Math.max(0, Number(stock[prizeId] || 0)),
      allocatedCount: Math.max(0, DEFAULT_MOCK_STOCK[prizeId] - Math.max(0, Number(stock[prizeId] || 0)))
    })),
    participants: anonymizeStoredMockParticipants(),
    allocations: getJsonArray(MOCK_ALLOCATIONS_KEY),
    inventoryLog: getJsonArray(MOCK_INVENTORY_LOG_KEY),
    requestCount: Object.keys(getMockRequests()).length
  };
}

export async function submitAnonymousResult(rawPayload) {
  let payload;
  try { payload = validateAnonymousPayload(rawPayload); }
  catch (error) { return { ok: false, retryable: false, code: error.message, demoMode: API_DEMO_MODE }; }
  if (!API_CONFIGURED) return { ok: false, retryable: true, code: "API_NOT_CONFIGURED", demoMode: false };
  if (!IS_DEVELOPMENT) {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error("APPS_SCRIPT_INVALID_RESPONSE");
      }
      if (result?.ok && result?.participantId && result?.requestId) {
        saveAllocationRecovery(result);
      }
      return result;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  await delay(450);
  const allocate = () => {
    const requests = getMockRequests();
    if (requests[payload.requestId]) {
      const saved = requests[payload.requestId];
      if (saved._fingerprint !== mockFingerprint(payload)) return { ok: false, retryable: false, code: "REQUEST_ID_CONFLICT", demoMode: true };
      const { _fingerprint, ...result } = saved;
      return { ok: true, ...result, idempotentReplay: true };
    }

    const stock = getMockStock();
    const beforeStock = { ...stock };
    let prizeId = null;
    let allocationMethod = null;

    if (payload.premiumPrizeEligible && stock.shopping_bag > 0) {
      prizeId = "shopping_bag";
      allocationMethod = "premium_priority";
      stock.shopping_bag -= 1;
    } else {
      prizeId = weightedPrize(stock);
      allocationMethod = payload.premiumPrizeEligible ? "premium_fallback" : "general_weighted";
      if (prizeId) stock[prizeId] -= 1;
    }

    if (!prizeId) {
      const participantId = `demo_${payload.requestId.slice(-12)}`;
      const pausedResult = {
        ok: true,
        retryable: false,
        code: "ALLOCATION_PAUSED",
        message: {
          zh: "現場獎品已贈送完畢，謝謝您的參與~",
          en: "All prizes have been given out. Thank you for participating!"
        },
        participantId,
        requestId: payload.requestId,
        sessionId: payload.sessionId,
        allocationStatus: "paused",
        runnerType: payload.runnerType,
        prize: null,
        sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
        demoMode: true
      };
      const participants = getJsonArray(MOCK_PARTICIPANTS_KEY);
      participants.push({
        participantId,
        requestId: payload.requestId,
        createdAt: new Date().toISOString(),
        runnerType: payload.runnerType,
        submissionVersion: payload.submissionVersion,
        quizVersion: payload.quizVersion,
        answers: payload.answers,
        hydrationStyle: payload.hydrationStyle || "",
        q4Answer: payload.q4Answer || "",
        existingSelfHydration: payload.existingSelfHydration,
        hydrationCommitment: payload.hydrationCommitment,
        sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
        premiumPrizeEligible: payload.premiumPrizeEligible,
        prizeId: "",
        allocationStatus: "paused",
        redemptionStatus: "not_applicable"
      });
      requests[payload.requestId] = { ...pausedResult, _fingerprint: mockFingerprint(payload) };
      saveJson(MOCK_PARTICIPANTS_KEY, participants);
      saveJson(MOCK_REQUESTS_KEY, requests);
      saveAllocationRecovery(pausedResult);
      return { ...pausedResult, idempotentReplay: false };
    }

    const participantId = `demo_${payload.requestId.slice(-12)}`;
    const result = {
      participantId,
      requestId: payload.requestId,
      allocationStatus: "allocated",
      runnerType: payload.runnerType,
      prize: {
        prizeId,
        nameZh: prizeCatalog[prizeId].nameZh,
        nameEn: prizeCatalog[prizeId].nameEn,
        imagePath: prizeCatalog[prizeId].imagePath
      },
      redemptionCode: `DEMO-${payload.requestId.slice(-6).toUpperCase()}`,
      allocationMethod,
      sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
      demoMode: true
    };

    if (prizeId) {
      const afterStock = { ...stock };
      const participants = getJsonArray(MOCK_PARTICIPANTS_KEY);
      participants.push({
        participantId,
        requestId: payload.requestId,
        createdAt: new Date().toISOString(),
        runnerType: payload.runnerType,
        submissionVersion: payload.submissionVersion,
        quizVersion: payload.quizVersion,
        answers: payload.answers,
        hydrationStyle: payload.hydrationStyle || "",
        q4Answer: payload.q4Answer || "",
        existingSelfHydration: payload.existingSelfHydration,
        hydrationCommitment: payload.hydrationCommitment,
        sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
        premiumPrizeEligible: payload.premiumPrizeEligible,
        prizeId,
        allocationStatus: "allocated",
        redemptionStatus: "unverified"
      });

      const allocations = getJsonArray(MOCK_ALLOCATIONS_KEY);
      allocations.push({
        allocationId: `demo_alloc_${payload.requestId}`,
        participantId,
        requestId: payload.requestId,
        prizeId,
        allocationTime: new Date().toISOString(),
        allocationMethod,
        allocationStatus: "allocated"
      });

      const inventoryLog = getJsonArray(MOCK_INVENTORY_LOG_KEY);
      inventoryLog.push({
        logId: `demo_log_${payload.requestId}`,
        timestamp: new Date().toISOString(),
        prizeId,
        action: "allocation",
        quantityDelta: -1,
        beforeStock: beforeStock[prizeId],
        afterStock: Math.max(0, afterStock[prizeId]),
        reason: allocationMethod,
        relatedAllocationId: `demo_alloc_${payload.requestId}`,
        operator: "mock-system"
      });

      saveJson(MOCK_PARTICIPANTS_KEY, participants);
      saveJson(MOCK_ALLOCATIONS_KEY, allocations);
      saveJson(MOCK_INVENTORY_LOG_KEY, inventoryLog);
    }

    requests[payload.requestId] = { ...result, _fingerprint: mockFingerprint(payload) };
    saveJson(MOCK_REQUESTS_KEY, requests);
    saveJson(MOCK_STOCK_KEY, stock);
    saveAllocationRecovery(result);
    return { ok: true, ...result, idempotentReplay: false };
  };

  if (globalThis.navigator?.locks?.request) {
    return globalThis.navigator.locks.request("garminRunMockAllocation", allocate);
  }

  mockAllocationQueue = mockAllocationQueue.then(allocate, allocate);
  return mockAllocationQueue;
}

export async function getExistingAllocation(pending = readPendingRequest()) {
  if (!IS_DEVELOPMENT && !API_CONFIGURED) return { ok: false, found: false, code: "API_NOT_CONFIGURED", demoMode: false };
  if (!IS_DEVELOPMENT && API_CONFIGURED) {
    if (!pending?.sessionId || !pending?.requestId) return { ok: true, found: false, demoMode: API_DEMO_MODE };
    const url = new URL(API_URL);
    url.searchParams.set("action", "getExistingAllocation");
    url.searchParams.set("requestId", pending.requestId);
    url.searchParams.set("sessionId", pending.sessionId);
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    return result;
  }
  await delay(250);
  const recovery = readAllocationRecovery();
  if (!recovery) return { ok: true, found: false, demoMode: true };
  const request = getMockRequests()[recovery.requestId];
  if (request) {
    const { _fingerprint, ...allocation } = request;
    return { ok: true, found: true, allocation: { ok: true, ...allocation, demoMode: true }, demoMode: true };
  }
  return { ok: true, found: false, demoMode: true };
}

export async function getPublicCampaignStatus() {
  if (!API_CONFIGURED) return { ok: false, configured: false, code: "API_NOT_CONFIGURED", demoMode: false };
  if (!IS_DEVELOPMENT) {
    const url = new URL(API_URL);
    url.searchParams.set("action", "getPublicCampaignStatus");
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return response.json();
  }
  await delay(100);
  return { ok: true, configured: true, quizVersion: 2, submissionVersion: 1, allocationEnabled: true, demoMode: true };
}
