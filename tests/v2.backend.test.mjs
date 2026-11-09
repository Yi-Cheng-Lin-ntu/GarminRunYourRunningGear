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
  context.setupActivitySheets(); // Only this in-memory workbook, never a remote Sheet.
  return { sheets, ss, context, post: (data) => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(data) } }).text) };
}
function data(style = "rest", commitment = "considering", id = "test-request") {
  const existing = style === "pioneer";
  return {
    quizVersion: 2, requestId: id, sessionId: "test-session", runnerType: "experience",
    answers: { q1: "q1_experience", q2: "q2_experience", q3: "q3_experience", q4: `q4_${style}`, q5: "q5_experience" },
    hydrationStyle: style, q4Answer: `q4_${style}`, existingSelfHydration: existing,
    hydrationCommitment: existing ? "existing" : commitment,
    sustainabilityRewardEligible: existing || commitment === "joined", premiumPrizeEligible: existing,
    name: "Demo Runner", email: "runner@example.com", raffleOptIn: true,
    privacyConfirmed: true, testDataConfirmed: true, privacyAcknowledgedAt: "2026-11-09T00:00:00Z",
    privacyNoticeVersion: "DEMO_ONLY", demoMode: true
  };
}

test("Append-only Demo migration preserves old participants and all real/demo stock; repeated run safe", () => {
  const { sheets, context, ss } = environment();
  const demo = sheets.get("DemoParticipants");
  const oldHeaders = demo.rows[0].slice(0, 18);
  demo.rows = [[...oldHeaders], Array(18).fill("legacy-value")];
  const stock = JSON.stringify([sheets.get("Prizes").rows, sheets.get("DemoPrizes").rows]);
  context.migrateDemoV2(); context.migrateDemoV2();
  assert.deepEqual(demo.rows[0].slice(0, 18), oldHeaders);
  assert.deepEqual(demo.rows[0].slice(18), ["quizVersion", "hydrationStyle", "q4Answer"]);
  assert.deepEqual(demo.rows[1], Array(18).fill("legacy-value"));
  assert.equal(JSON.stringify([sheets.get("Prizes").rows, sheets.get("DemoPrizes").rows]), stock);
  demo.rows[0][18] = "conflicting-header";
  assert.throws(() => context.migrateV2ParticipantColumns(ss, true), /V2_MIGRATION_REQUIRED/);
});

test("Server end-to-end: metadata written, existing priority, replay and paused remain intact", () => {
  const { sheets, post } = environment();
  const prod = JSON.stringify(sheets.get("Prizes").rows);
  const first = post(data("pioneer"));
  assert.equal(first.ok, true);
  assert.equal(first.prize.prizeId, "shopping_bag");
  const stockAfter = JSON.stringify(sheets.get("DemoPrizes").rows);
  assert.equal(post(data("pioneer")).idempotentReplay, true);
  assert.equal(JSON.stringify(sheets.get("DemoPrizes").rows), stockAfter);
  assert.equal(sheets.get("DemoAllocations").rows.length, 2);
  assert.equal(sheets.get("DemoParticipants").rows[1][8], true);
  assert.deepEqual(sheets.get("DemoParticipants").rows[1].slice(18), [2, "pioneer", "q4_pioneer"]);
  assert.equal(JSON.stringify(sheets.get("Prizes").rows), prod);
  for (const row of sheets.get("DemoPrizes").rows.slice(1)) row[5] = 0;
  const paused = post(data("rest", "joined", "paused-request"));
  assert.equal(paused.ok, true);
  assert.equal(paused.allocationStatus, "paused");
  assert.equal(paused.prize, null);
  assert.equal(sheets.get("DemoAllocations").rows.length, 2);
  assert.deepEqual(sheets.get("DemoParticipants").rows[2].slice(18), [2, "rest", "q4_rest"]);
  assert.equal(post(data("rest", "joined", "paused-request")).idempotentReplay, true);
  assert.equal(sheets.get("DemoParticipants").rows.length, 3);
});

test("Missing migration and draft Production consent reject before request writes or stock deductions", () => {
  const { sheets, post, context } = environment();
  const before = JSON.stringify(sheets.get("DemoPrizes").rows);
  sheets.get("DemoParticipants").rows[0] = sheets.get("DemoParticipants").rows[0].slice(0, 18);
  assert.equal(post(data()).code, "V2_MIGRATION_REQUIRED");
  assert.equal(sheets.get("DemoRequests").rows.length, 1);
  assert.equal(JSON.stringify(sheets.get("DemoPrizes").rows), before);
  const prod = JSON.stringify(sheets.get("Prizes").rows);
  assert.equal(post({ ...data(), demoMode: false, privacyNoticeVersion: "DRAFT_NOT_APPROVED" }).code, "PRIVACY_NOTICE_NOT_APPROVED");
  assert.equal(JSON.stringify(sheets.get("Prizes").rows), prod);
  assert.equal(sheets.get("Requests").rows.length, 1);
  const status = JSON.parse(context.doGet({ parameter: { action: "getPublicCampaignStatus", demoMode: "true" } }).text);
  assert.equal(status.quizVersion, 2);
});

test("Bag fallback and joined general allocation remain unchanged", () => {
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
