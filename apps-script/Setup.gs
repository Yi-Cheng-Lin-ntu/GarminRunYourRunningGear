var CHINESE_HEADERS = {
  "participantId": "參與者代碼",
  "requestId": "提交代碼",
  "createdAt": "建立時間",
  "runnerType": "跑者風格",
  "existingSelfHydration": "原已自備補水裝備",
  "hydrationCommitment": "永續補水承諾",
  "sustainabilityRewardEligible": "永續獎勵資格",
  "premiumPrizeEligible": "優先獎品資格",
  "raffleOptIn": "參加抽獎",
  "name": "姓名",
  "email": "電子郵件",
  "privacyNoticeVersion": "隱私告知版本",
  "privacyAcknowledgedAt": "隱私告知確認時間",
  "prizeId": "獎品代碼",
  "allocationStatus": "分配狀態",
  "allocationTime": "分配時間",
  "redemptionCode": "兌獎代碼",
  "redemptionStatus": "兌獎狀態",
  "quizVersion": "測驗版本",
  "hydrationStyle": "補水風格",
  "q4Answer": "第4題答案",
  "submissionVersion": "提交版本",
  "q1Answer": "第1題答案",
  "q2Answer": "第2題答案",
  "q3Answer": "第3題答案",
  "q5Answer": "第5題答案",
  "nameZh": "獎品中文名稱",
  "nameEn": "獎品英文名稱",
  "category": "獎品類別",
  "initialStock": "初始庫存",
  "remainingStock": "剩餘庫存",
  "allocatedCount": "已分配數量",
  "enabled": "是否啟用",
  "imagePath": "圖片路徑",
  "allocationId": "分配代碼",
  "allocationMethod": "分配方式",
  "logId": "紀錄代碼",
  "timestamp": "紀錄時間",
  "action": "操作",
  "quantityDelta": "數量異動",
  "beforeStock": "異動前庫存",
  "afterStock": "異動後庫存",
  "reason": "原因",
  "relatedAllocationId": "關聯分配代碼",
  "operator": "操作人員",
  "sessionId": "工作階段代碼",
  "status": "處理狀態",
  "resultJson": "結果資料（系統用）",
  "updatedAt": "更新時間",
  "submissionFingerprint": "提交指紋（系統用）",
  "key": "設定項目",
  "value": "設定值",
  "details": "詳細內容"
};

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

var PRODUCTION_PARTICIPANT_HEADERS = [
  "participantId", "createdAt", "runnerType", "existingSelfHydration",
  "sustainabilityRewardEligible", "premiumPrizeEligible", "hydrationStyle",
  "q1Answer", "q2Answer", "q3Answer", "q4Answer", "q5Answer", "nameZh"
];

var PRIZE_ROWS = [
  ["cap", "Garmin 牛仔帽", "Garmin Cap", "general", 150, 150, 0, true, "./assets/prizes/Garmin漁夫帽.png"],
  ["soft_cup", "Garmin 軟水杯", "Garmin Soft Cup", "general", 260, 260, 0, true, "./assets/prizes/Garmin軟水杯.png"],
  ["socks", "Garmin 襪子", "Garmin Socks", "general", 470, 470, 0, true, "./assets/prizes/Garmin襪子.png"],
  ["arm_sleeves", "Garmin 袖套", "Garmin Arm Sleeves", "general", 125, 125, 0, true, "./assets/prizes/Garmin袖套.png"],
  ["shopping_bag", "Garmin 鏤空購物袋", "Garmin Shopping Bag", "premium", 120, 120, 0, true, "./assets/prizes/Garmin簍空購物袋.png"]
];

function setupActivitySheets() {
  var ss = SpreadsheetApp.getActive();
  ensureSheet(ss, SHEET_NAMES.Participants, [PRODUCTION_PARTICIPANT_HEADERS]);
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
  if (!lastRow) sheet.getRange(1, 1, initialRows.length, initialRows[0].length).setValues(initialRows.map(function (row, index) {
    return index === 0 ? row.map(name === SHEET_NAMES.Participants ? productionParticipantHeader : chineseHeader) : row;
  }));
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
    .addItem("將既有表單資訊轉為中文", "localizeActivitySheets")
    .addItem("精簡正式參與者欄位", "migrateProductionParticipantSummary")
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

function requireAnonymousSchema(participantSheet, requestSheet, demoMode) {
  var expectedParticipants = LEGACY_PARTICIPANT_HEADERS.concat(V2_PARTICIPANT_HEADERS, ANONYMOUS_PARTICIPANT_HEADERS);
  var expectedRequests = LEGACY_REQUEST_HEADERS.concat(ANONYMOUS_REQUEST_HEADERS);
  if (!participantSheet || !requestSheet ||
      !(headersEqual(participantSheet, expectedParticipants) ||
        (demoMode === false && headersEqual(participantSheet, PRODUCTION_PARTICIPANT_HEADERS))) ||
      !headersEqual(requestSheet, expectedRequests)) {
    throw new Error("ANONYMOUS_SCHEMA_MIGRATION_REQUIRED");
  }
}

function headersEqual(sheet, expected) {
  if (sheet.getLastColumn() !== expected.length) return false;
  return sheet.getRange(1, 1, 1, expected.length).getValues()[0].map(internalHeader).join("\u001f") === expected.join("\u001f");
}

function appendSchemaHeaders(sheet, allowedPrefixes, targetHeaders) {
  if (!sheet || sheet.getLastRow() < 1) throw new Error("UNKNOWN_SCHEMA");
  var lastColumn = sheet.getLastColumn();
  var actual = sheet.getRange(1, 1, 1, Math.max(1, lastColumn)).getValues()[0].map(internalHeader);
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
  sheet.getRange(1, actual.length + 1, 1, missing.length).setValues([missing.map(chineseHeader)]);
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
  if (demoMode || !headersEqual(participantSheet, PRODUCTION_PARTICIPANT_HEADERS)) {
    appendSchemaHeaders(participantSheet,
      [LEGACY_PARTICIPANT_HEADERS, v2Headers, fullParticipantHeaders], fullParticipantHeaders);
  }
  appendSchemaHeaders(requestSheet,
    [LEGACY_REQUEST_HEADERS, LEGACY_REQUEST_HEADERS.concat(ANONYMOUS_REQUEST_HEADERS)],
    LEGACY_REQUEST_HEADERS.concat(ANONYMOUS_REQUEST_HEADERS));
  return { ok: true, demoMode: demoMode === true, participantColumns: participantSheet.getLastColumn(), requestColumns: LEGACY_REQUEST_HEADERS.length + ANONYMOUS_REQUEST_HEADERS.length };
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

function chineseHeader(key) { return CHINESE_HEADERS[key] || key; }
function productionParticipantHeader(key) {
  if (key === "participantId") return "參與者代號";
  if (key === "existingSelfHydration") return "自備補水裝備";
  return chineseHeader(key);
}
function internalHeader(label) {
  if (label === "參與者代號") return "participantId";
  if (label === "自備補水裝備") return "existingSelfHydration";
  var keys = Object.keys(CHINESE_HEADERS);
  for (var i = 0; i < keys.length; i++) {
    if (CHINESE_HEADERS[keys[i]] === label) return keys[i];
  }
  return label;
}

// Only known headers and participant display fields are changed. No stock writes.
function localizeActivitySheets() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActive();
    Object.keys(SHEET_NAMES).forEach(function (key) {
      var sheet = ss.getSheetByName(SHEET_NAMES[key]);
      if (!sheet || !sheet.getLastRow()) return;
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers.map(function (header) {
        var field = internalHeader(header);
        return key === "Participants" ? productionParticipantHeader(field) : chineseHeader(field);
      })]);
      if (key !== "Participants" && key !== "DemoParticipants") return;
      var rows = sheet.getDataRange().getValues();
      for (var r = 1; r < rows.length; r++) {
        headers.forEach(function (header, c) {
          var value = chineseParticipantValue(internalHeader(header), rows[r][c]);
          if (value !== rows[r][c]) sheet.getRange(r + 1, c + 1).setValue(value);
        });
      }
    });
    return { ok: true };
  } finally { lock.releaseLock(); }
}

var CHINESE_PARTICIPANT_VALUES = {
  "experience": "賽事收藏家",
  "performance": "配速計算機",
  "lifestyle": "自在巡航員",
  "pioneer": "永續先鋒隊",
  "precision": "精準進站派",
  "rest": "補給休息派",
  "existing": "原已自備補水裝備",
  "joined": "願意加入永續補水",
  "considering": "考慮中",
  "allocated": "已分配",
  "paused": "暫停分配",
  "unverified": "尚未核銷",
  "not_applicable": "不適用",
  "q1_experience": "跑者大拜拜之一，必須搶！",
  "q1_lifestyle": "有好玩賽事都報！",
  "q1_performance": "目標賽事之一，11月底是突破個人最佳成績的好時機！",
  "q2_experience": "蛤? 訓練是什麼?",
  "q2_lifestyle": "不分賽季，平常都一直在跑啦",
  "q2_performance": "每天課表吃到飽",
  "q3_experience": "儀式感要有，裝備排好來張大合照！",
  "q3_lifestyle": "該帶的塞進衣保袋、晶片綁好，睡飽比較重要啦",
  "q3_performance": "鞋子、手錶、果膠…必須萬無一失！",
  "q4_precision": "看準空檔，精準進站！遠離人群！",
  "q4_rest": "終於可以休息！ 看看有什麼好吃的?",
  "q4_pioneer": "優雅地拿出自己的軟水杯／軟水壺裝水",
  "q5_experience": "準備好！我要漂亮進站",
  "q5_lifestyle": "這2km好漫長~~~~",
  "q5_performance": "全力以赴了！現在不衝什麼時候衝！"
};

function chineseParticipantValue(header, value) {
  var fields = ["runnerType", "hydrationStyle", "hydrationCommitment", "allocationStatus", "redemptionStatus",
    "q1Answer", "q2Answer", "q3Answer", "q4Answer", "q5Answer"];
  var flags = ["existingSelfHydration", "sustainabilityRewardEligible", "premiumPrizeEligible", "raffleOptIn"];
  if (flags.indexOf(header) >= 0) {
    if (value === true || value === "true") return "是";
    if (value === false || value === "false") return "否";
  }
  return fields.indexOf(header) >= 0 ? (CHINESE_PARTICIPANT_VALUES[value] || value) : value;
}

// Manual migration: permanently removes excluded columns from Participants only.
// Back up the spreadsheet externally before running. Never changes prize stock.
function migrateProductionParticipantSummary() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(SHEET_NAMES.Participants);
    if (!sheet || !sheet.getLastRow()) throw new Error("SHEET_SETUP_REQUIRED");
    var legacy = LEGACY_PARTICIPANT_HEADERS;
    var v2 = legacy.concat(V2_PARTICIPANT_HEADERS);
    var full = v2.concat(ANONYMOUS_PARTICIPANT_HEADERS);
    var allowed = [legacy, v2, full, PRODUCTION_PARTICIPANT_HEADERS];
    if (!allowed.some(function (headers) { return headersEqual(sheet, headers); })) {
      throw new Error("UNKNOWN_SCHEMA");
    }
    var rows = sheet.getDataRange().getValues();
    var fields = rows[0].map(internalHeader);
    var prizeNames = {};
    var prizes = ss.getSheetByName(SHEET_NAMES.Prizes);
    if (!prizes) throw new Error("SHEET_SETUP_REQUIRED");
    prizes.getDataRange().getValues().slice(1).forEach(function (row) {
      prizeNames[String(row[0])] = row[1];
    });
    // Build and validate the entire output before modifying any cells.
    var output = [PRODUCTION_PARTICIPANT_HEADERS.map(productionParticipantHeader)];
    rows.slice(1).forEach(function (row) {
      output.push(PRODUCTION_PARTICIPANT_HEADERS.map(function (field) {
        var index = fields.indexOf(field);
        var value = index >= 0 ? row[index] : "";
        if (field === "nameZh" && index < 0) {
          var prizeId = row[fields.indexOf("prizeId")];
          if (prizeId && !prizeNames[String(prizeId)]) throw new Error("PRIZE_NOT_FOUND");
          value = prizeId ? prizeNames[String(prizeId)] : "";
        }
        return chineseParticipantValue(field, value);
      }));
    });
    sheet.getRange(1, 1, output.length, PRODUCTION_PARTICIPANT_HEADERS.length).setValues(output);
    var extraColumns = sheet.getLastColumn() - PRODUCTION_PARTICIPANT_HEADERS.length;
    if (extraColumns > 0) sheet.deleteColumns(PRODUCTION_PARTICIPANT_HEADERS.length + 1, extraColumns);
    return { ok: true, participantColumns: PRODUCTION_PARTICIPANT_HEADERS.length, participantRows: output.length - 1 };
  } finally { lock.releaseLock(); }
}
