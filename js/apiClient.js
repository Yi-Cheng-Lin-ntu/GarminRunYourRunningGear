import {
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

const searchParams = new URLSearchParams(globalThis.location?.search || "");
export const APPS_SCRIPT_DEMO_MODE = searchParams.get("mode") === "apps-script-demo";
export const MOCK_MODE = !APPS_SCRIPT_DEMO_MODE;

const APPS_SCRIPT_DEMO_URL =
  "https://script.google.com/macros/s/AKfycbzpY0s-HZ5o0fTqinyFqZotoN5wWmLn9toWL1SZefK_WODZ_t3iGHz8UWpWH-okIV3fEw/exec";

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

function validateMockPayload(payload) {
  if (!payload || typeof payload.requestId !== "string" || payload.requestId.length < 1 || payload.requestId.length > 128) {
    return "INVALID_REQUEST_ID";
  }
  if (!["experience", "lifestyle", "performance"].includes(payload.runnerType)) {
    return "INVALID_RUNNER_TYPE";
  }
  if (typeof payload.existingSelfHydration !== "boolean" || typeof payload.sustainabilityRewardEligible !== "boolean" || typeof payload.premiumPrizeEligible !== "boolean") {
    return "INVALID_ELIGIBILITY";
  }
  if (!["existing", "joined", "considering"].includes(payload.hydrationCommitment)) {
    return "INVALID_HYDRATION_COMMITMENT";
  }
  if (payload.raffleOptIn === true) {
    if (typeof payload.name !== "string" || !payload.name.trim() || payload.name.length > 80) return "INVALID_RAFFLE_NAME";
    if (typeof payload.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) return "INVALID_RAFFLE_EMAIL";
  }
  return null;
}

function getJsonArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function resetMockTestData() {
  saveJson(MOCK_REQUESTS_KEY, {});
  saveJson(MOCK_STOCK_KEY, { ...DEFAULT_MOCK_STOCK });
  saveJson(MOCK_PARTICIPANTS_KEY, []);
  saveJson(MOCK_ALLOCATIONS_KEY, []);
  saveJson(MOCK_INVENTORY_LOG_KEY, []);
  localStorage.removeItem("garminRunDemoAllocation");
  localStorage.removeItem("garminRunPendingRequest");
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
    participants: getJsonArray(MOCK_PARTICIPANTS_KEY),
    allocations: getJsonArray(MOCK_ALLOCATIONS_KEY),
    inventoryLog: getJsonArray(MOCK_INVENTORY_LOG_KEY),
    requestCount: Object.keys(getMockRequests()).length
  };
}

export async function submitParticipation(payload) {
  if (APPS_SCRIPT_DEMO_MODE) {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(APPS_SCRIPT_DEMO_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({ ...payload, demoMode: true }),
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
    const validationError = validateMockPayload(payload);
    if (validationError) {
      return {
        ok: false,
        retryable: false,
        code: validationError,
        message: { zh: "Mock 資料驗證失敗", en: "Mock data validation failed" },
        demoMode: true
      };
    }
    const requests = getMockRequests();
    if (requests[payload.requestId]) {
      return { ok: true, ...requests[payload.requestId], idempotentReplay: true };
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
        existingSelfHydration: payload.existingSelfHydration,
        hydrationCommitment: payload.hydrationCommitment,
        sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
        premiumPrizeEligible: payload.premiumPrizeEligible,
        raffleOptIn: payload.raffleOptIn === true,
        name: payload.raffleOptIn === true ? payload.name : "",
        email: payload.raffleOptIn === true ? payload.email : "",
        prizeId: "",
        allocationStatus: "paused",
        redemptionStatus: "not_applicable"
      });
      requests[payload.requestId] = pausedResult;
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
        existingSelfHydration: payload.existingSelfHydration,
        hydrationCommitment: payload.hydrationCommitment,
        sustainabilityRewardEligible: payload.sustainabilityRewardEligible,
        premiumPrizeEligible: payload.premiumPrizeEligible,
        raffleOptIn: payload.raffleOptIn === true,
        name: payload.raffleOptIn === true ? payload.name : "",
        email: payload.raffleOptIn === true ? payload.email : "",
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

    requests[payload.requestId] = result;
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

export async function getExistingAllocation() {
  if (APPS_SCRIPT_DEMO_MODE) {
    const pending = readPendingRequest();
    if (!pending?.sessionId || !pending?.requestId) return { ok: true, found: false, demoMode: true };
    const url = new URL(APPS_SCRIPT_DEMO_URL);
    url.searchParams.set("action", "getExistingAllocation");
    url.searchParams.set("requestId", pending.requestId);
    url.searchParams.set("sessionId", pending.sessionId);
    url.searchParams.set("demoMode", "true");
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    return result;
  }
  await delay(250);
  const recovery = readAllocationRecovery();
  if (!recovery) return { ok: true, found: false, demoMode: true };
  const request = getMockRequests()[recovery.requestId];
  return request
    ? { ok: true, found: true, ...request, demoMode: true }
    : { ok: true, found: false, demoMode: true };
}

export async function getPublicCampaignStatus() {
  if (APPS_SCRIPT_DEMO_MODE) {
    const url = new URL(APPS_SCRIPT_DEMO_URL);
    url.searchParams.set("action", "getPublicCampaignStatus");
    url.searchParams.set("demoMode", "true");
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return response.json();
  }
  await delay(100);
  return { ok: true, allocationEnabled: true, raffleEnabled: true, demoMode: true };
}
