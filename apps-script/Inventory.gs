function getSettingValue(key) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAMES.Settings);
  if (!sheet) return "";
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === key) return String(values[i][1]);
  }
  return "";
}

function getModeSheetNames(demoMode) {
  return demoMode ? {
    participants: SHEET_NAMES.DemoParticipants,
    prizes: SHEET_NAMES.DemoPrizes,
    allocations: SHEET_NAMES.DemoAllocations,
    inventoryLog: SHEET_NAMES.DemoInventoryLog,
    requests: SHEET_NAMES.DemoRequests
  } : {
    participants: SHEET_NAMES.Participants,
    prizes: SHEET_NAMES.Prizes,
    allocations: SHEET_NAMES.Allocations,
    inventoryLog: SHEET_NAMES.InventoryLog,
    requests: SHEET_NAMES.Requests
  };
}

function findRequest(requestId, demoMode) {
  var names = getModeSheetNames(demoMode);
  var sheet = SpreadsheetApp.getActive().getSheetByName(names.requests);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === requestId) {
      return { row: i + 1, values: values[i] };
    }
  }
  return null;
}

function findPrize(prizeId, demoMode) {
  var names = getModeSheetNames(demoMode);
  var sheet = SpreadsheetApp.getActive().getSheetByName(names.prizes);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === prizeId) {
      return { row: i + 1, values: values[i] };
    }
  }
  return null;
}

function setSetting(key, value, operator) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAMES.Settings);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === key) {
      sheet.getRange(i + 1, 2).setValue(String(value));
      appendAdminAudit("setSetting:" + key, operator || Session.getEffectiveUser().getEmail(), String(value));
      return;
    }
  }
  sheet.appendRow([key, String(value)]);
  appendAdminAudit("setSetting:" + key, operator || Session.getEffectiveUser().getEmail(), String(value));
}

function appendAdminAudit(action, operator, details) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.AdminAudit);
  if (sheet) sheet.appendRow([new Date(), operator || "", action || "", details || ""]);
}

function adjustPrizeStockAdmin() {
  var ui = SpreadsheetApp.getUi();
  var prizeResponse = ui.prompt(
    "調整獎品庫存",
    "輸入 prizeId（cap、soft_cup、socks、arm_sleeves、shopping_bag）：",
    ui.ButtonSet.OK_CANCEL
  );
  if (prizeResponse.getSelectedButton() !== ui.Button.OK) return;
  var prizeId = String(prizeResponse.getResponseText()).trim();
  if (["cap","soft_cup","socks","arm_sleeves","shopping_bag"].indexOf(prizeId) < 0) {
    ui.alert("Prize ID 不正確。");
    return;
  }

  var quantityResponse = ui.prompt(
    "調整獎品庫存",
    "輸入調整數量；增加填正整數、減少填負整數：",
    ui.ButtonSet.OK_CANCEL
  );
  if (quantityResponse.getSelectedButton() !== ui.Button.OK) return;
  var delta = Number(quantityResponse.getResponseText());
  if (!Number.isInteger(delta) || delta === 0) {
    ui.alert("調整數量必須是非 0 整數。");
    return;
  }

  var reasonResponse = ui.prompt(
    "調整獎品庫存",
    "輸入調整原因：",
    ui.ButtonSet.OK_CANCEL
  );
  if (reasonResponse.getSelectedButton() !== ui.Button.OK) return;
  var reason = String(reasonResponse.getResponseText()).trim();
  if (!reason || reason.length > 500) {
    ui.alert("調整原因不可空白且最多 500 字。");
    return;
  }

  adjustPrizeStock(prizeId, delta, reason, Session.getEffectiveUser().getEmail());
  ui.alert("庫存調整完成。");
}

function adjustPrizeStock(prizeId, delta, reason, operator) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName(SHEET_NAMES.Prizes);
    var prize = findPrize(prizeId, false);
    if (!prize) throw new Error("PRIZE_NOT_FOUND");
    var before = Number(prize.values[5]) || 0;
    var after = before + delta;
    if (after < 0) throw new Error("NEGATIVE_STOCK");
    var allocated = Number(prize.values[6]) || 0;
    var initial = Number(prize.values[4]) || 0;
    var nextInitial = initial + delta;
    if (nextInitial < allocated) throw new Error("NEGATIVE_STOCK");
    sheet.getRange(prize.row, 6).setValue(after);
    sheet.getRange(prize.row, 5).setValue(nextInitial);
    var inventory = ss.getSheetByName(SHEET_NAMES.InventoryLog);
    inventory.appendRow([
      "inventory_" + Utilities.getUuid(), new Date(), prizeId, "admin_adjustment",
      delta, before, after, reason, "", operator || "admin"
    ]);
    appendAdminAudit("adjustPrizeStock:" + prizeId, operator || "admin", reason + " delta=" + delta);
  } finally {
    lock.releaseLock();
  }
}

function pauseAllocationAdmin() {
  setSetting("allocationEnabled", "false", Session.getEffectiveUser().getEmail());
}

function resumeAllocationAdmin() {
  setSetting("allocationEnabled", "true", Session.getEffectiveUser().getEmail());
}

function verifyInventoryConsistency() {
  var ss = SpreadsheetApp.getActive();
  var problems = [];
  var allocationCounts = {};
  [["Prizes","Allocations"],["DemoPrizes","DemoAllocations"]].forEach(function (pair) {
    var allocationSheet = ss.getSheetByName(pair[1]);
    if (!allocationSheet || allocationSheet.getLastRow() < 2) return;
    var allocationRows = allocationSheet.getDataRange().getValues();
    for (var r = 1; r < allocationRows.length; r++) {
      var key = pair[0] + "/" + String(allocationRows[r][3]);
      allocationCounts[key] = (allocationCounts[key] || 0) + 1;
    }
  });
  ["Prizes", "DemoPrizes"].forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var prizeId = String(values[i][0]);
      var initial = Number(values[i][4]);
      var remaining = Number(values[i][5]);
      var allocated = Number(values[i][6]);
      if (initial !== remaining + allocated) {
        problems.push(sheetName + "/" + prizeId + ": initial != remaining + allocated");
      }
      if (remaining < 0 || allocated < 0) {
        problems.push(sheetName + "/" + prizeId + ": negative stock or count");
      }
      var counted = allocationCounts[sheetName + "/" + prizeId] || 0;
      if (counted !== allocated) {
        problems.push(sheetName + "/" + prizeId + ": allocatedCount=" + allocated +
          " but allocation rows=" + counted);
      }
    }
  });
  SpreadsheetApp.getUi().alert(problems.length ? problems.join("\n") : "庫存與分配紀錄一致。");
}

function exportRaffleListCsv() {
  var ss = SpreadsheetApp.getActive();
  var source = ss.getSheetByName(SHEET_NAMES.Participants);
  var exportName = "RaffleExport";
  var target = ss.getSheetByName(exportName) || ss.insertSheet(exportName);
  target.clear();
  target.getRange(1, 1, 1, 4).setValues([["participantId","name","email","createdAt"]]);
  var values = source.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    if (values[i][8] === true || String(values[i][8]).toLowerCase() === "true") {
      rows.push([values[i][0], values[i][9], values[i][10], values[i][2]]);
    }
  }
  if (rows.length) target.getRange(2, 1, rows.length, 4).setValues(rows);
  SpreadsheetApp.getUi().alert("抽獎名單已更新至「RaffleExport」工作表，共 " + rows.length + " 筆。請使用 Sheet 的下載功能匯出 CSV。");
}
