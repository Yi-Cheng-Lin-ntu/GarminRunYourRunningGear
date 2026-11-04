var SHEET_NAMES = {
  Participants: "Participants",
  Prizes: "Prizes",
  Allocations: "Allocations",
  InventoryLog: "InventoryLog",
  Requests: "Requests",
  Settings: "Settings",
  DemoParticipants: "DemoParticipants",
  DemoPrizes: "DemoPrizes",
  DemoAllocations: "DemoAllocations",
  DemoInventoryLog: "DemoInventoryLog",
  DemoRequests: "DemoRequests",
  AdminAudit: "AdminAudit"
};

var PRIZE_ROWS = [
  ["cap", "Garmin 牛仔帽", "Garmin Cap", "general", 150, 150, 0, true, "./assets/prizes/Garmin漁夫帽.png"],
  ["soft_cup", "Garmin 軟水杯", "Garmin Soft Cup", "general", 260, 260, 0, true, "./assets/prizes/Garmin軟水杯.png"],
  ["socks", "Garmin 襪子", "Garmin Socks", "general", 470, 470, 0, true, "./assets/prizes/Garmin襪子.png"],
  ["arm_sleeves", "Garmin 袖套", "Garmin Arm Sleeves", "general", 125, 125, 0, true, "./assets/prizes/Garmin袖套.png"],
  ["shopping_bag", "Garmin 鏤空購物袋", "Garmin Shopping Bag", "premium", 120, 120, 0, true, "./assets/prizes/Garmin簍空購物袋.png"]
];

function setupActivitySheets() {
  var ss = SpreadsheetApp.getActive();
  ensureSheet(ss, SHEET_NAMES.Participants, [
    ["participantId","requestId","createdAt","runnerType","existingSelfHydration","hydrationCommitment",
     "sustainabilityRewardEligible","premiumPrizeEligible","raffleOptIn","name","email",
     "privacyNoticeVersion","privacyAcknowledgedAt","prizeId","allocationStatus","allocationTime",
     "redemptionCode","redemptionStatus"]
  ]);
  ensureSheet(ss, SHEET_NAMES.Prizes, [
    ["prizeId","nameZh","nameEn","category","initialStock","remainingStock","allocatedCount","enabled","imagePath"]
  ]);
  ensureSheet(ss, SHEET_NAMES.Allocations, [
    ["allocationId","participantId","requestId","prizeId","allocationTime","allocationMethod","allocationStatus"]
  ]);
  ensureSheet(ss, SHEET_NAMES.InventoryLog, [
    ["logId","timestamp","prizeId","action","quantityDelta","beforeStock","afterStock","reason","relatedAllocationId","operator"]
  ]);
  ensureSheet(ss, SHEET_NAMES.Requests, [
    ["requestId","sessionId","participantId","status","resultJson","createdAt","updatedAt"]
  ]);
  ensureSheet(ss, SHEET_NAMES.Settings, [
    ["key","value"],
    ["raffleEnabled","true"],
    ["allocationEnabled","true"],
    ["campaignName","Garmin Run 2026"],
    ["privacyNoticeVersion","DRAFT_NOT_APPROVED"],
    ["policyVersion","draft"],
    ["demoPrivacyNoticeVersion","DEMO_ONLY"]
  ]);
  ensureSheet(ss, SHEET_NAMES.DemoParticipants, [
    ["participantId","requestId","createdAt","runnerType","existingSelfHydration","hydrationCommitment",
     "sustainabilityRewardEligible","premiumPrizeEligible","raffleOptIn","name","email",
     "privacyNoticeVersion","privacyAcknowledgedAt","prizeId","allocationStatus","allocationTime",
     "redemptionCode","redemptionStatus"]
  ]);
  ensureSheet(ss, SHEET_NAMES.DemoPrizes, [
    ["prizeId","nameZh","nameEn","category","initialStock","remainingStock","allocatedCount","enabled","imagePath"]
  ]);
  ensureSheet(ss, SHEET_NAMES.DemoAllocations, [
    ["allocationId","participantId","requestId","prizeId","allocationTime","allocationMethod","allocationStatus"]
  ]);
  ensureSheet(ss, SHEET_NAMES.DemoInventoryLog, [
    ["logId","timestamp","prizeId","action","quantityDelta","beforeStock","afterStock","reason","relatedAllocationId","operator"]
  ]);
  ensureSheet(ss, SHEET_NAMES.DemoRequests, [
    ["requestId","sessionId","participantId","status","resultJson","createdAt","updatedAt"]
  ]);
  ensureSheet(ss, SHEET_NAMES.AdminAudit, [
    ["timestamp","operator","action","details"]
  ]);

  initializePrizesIfEmpty(ss, SHEET_NAMES.Prizes);
  initializePrizesIfEmpty(ss, SHEET_NAMES.DemoPrizes);
  ensurePrizeImagePaths(ss, SHEET_NAMES.Prizes);
  ensurePrizeImagePaths(ss, SHEET_NAMES.DemoPrizes);
  return { ok: true };
}

function ensureSheet(ss, name, initialRows) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  var lastRow = sheet.getLastRow();
  if (!lastRow) sheet.getRange(1, 1, initialRows.length, initialRows[0].length).setValues(initialRows);
  return sheet;
}

function initializePrizesIfEmpty(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() > 1) return;
  var output = PRIZE_ROWS.map(function (row) {
    return [row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]];
  });
  sheet.getRange(2, 1, output.length, 9).setValues(output);
}

function ensurePrizeImagePaths(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][8] || "").trim()) continue;
    var prize = null;
    for (var j = 0; j < PRIZE_ROWS.length; j++) {
      if (PRIZE_ROWS[j][0] === String(rows[i][0])) {
        prize = PRIZE_ROWS[j];
        break;
      }
    }
    if (prize && prize[8]) sheet.getRange(i + 1, 9).setValue(prize[8]);
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Garmin Run 管理")
    .addItem("初始化活動工作表", "setupActivitySheets")
    .addItem("檢查庫存一致性", "verifyInventoryConsistency")
    .addItem("調整獎品庫存", "adjustPrizeStockAdmin")
    .addItem("暫停獎品分配", "pauseAllocationAdmin")
    .addItem("恢復獎品分配", "resumeAllocationAdmin")
    .addItem("匯出抽獎名單 CSV", "exportRaffleListCsv")
    .addToUi();
}
