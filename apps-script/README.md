# Apps Script V2 — 更新與部署交接

本目錄為待人工更新的 V2 原始碼。**本機修改或 GitHub push 不會更新已部署的 `/exec`。本輪沒有操作遠端 Sheets、Demo／正式庫存或部署。**

## 必須更新的檔案

- `Validation.gs`：四題計分、Q2平手、Q4獨立；全員聯絡與自動抽獎、嚴格確認及告知版本、Demo測試資料檢查。
- `Code.gs`：公開狀態回報 `quizVersion:2`；版本／migration等錯誤碼。
- `Setup.gs`：新增 append-only migration／schema guard；既有初始化及管理選單保留。
- `Allocation.gs`：分配演算法、LockService與requestId重播保留；只在Participants列尾寫三個追溯欄位，寫入前檢查migration。
- `Inventory.gs`：本次無修改，不必更新；既有管理功能仍只由管理員操作。

若在 Apps Script 編輯器拆成同名 `.gs`，請更新全部上述四檔，避免只改驗證卻沒有helper。不要將私密權限或token放入前端。

## 現有 Demo 的安全更新順序（由維護者手動執行）

1. 確認是測試專用 Spreadsheet／帳號與正確 Apps Script 專案；保留舊部署及資料備份。
2. 更新上述四個 `.gs` 原始碼，先不要切換公開Web App版本。
3. 手動執行 **`migrateDemoV2()`**。只讀DemoParticipants既有表頭，於第19–21欄追加 `quizVersion`、`hydrationStyle`、`q4Answer`。重跑安全；不刪列、不回填、不修改Prizes／DemoPrizes或正式Participants。
4. 確認原18欄、舊列、兩組庫存均未變；舊列的三欄留白。
5. Settings 的 `demoPrivacyNoticeVersion` 應為 `DEMO_ONLY`；正式 `privacyNoticeVersion` 繼續 `DRAFT_NOT_APPROVED`。此為測試標記，非Garmin核准版本。
6. 建立並更新 **Demo Web App的新版本**。使用既有 `/exec` 部署ID可保留URL；若使用新部署URL，需由維護者修改前端常數並重新驗收。
7. 唯讀GET `?action=getPublicCampaignStatus&demoMode=true`，應回報 `quizVersion:2`。
8. 僅在之後獲授權的Demo驗收中，以虛構姓名／保留測試信箱驗證提交與表內追溯。本輪未執行這項遠端寫入。

**現有資料庫不要為了這次升級執行 `setupActivitySheets()` 或任何庫存初始化。** 該函式保留供全新空白活動試算表安裝，會涉及正式／Demo表與初始獎品；它不是現有Demo的migration工具。

`migrateProductionV2()` 僅供未來正式核准後手動追加正式Participants欄位，本輪不要執行。它本身不調整庫存，但不代表已授權操作正式資料。

## V2 Payload

以下僅為虛構測試資料，不是正式登記：

```json
{
  "quizVersion": 2,
  "requestId": "test-request-uuid",
  "sessionId": "test-session-uuid",
  "demoMode": true,
  "answers": {
    "q1": "q1_experience",
    "q2": "q2_experience",
    "q3": "q3_experience",
    "q4": "q4_rest",
    "q5": "q5_experience"
  },
  "runnerType": "experience",
  "hydrationStyle": "rest",
  "q4Answer": "q4_rest",
  "existingSelfHydration": false,
  "hydrationCommitment": "joined",
  "sustainabilityRewardEligible": true,
  "premiumPrizeEligible": false,
  "raffleOptIn": true,
  "name": "Demo Runner",
  "email": "runner@example.com",
  "privacyConfirmed": true,
  "testDataConfirmed": true,
  "privacyNoticeVersion": "DEMO_ONLY",
  "privacyAcknowledgedAt": "2026-11-09T00:00:00Z"
}
```

伺服器重算四題分數、Q2 tie-break與Q4，核對原始ID、hydrationStyle、existing及兩種資格，不信任前端資格。raffleOptIn必須true；姓名、Email、確認boolean、可解析確認時間及matching版本均必填。Demo另要求testDataConfirmed與保留測試Email網域example.com／example.org／example.net／.test／.invalid（含子網域）。這是測試防誤用限制，不是官方個資政策。

未核准Production版本仍拒絕所有V2提交；不再能以raffleOptIn=false跳過告知檢查。前端未新增Production URL或正式模式。

## Schema 與相容性

Participants及DemoParticipants原18欄不動；metadata追加第19–21欄。其他工作表schema不變。`requireV2ParticipantColumns()` 在建立Requests、扣庫存或新增Participant前拒絕未migration的環境。

舊列新欄不回填：舊sustainability可能源自Q2／Q4，不能猜成V2的hydrationStyle。分析資料時以quizVersion=2篩選；空白視為legacy，不可當作V2。

- **新前端 → 舊 `/exec`**：GET status沒有quizVersion=2，新UI會提示後端未更新且不送POST。即使繞過前端，舊後端也不認得q4_precision/rest/pioneer等新答案，不應用於V2測試。
- **舊／Cute前端 → 新 `/exec`**：新後端拒絕未帶quizVersion=2的payload。Cute是歷史參考，保留本機Mock可用，不保證V2部署後的V1 Demo相容。
- **歷史requestId**：重播機制仍保留；新測驗建立新UUID。不要重用舊測驗ID作V2提交。
- **同源Mock**：舊紀錄保留、庫存共用，V2只追加metadata，不自動清除或重置歷史。

Recovery API及公開status不回傳姓名或Email；一般console不輸出payload。

## 本輪驗證與未執行事項

Node VM中的Spreadsheet mock驗證：append-only／可重跑／衝突拒絕、舊資料與正式／Demo庫存不變、缺migration提前拒絕、A級優先／fallback、joined一般池、同request防重、paused與全員登記、Production草稿拒絕。

未執行：真實Google帳號授權、遠端migration、真實 `/exec` 寫入或CORS驗收、正式告知核准、正式部署；高並發、故障注入與processing部分寫入恢復依原決議延後。
