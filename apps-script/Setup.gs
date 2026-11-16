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
     "redemptionCode","redemptionStatus","quizVersion","hydrationStyle","q4Answer","submissionVersion",
     "q1Answer","q2Answer","q3Answer","q5Answer"]
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
    ["requestId","sessionId","participantId","status","resultJson","createdAt","updatedAt","submissionVersion","submissionFingerprint"]
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
     "redemptionCode","redemptionStatus","quizVersion","hydrationStyle","q4Answer","submissionVersion",
     "q1Answer","q2Answer","q3Answer","q5Answer"]
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
    ["requestId","sessionId","participantId","status","resultJson","createdAt","updatedAt","submissionVersion","submissionFingerprint"]
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
    .addToUi();
}

var LEGACY_PARTICIPANT_HEADERS = ["participantId","requestId","createdAt","runnerType","existingSelfHydration","hydrationCommitment",
  "sustainabilityRewardEligible","premiumPrizeEligible","raffleOptIn","name","email","privacyNoticeVersion","privacyAcknowledgedAt",
  "prizeId","allocationStatus","allocationTime","redemptionCode","redemptionStatus"];
var V2_PARTICIPANT_HEADERS = ["quizVersion","hydrationStyle","q4Answer"];
var ANONYMOUS_PARTICIPANT_HEADERS = ["submissionVersion","q1Answer","q2Answer","q3Answer","q5Answer"];
var LEGACY_REQUEST_HEADERS = ["requestId","sessionId","participantId","status","resultJson","createdAt","updatedAt"];
var ANONYMOUS_REQUEST_HEADERS = ["submissionVersion","submissionFingerprint"];

function requireAnonymousSchema(participantSheet, requestSheet) {
  var expectedParticipants = LEGACY_PARTICIPANT_HEADERS.concat(V2_PARTICIPANT_HEADERS, ANONYMOUS_PARTICIPANT_HEADERS);
  var expectedRequests = LEGACY_REQUEST_HEADERS.concat(ANONYMOUS_REQUEST_HEADERS);
  if (!participantSheet || !requestSheet ||
      !headersEqual(participantSheet, expectedParticipants) || !headersEqual(requestSheet, expectedRequests)) {
    throw new Error("ANONYMOUS_SCHEMA_MIGRATION_REQUIRED");
  }
}

function headersEqual(sheet, expected) {
  if (sheet.getLastColumn() !== expected.length) return false;
  return sheet.getRange(1, 1, 1, expected.length).getValues()[0].join("\u001f") === expected.join("\u001f");
}

function appendSchemaHeaders(sheet, allowedPrefixes, targetHeaders) {
  if (!sheet || sheet.getLastRow() < 1) throw new Error("UNKNOWN_SCHEMA");
  var lastColumn = sheet.getLastColumn();
  var actual = sheet.getRange(1, 1, 1, Math.max(1, lastColumn)).getValues()[0];
  var match = allowedPrefixes.some(function (prefix) {
    return actual.length === prefix.length && actual.join("\u001f") === prefix.join("\u001f");
  });
  if (!match) throw new Error("UNKNOWN_SCHEMA");
  var missing = targetHeaders.slice(actual.length);
  if (!missing.length) return;
  var requiredColumns = actual.length + missing.length;
  if (sheet.getMaxColumns && sheet.getMaxColumns() < requiredColumns) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredColumns - sheet.getMaxColumns());
  }
  sheet.getRange(1, actual.length + 1, 1, missing.length).setValues([missing]);
}

// Append-only, repeatable migration. Never creates sheets or changes prize/inventory rows.
function migrateAnonymousSubmissionSchema(ss, demoMode) {
  var participantName = demoMode ? SHEET_NAMES.DemoParticipants : SHEET_NAMES.Participants;
  var requestName = demoMode ? SHEET_NAMES.DemoRequests : SHEET_NAMES.Requests;
  var participantSheet = ss.getSheetByName(participantName);
  var requestSheet = ss.getSheetByName(requestName);
  if (!participantSheet || !requestSheet) throw new Error("SHEET_SETUP_REQUIRED");
  var v2Headers = LEGACY_PARTICIPANT_HEADERS.concat(V2_PARTICIPANT_HEADERS);
  var fullParticipantHeaders = v2Headers.concat(ANONYMOUS_PARTICIPANT_HEADERS);
  appendSchemaHeaders(participantSheet,
    [LEGACY_PARTICIPANT_HEADERS, v2Headers, fullParticipantHeaders], fullParticipantHeaders);
  appendSchemaHeaders(requestSheet,
    [LEGACY_REQUEST_HEADERS, LEGACY_REQUEST_HEADERS.concat(ANONYMOUS_REQUEST_HEADERS)],
    LEGACY_REQUEST_HEADERS.concat(ANONYMOUS_REQUEST_HEADERS));
  return { ok: true, demoMode: demoMode === true, participantColumns: fullParticipantHeaders.length, requestColumns: LEGACY_REQUEST_HEADERS.length + ANONYMOUS_REQUEST_HEADERS.length };
}

function migrateStagingAnonymousSchema() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    migrateAnonymousSubmissionSchema(SpreadsheetApp.getActive(), true);
  }
  finally { lock.releaseLock(); }
}
// Manual-only. Confirm the active spreadsheet is the backed-up Production file first.
function migrateProductionAnonymousSchema() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    migrateAnonymousSubmissionSchema(SpreadsheetApp.getActive(), false);
  }
  finally { lock.releaseLock(); }
}
