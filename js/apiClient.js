import { readAllocationRecovery, saveAllocationRecovery } from "./sessionRecovery.js";

const MOCK_REQUESTS_KEY = "garminRunMockRequests";
const MOCK_STOCK_KEY = "garminRunMockStock";

const prizeCatalog = {
  cap: { nameZh: "Garmin 漁夫帽", nameEn: "Garmin Cap", imagePath: "./assets/prizes/Garmin漁夫帽.png" },
  soft_cup: { nameZh: "Garmin 軟水杯", nameEn: "Garmin Soft Cup", imagePath: "./assets/prizes/Garmin軟水杯.png" },
  socks: { nameZh: "Garmin 襪子", nameEn: "Garmin Socks", imagePath: "./assets/prizes/Garmin襪子.png" },
  arm_sleeves: { nameZh: "Garmin 袖套", nameEn: "Garmin Arm Sleeves", imagePath: "./assets/prizes/Garmin袖套.png" },
  shopping_bag: { nameZh: "Garmin 鏤空購物袋", nameEn: "Garmin Shopping Bag", imagePath: "./assets/prizes/Garmin簍空購物袋.png" }
};

function getMockRequests() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_REQUESTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function getMockStock() {
  const defaults = {
    cap: 150,
    soft_cup: 260,
    socks: 470,
    arm_sleeves: 125,
    shopping_bag: 120
  };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(MOCK_STOCK_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function weightedPrize(stock, random = Math.random()) {
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

export async function submitParticipation(payload) {
  await delay(450);
  const requests = getMockRequests();
  if (requests[payload.requestId]) {
    return { ok: true, ...requests[payload.requestId], idempotentReplay: true };
  }

  const stock = getMockStock();
  let prizeId = null;
  let allocationMethod = null;

  if (payload.premiumPrizeEligible && stock.shopping_bag > 0) {
    prizeId = "shopping_bag";
    allocationMethod = "premium_priority";
    stock.shopping_bag -= 1;
  } else if (payload.premiumPrizeEligible || !payload.premiumPrizeEligible) {
    prizeId = weightedPrize(stock);
    allocationMethod = payload.premiumPrizeEligible ? "premium_fallback" : "general_weighted";
    if (prizeId) stock[prizeId] -= 1;
  }

  if (!prizeId) {
    return {
      ok: false,
      retryable: false,
      code: "ALLOCATION_PAUSED",
      message: {
        zh: "目前獎品分配暫停，請洽現場工作人員",
        en: "Allocation is paused. Please contact a staff member."
      },
      demoMode: true
    };
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

  requests[payload.requestId] = result;
  saveJson(MOCK_REQUESTS_KEY, requests);
  saveJson(MOCK_STOCK_KEY, stock);
  saveAllocationRecovery(result);
  return { ok: true, ...result, idempotentReplay: false };
}

export async function getExistingAllocation() {
  await delay(250);
  const recovery = readAllocationRecovery();
  if (!recovery) return { ok: true, found: false, demoMode: true };
  const request = getMockRequests()[recovery.requestId];
  return request
    ? { ok: true, found: true, ...request, demoMode: true }
    : { ok: true, found: false, demoMode: true };
}

export async function getPublicCampaignStatus() {
  await delay(100);
  return { ok: true, allocationEnabled: true, raffleEnabled: true, demoMode: true };
}
