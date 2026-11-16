import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

class Sheet {
  constructor(rows) { this.rows = structuredClone(rows); }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(0, ...this.rows.map((row) => row.length)); }
  getDataRange() { return { getValues: () => structuredClone(this.rows) }; }
  getRange(row, col, height = 1, width = 1) {
    return {
      getValues: () => Array.from({ length: height }, (_, r) => Array.from({ length: width }, (_, c) => this.rows[row - 1 + r]?.[col - 1 + c] ?? "")),
      setValue: (value) => this.getRange(row, col).setValues([[value]]),
      setValues: (values) => { values.forEach((valuesRow, r) => { this.rows[row - 1 + r] ||= []; valuesRow.forEach((value, c) => { this.rows[row - 1 + r][col - 1 + c] = value; }); }); }
    };
  }
  appendRow(row) { this.rows.push([...row]); }
  deleteColumns(start, count) { this.rows.forEach((row) => row.splice(start - 1, count)); }
}
function environment() {
  const sheets = new Map();
  const ss = { getSheetByName: (name) => sheets.get(name), insertSheet: (name) => { const sheet = new Sheet([]); sheets.set(name, sheet); return sheet; } };
  let uuid = 0;
  const lock = { tryLock: () => true, waitLock: () => {}, releaseLock: () => {} };
  const context = vm.createContext({
    Date, JSON, SpreadsheetApp: { getActive: () => ss }, LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: () => `uuid-${++uuid}` }, ContentService: { MimeType: { JSON: "json" }, createTextOutput: (text) => ({ text, setMimeType() { return this; } }) }
  });
  for (const name of ["Setup", "Inventory", "Validation", "Allocation", "Code"]) vm.runInContext(readFileSync(new URL(`../apps-script/${name}.gs`, import.meta.url), "utf8"), context);
  context.setupActivitySheets(); // In-memory workbook only; never connected to a remote Sheet.
  return {
    sheets,
    ss,
    context,
    post: (data, mode = "apps-script-demo") => JSON.parse(context.doPost({
      parameter: mode ? { mode } : {},
      postData: { contents: JSON.stringify(data) }
    }).text)
  };
}
function data(style = "rest", commitment = "considering", requestId = "test-request") {
  const existing = style === "pioneer";
  return {
    submissionVersion: 1, quizVersion: 2, requestId, sessionId: "test-session",
    answers: { q1: "q1_experience", q2: "q2_experience", q3: "q3_experience", q4: `q4_${style}`, q5: "q5_experience" },
    runnerType: "experience", hydrationStyle: style, q4Answer: `q4_${style}`, existingSelfHydration: existing,
    hydrationCommitment: existing ? "existing" : commitment,
    sustainabilityRewardEligible: existing || commitment === "joined", premiumPrizeEligible: existing
  };
}

test("Append-only migration preserves existing rows and all stock; repeatable, schema conflicts stop", () => {
  const { sheets, context } = environment();
  const demo = sheets.get("DemoParticipants");
  const requests = sheets.get("DemoRequests");
  demo.rows = [demo.rows[0].slice(0, 18), Array(18).fill("legacy-value")];
  requests.rows = [requests.rows[0].slice(0, 7), Array(7).fill("legacy-request")];
  const oldData = [structuredClone(demo.rows[1]), structuredClone(requests.rows[1])];
  const stock = JSON.stringify([sheets.get("Prizes").rows, sheets.get("DemoPrizes").rows]);
  context.migrateStagingAnonymousSchema(); context.migrateStagingAnonymousSchema();
  assert.deepEqual(demo.rows[0].map(context.internalHeader), [
    "participantId","requestId","createdAt","runnerType","existingSelfHydration","hydrationCommitment",
    "sustainabilityRewardEligible","premiumPrizeEligible","raffleOptIn","name","email","privacyNoticeVersion",
    "privacyAcknowledgedAt","prizeId","allocationStatus","allocationTime","redemptionCode","redemptionStatus",
    "quizVersion","hydrationStyle","q4Answer","submissionVersion","q1Answer","q2Answer","q3Answer","q5Answer"
  ]);
  assert.deepEqual(demo.rows[1], oldData[0]);
  assert.deepEqual(requests.rows[1], oldData[1]);
  assert.deepEqual(requests.rows[0].slice(7).map(context.internalHeader), ["submissionVersion", "submissionFingerprint"]);
  assert.equal(JSON.stringify([sheets.get("Prizes").rows, sheets.get("DemoPrizes").rows]), stock);
  demo.rows[0][18] = "unknown";
  assert.throws(() => context.migrateStagingAnonymousSchema(), /UNKNOWN_SCHEMA/);
});

test("Anonymous submit records complete raw answers, existing priority and exact idempotent replay", () => {
  const { sheets, post, context } = environment();
  const productionStock = JSON.stringify(sheets.get("Prizes").rows);
  const request = data("pioneer");
  const first = post(request);
  assert.equal(first.ok, true);
  assert.equal(first.prize.prizeId, "shopping_bag");
  const stockAfter = JSON.stringify(sheets.get("DemoPrizes").rows);
  assert.equal(post(request).idempotentReplay, true);
  assert.equal(JSON.stringify(sheets.get("DemoPrizes").rows), stockAfter);
  assert.equal(sheets.get("DemoAllocations").rows.length, 2);
  const participant = sheets.get("DemoParticipants").rows[1];
  assert.equal(participant[8], "否");
  assert.deepEqual(participant.slice(9, 13), ["", "", "", ""]);
  assert.deepEqual(participant.slice(18), [2, "永續先鋒隊", "優雅地拿出自己的軟水杯／軟水壺裝水", 1, "跑者大拜拜之一，必須搶！", "蛤? 訓練是什麼?", "儀式感要有，裝備排好來張大合照！", "準備好！我要漂亮進站"]);
  assert.equal(sheets.get("DemoRequests").rows[1][7], 1);
  assert.ok(sheets.get("DemoRequests").rows[1][8].includes("q4_pioneer"));
  assert.equal(JSON.stringify(sheets.get("Prizes").rows), productionStock);
  const recovered = JSON.parse(context.doGet({ parameter: { action: "getExistingAllocation", requestId: request.requestId, sessionId: request.sessionId, mode: "apps-script-demo" } }).text);
  assert.equal(recovered.found, true);
  assert.equal(recovered.allocation.prize.prizeId, "shopping_bag");
  assert.equal(Object.hasOwn(recovered.allocation, "name"), false);
});

test("Paused allocation is saved and recoverable without claiming a prize", () => {
  const { sheets, post, context } = environment();
  for (const row of sheets.get("DemoPrizes").rows.slice(1)) row[5] = 0;
  const request = data("rest", "joined", "paused-request");
  const paused = post(request);
  assert.equal(paused.ok, true);
  assert.equal(paused.allocationStatus, "paused");
  assert.equal(paused.prize, null);
  assert.equal(sheets.get("DemoAllocations").rows.length, 1);
  assert.equal(sheets.get("DemoParticipants").rows[1][14], "暫停分配");
  const recovered = JSON.parse(context.doGet({ parameter: { action: "getExistingAllocation", requestId: request.requestId, sessionId: request.sessionId, mode: "apps-script-demo" } }).text);
  assert.equal(recovered.found, true);
  assert.equal(recovered.allocation.allocationStatus, "paused");
  assert.equal(post(request).idempotentReplay, true);
  assert.equal(sheets.get("DemoParticipants").rows.length, 2);
});

test("Server rejects personal fields, mismatches, repeated IDs with different payload and environment override before stock changes", () => {
  const { sheets, post } = environment();
  const before = JSON.stringify(sheets.get("DemoPrizes").rows);
  const beforeTotal = sheets.get("DemoPrizes").rows.slice(1).reduce((sum, row) => sum + row[5], 0);
  assert.equal(post({ ...data(), name: "must not persist" }).code, "PERSONAL_DATA_NOT_ALLOWED");
  assert.equal(post({ ...data(), email: "must-not-persist@example.invalid" }).code, "PERSONAL_DATA_NOT_ALLOWED");
  assert.equal(post({ ...data(), demoMode: false }).code, "ENVIRONMENT_OVERRIDE_NOT_ALLOWED");
  assert.equal(post({ ...data(), premiumPrizeEligible: true }).code, "ELIGIBILITY_MISMATCH");
  const initial = data("rest", "joined", "same-id");
  assert.equal(post(initial).ok, true);
  assert.equal(post({ ...initial, hydrationCommitment: "considering", sustainabilityRewardEligible: false }).code, "REQUEST_ID_CONFLICT");
  const afterTotal = sheets.get("DemoPrizes").rows.slice(1).reduce((sum, row) => sum + row[5], 0);
  assert.equal(afterTotal, beforeTotal - 1);
  assert.notEqual(before, JSON.stringify(sheets.get("DemoPrizes").rows));
});

test("One Web App routes Demo and Production by mode; Production is the default", () => {
  const { sheets, post, context } = environment();
  const demoStatus = JSON.parse(context.doGet({ parameter: { action: "getPublicCampaignStatus", mode: "apps-script-demo" } }).text);
  const productionStatus = JSON.parse(context.doGet({ parameter: { action: "getPublicCampaignStatus" } }).text);
  assert.equal(demoStatus.demoMode, true);
  assert.equal(productionStatus.demoMode, false);

  const demoPrizeBefore = JSON.stringify(sheets.get("DemoPrizes").rows);
  const productionResult = post(data("rest", "considering", "production-test"), "production");
  assert.equal(productionResult.ok, true);
  assert.equal(productionResult.demoMode, false);
  assert.equal(JSON.stringify(sheets.get("DemoPrizes").rows), demoPrizeBefore);
  assert.equal(sheets.get("Participants").rows.length, 2);
  assert.equal(sheets.get("DemoParticipants").rows.length, 1);

  assert.equal(post(data("rest", "considering", "invalid-mode"), "mock").code, "INVALID_API_MODE");
});

test("Bag fallback and joined participants remain in the general weighted pool", () => {
  const { sheets, post } = environment();
  const rows = sheets.get("DemoPrizes").rows;
  rows.find((row) => row[0] === "shopping_bag")[5] = 0;
  const fallback = post(data("pioneer"));
  assert.equal(fallback.allocationMethod, "premium_fallback");
  assert.notEqual(fallback.prize.prizeId, "shopping_bag");
  rows.find((row) => row[0] === "shopping_bag")[5] = 120;
  const joined = post(data("precision", "joined", "joined-request"));
  assert.equal(joined.allocationMethod, "general_weighted");
  assert.notEqual(joined.prize.prizeId, "shopping_bag");
});


test("Chinese localization preserves technical records and stock and accepts legacy headers", () => {
  const { sheets, context, post } = environment();
  const participants = sheets.get("DemoParticipants");
  participants.rows[0] = participants.rows[0].map(context.internalHeader);
  assert.equal(post(data()).ok, true);
  participants.rows[1][3] = "performance";
  participants.rows[1][4] = false;
  const unchanged = JSON.stringify([...sheets].filter(([name]) => !["Participants", "DemoParticipants"].includes(name)).map(([name, sheet]) => [name, sheet.rows.slice(1)]));
  context.localizeActivitySheets();
  context.localizeActivitySheets();
  assert.equal(participants.rows[0][0], "參與者代碼");
  assert.equal(participants.rows[0][3], "跑者風格");
  assert.equal(participants.rows[1][3], "配速計算機");
  assert.equal(participants.rows[1][4], "否");
  assert.equal(JSON.stringify([...sheets].filter(([name]) => !["Participants", "DemoParticipants"].includes(name)).map(([name, sheet]) => [name, sheet.rows.slice(1)])), unchanged);
  assert.equal(post(data()).idempotentReplay, true);
  assert.equal(post(data("rest", "considering", "after-localization")).ok, true);
});


test("Production summary stores 13 ordered Chinese columns, prize names, replay and recovery", () => {
  const { sheets, context, post } = environment();
  const demoBefore = JSON.stringify([...sheets].filter(([name]) => name.startsWith("Demo")).map(([name, sheet]) => [name, sheet.rows]));
  const request = data("pioneer", "existing", "summary-production");
  const result = post(request, "production");
  assert.equal(result.ok, true);
  const rows = sheets.get("Participants").rows;
  assert.deepEqual(rows[0], ["參與者代號", "建立時間", "跑者風格", "自備補水裝備", "永續獎勵資格", "優先獎品資格", "補水風格", "第1題答案", "第2題答案", "第3題答案", "第4題答案", "第5題答案", "獎品中文名稱"]);
  assert.equal(rows[1].length, 13);
  assert.equal(rows[1][0], result.participantId);
  assert.deepEqual(rows[1].slice(2, 7), ["賽事收藏家", "是", "是", "是", "永續先鋒隊"]);
  for (let q = 1; q <= 5; q++) assert.equal(rows[1][q + 6], context.CHINESE_PARTICIPANT_VALUES[request.answers[`q${q}`]]);
  assert.equal(rows[1][12], result.prize.nameZh);
  const stock = JSON.stringify(sheets.get("Prizes").rows);
  assert.equal(post(request, "production").idempotentReplay, true);
  assert.equal(JSON.stringify(sheets.get("Prizes").rows), stock);
  assert.equal(rows.length, 2);
  const recovery = JSON.parse(context.doGet({ parameter: { action: "getExistingAllocation", requestId: request.requestId, sessionId: request.sessionId } }).text);
  assert.equal(recovery.allocation.prize.nameZh, rows[1][12]);
  assert.equal(JSON.stringify([...sheets].filter(([name]) => name.startsWith("Demo")).map(([name, sheet]) => [name, sheet.rows])), demoBefore);
  context.migrateProductionAnonymousSchema();
  assert.equal(rows[0].length, 13);
});

test("Production summary migration drops excluded data, preserves answers and other sheets, repeatable", () => {
  const { sheets, context, post } = environment();
  const sheet = sheets.get("Participants");
  sheet.rows = [Array.from(context.LEGACY_PARTICIPANT_HEADERS).concat(Array.from(context.V2_PARTICIPANT_HEADERS), Array.from(context.ANONYMOUS_PARTICIPANT_HEADERS))];
  const request = data("pioneer", "existing", "legacy-production");
  assert.equal(post(request, "production").ok, true);
  sheet.rows[1][9] = "synthetic-name";
  sheet.rows[1][10] = "synthetic@example.invalid";
  const expectedAnswers = [22, 23, 24, 20, 25].map((i) => sheet.rows[1][i]);
  const otherSheets = () => JSON.stringify([...sheets].filter(([name]) => name !== "Participants").map(([name, sheet]) => [name, sheet.rows]));
  const before = otherSheets();
  context.migrateProductionParticipantSummary();
  assert.equal(sheet.getLastColumn(), 13);
  assert.deepEqual(sheet.rows[1].slice(7, 12), expectedAnswers);
  assert.equal(sheet.rows[1][12], "Garmin 鏤空購物袋");
  assert.equal(JSON.stringify(sheet.rows).includes("synthetic"), false);
  const migrated = JSON.stringify(sheet.rows);
  context.migrateProductionParticipantSummary();
  assert.equal(JSON.stringify(sheet.rows), migrated);
  assert.equal(otherSheets(), before);
  assert.equal(post(request, "production").idempotentReplay, true);
  assert.equal(post(data("rest", "considering", "new-production"), "production").ok, true);
  assert.equal(sheet.rows[2].length, 13);
});

test("Production paused summary has no prize name or inventory changes", () => {
  const { sheets, post } = environment();
  sheets.get("Settings").rows.find((row) => row[0] === "allocationEnabled")[1] = "false";
  const before = JSON.stringify(sheets.get("Prizes").rows);
  const request = data("rest", "considering", "summary-paused");
  assert.equal(post(request, "production").allocationStatus, "paused");
  const row = sheets.get("Participants").rows[1];
  assert.equal(row.length, 13);
  assert.equal(row[12], "");
  assert.deepEqual(row.slice(3, 6), ["否", "否", "否"]);
  assert.equal(post(request, "production").idempotentReplay, true);
  assert.equal(JSON.stringify(sheets.get("Prizes").rows), before);
});

test("Production summary migration rejects unknown schemas and unresolved prizes before writes", () => {
  const { sheets, context } = environment();
  const sheet = sheets.get("Participants");
  sheet.rows = [["unknown"], ["unchanged"]];
  const before = JSON.stringify(sheet.rows);
  assert.throws(() => context.migrateProductionParticipantSummary(), /UNKNOWN_SCHEMA/);
  assert.equal(JSON.stringify(sheet.rows), before);
  sheet.rows = [Array.from(context.LEGACY_PARTICIPANT_HEADERS), Array(18).fill("")];
  sheet.rows[1][13] = "unknown-prize";
  const unresolved = JSON.stringify(sheet.rows);
  assert.throws(() => context.migrateProductionParticipantSummary(), /PRIZE_NOT_FOUND/);
  assert.equal(JSON.stringify(sheet.rows), unresolved);
  sheet.rows[1][13] = "";
  context.migrateProductionParticipantSummary();
  assert.equal(sheet.rows[1][12], "");
  assert.deepEqual(sheet.rows[1].slice(7, 12), ["", "", "", "", ""]);
});
