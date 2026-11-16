# Apps Script｜API、Sheets 與部署手冊

本手冊對應 Repository 目前的匿名 `submissionVersion: 1`／`quizVersion: 2` 程式。`.gs` 檔案只存在 GitHub Repository，不代表遠端 Apps Script 已更新。是否部署、遠端 Sheet 是否已 migration，必須在 Google 端確認。

## 使用者流程與 API

前端收集 Q1–Q5 答案；Q1、Q2、Q3、Q5 分類，Q2 決定最高分平手；Q4 獨立決定 hydrationStyle。使用者在結果頁完成永續選擇後一次匿名提交。伺服器再次驗證答案與資格，再分配周邊。

### Request 範例

```json
{
  "submissionVersion": 1,
  "quizVersion": 2,
  "requestId": "random-request-id",
  "sessionId": "random-session-id",
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
  "premiumPrizeEligible": false
}
```

禁止欄位包括姓名、Email、電話、地址、`raffleOptIn`、個資告知及測試確認欄位。`Validation.gs` 會拒絕這些欄位，並在伺服器端重算 runnerType、hydrationStyle、existing／joined／considering 資格。Pioneer 必須由 Q4 `pioneer` 推導；只有 existingSelfHydration 可得購物袋優先資格。

成功 response 會提供 `allocationStatus: "allocated"`、prize、runnerType、requestId/sessionId、participantId、兌獎代碼、allocationMethod 與永續資格。若停用或無可用獎品，回覆 `allocationStatus: "paused"` 且 `prize: null`；不可顯示已得獎品。

## Apps Script 檔案

此次匿名提交與 migration 需要同步的程式：

- `Code.gs`：`doGet`／`doPost`、公開狀態、提交恢復、Demo／Production 工作表路由。
- `Validation.gs`：答案 ID、分類、資格與禁止個資欄位驗證。
- `Allocation.gs`：冪等、LockService、獎品選取與各表寫入。
- `Inventory.gs`：庫存調整、暫停／恢復、庫存一致性檢查。
- `Setup.gs`：空白試算表建置、append-only migration、中文表頭及明確標示的正式摘要轉換。

同步前先檢查遠端專案是否有 repository 未包含的修改。不可用初始化腳本覆蓋既有專案，也不可假設 GitHub push 會更新 Web App。

## 環境路由

`js/environment.js` 目前設定共用的一個 `/exec`：

- localhost／Codespaces 一般入口 → 前端 Development localStorage Mock，不呼叫 Apps Script。
- 任一 host 的 `?mode=apps-script-demo` → `/exec?mode=apps-script-demo`，Apps Script 使用 `DemoParticipants`、`DemoPrizes`、`DemoRequests`、`DemoAllocations`、`DemoInventoryLog`。
- GitHub Pages 一般入口不帶 mode → 同一 `/exec` 使用 Production 對應工作表。

這裡沒有已設定的獨立 Staging host、Apps Script 或 Spreadsheet；Demo tabs 是同一 Spreadsheet 中的測試資料，不是獨立部署環境。`mode` 只負責選擇工作表，不是認證或授權。Production 一般網址會使用正式資料，切勿以測試答案提交。

唯讀 status GET 應分別檢查：

```text
/exec?action=getPublicCampaignStatus&mode=apps-script-demo
/exec?action=getPublicCampaignStatus
```

前者預期 `demoMode: true`，後者 `demoMode: false`，並應回報 `quizVersion: 2`、`submissionVersion: 1`。實際 `/exec` 狀態需在部署後查證；此處不代表遠端已同步。

## Sheets schema

### Production `Participants`

現行程式支援兩種 schema：

1. 精簡 13 欄摘要：`participantId`、`createdAt`、`runnerType`、`existingSelfHydration`、`sustainabilityRewardEligible`、`premiumPrizeEligible`、`hydrationStyle`、`q1Answer`、`q2Answer`、`q3Answer`、`q4Answer`、`q5Answer`、`nameZh`（獎品中文名稱）。
2. 相容完整 26 欄：舊版 18 欄 + `quizVersion`、`hydrationStyle`、`q4Answer` + `submissionVersion`、`q1Answer`、`q2Answer`、`q3Answer`、`q5Answer`。

Production 若使用完整 schema，新的匿名列會把 legacy `raffleOptIn` 寫為 false，姓名、Email、告知欄位留空；不會蒐集個資。精簡 13 欄沒有聯絡欄位，也保留五題答案。

### Demo `DemoParticipants`

Demo schema 使用 26 欄相容格式。舊姓名／Email等欄位保留在表頭以避免欄位錯位；新版匿名列為 false／空白，不寫入個資。

### Requests

`Requests` 與 `DemoRequests` 使用原 7 欄，再追加 `submissionVersion`、`submissionFingerprint`，合計 9 欄。Fingerprint 綁定答案、runnerType、補水類型、承諾及資格。

## Migration

### 安全的 append-only migration

- `migrateStagingAnonymousSchema()`：操作目前綁定 Spreadsheet 的 DemoParticipants／DemoRequests。已知舊 18 欄格式會依序補上 V2 三欄及匿名五欄；已是 26 欄則不重複新增。Requests 補至 9 欄。
- `migrateProductionAnonymousSchema()`：操作正式 Participants／Requests。完整舊 schema 僅追加缺少欄位；若 Participants 已是精簡 13 欄，保留其 schema，只檢查／補 Requests。遇到未知欄位或順序會停止。

這兩個 migration 不建立表、不初始化獎品、不重設庫存、不改舊資料列，可重複執行；但正式 migration 仍會修改正式表頭，只能由授權維護者在備份後執行。程式不會自動呼叫它們。

### 破壞性摘要轉換

`migrateProductionParticipantSummary()` 會把已知完整 Participants schema 轉為 13 欄摘要，並刪除額外欄位。這會永久刪除那些欄中的歷史值，不是 append-only migration。執行前必須在 repository 之外備份整份 Spreadsheet，先在副本演練、核對外部報表相依性並取得資料負責人核准。不得為了匿名流程必要性而直接執行。它不初始化或改動庫存，但會改寫 Participants 表。

既有資料表一律不可直接執行 `setupActivitySheets()`：它是新空白活動表建置工具，可能在空 Prizes／DemoPrizes 表初始化獎品數量。

## 手動更新及部署程序

1. 備份 Apps Script 專案和綁定 Spreadsheet；記錄 Spreadsheet ID、各表表頭、列數、Production／Demo 庫存及目前 Web App deployment version。
2. 對照遠端獨有修改，再同步上述五個 `.gs` 檔；確認每個函式只有一份定義。
3. 在 Spreadsheet 副本先驗證對應的 migration 和匿名測試，確認舊欄、舊資料與庫存不變；不要在正式表做試跑。
4. Demo 環境的 migration 執行 `migrateStagingAnonymousSchema()`；正式資料需改版時才由授權者核准並執行 `migrateProductionAnonymousSchema()`。不要用 setup 代替。
5. Apps Script 編輯器建立新 deployment version，記錄 Web App URL、deployment version、Execute as 身分及存取權限。測試前要確認 `/exec` 指向正確專案與 Spreadsheet。
6. 先用唯讀 GET 驗證 Demo／Production 的 `demoMode` 和契約版本，再只在 Demo tabs 用明確虛構資料做端到端測試。
7. 核對 Requests、Participants、Allocations、InventoryLog 與 DemoPrizes 彼此一致；確認 Production 庫存未動。
8. 上線或調整 Production 前，先核准匿名 API 防濫用方式、公開存取權限、資料保留政策和暫停／回滾方式。

更新 Apps Script 編輯器程式碼不會更新已部署版本；必須建立新版本。若遠端仍是舊 `/exec`，可能回報舊契約、缺少 status 版本、拒絕匿名 payload 或 schema migration required。以前端部署或 README 更新不能取代遠端更新。

## 分配安全與已知風險

`Allocation.gs` 保留購物袋優先／既有 fallback、一般獎品按剩餘庫存加權、停用與零庫存排除、`LockService`、`requestId` 冪等、Request fingerprint、Allocations 與 InventoryLog。相同 requestId＋sessionId＋fingerprint 重播已完成結果，不再次扣庫存；同 requestId 不同內容會拒絕。

Google Sheets 不提供跨多工作表交易。若寫入中途失敗，Request 可能停在 processing；`verifyInventoryConsistency()` 用於檢查異常，必要時由授權維護者備份後對照 Requests／Participants／Allocations／InventoryLog 人工復原。不得建立新 requestId 重送來掩蓋不一致。

公開匿名 API 無法用 requestId 證明每筆來自不同自然人；冪等只防同一請求重複扣庫存，不是限領一次或防濫用措施。公開 Production 前應由活動／安全負責人決定伺服器端限制或現場受控提交方式。不要把前端隱藏按鈕當安全邊界。

## 測試界線與未確認事項

Repository 測試使用 Node VM、記憶體 Spreadsheet、localStorage Mock；不得連真實 API 或 Production Sheets。Repository 本身無法確認遠端 Apps Script 是否已部署、migration 是否已執行、Web App 權限是否正確、或 Google Sheet 是否使用相同 schema。這些都需依實際 Google 帳戶手動確認。

本文件未執行任何 Google 遠端操作、Migration、庫存調整、Deployment 或 GitHub Pages 發布。
