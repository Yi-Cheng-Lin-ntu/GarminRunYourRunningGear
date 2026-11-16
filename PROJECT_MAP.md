# Garmin Run 2026｜專案地圖

本文件只描述目前主網站與仍在使用的測試／後端程式。Cute、V1、舊版 UI 截圖與版面參考已移入 `/_archive/`，不屬於主站執行路徑。

## 使用者流程

```text
首頁 → Q1–Q5 → 結果卡＋補水推薦 → 永續選擇（pioneer 除外）
     → 匿名提交 → Apps Script 驗證與分配 → 兌獎頁／獎品暫停頁
```

分類只看 Q1、Q2、Q3、Q5；四題最高分平手時依 Q2 答案所屬類型決勝。Q4 是獨立補水答案：`precision`／`rest` 表示尚未自帶補水，`pioneer` 表示既有自帶補水。九種補水建議以 `runnerType × hydrationStyle` 對應。

三種 runner ID 固定為 `experience`、`lifestyle`、`performance`，目前顯示名稱依序為「賽事收藏家」、「自在巡航員」、「配速計算機」。內容由 `content.csv` 提供，結果圖位於 `assets/result/`。

## 主站檔案與責任

| 路徑 | 責任 |
|---|---|
| `index.html` | 主站 screen 結構、共用結果卡、兌獎互動區和分享卡舞台；無姓名／Email表單 |
| `style.css` | 主站唯一 stylesheet，含首頁、測驗、結果、分享輸出和兌獎版面 |
| `content.csv` | 中英文題目、選項、跑者名稱／slogan／標籤、九種補水文案及 UI 文字 |
| `js/appV2.js` | 畫面流程、CSV 文案套用、結果 render、永續選擇、匿名提交與結果 PNG UI |
| `js/contentData.js` | 讀取及解析 CSV、建立內容資料映射 |
| `js/classificationEngine.js` | 前端計分、Q2 平手、Q4 hydrationStyle 判定 |
| `js/classificationRules.js` | 測驗版本和分類設定 |
| `js/prizeEligibility.js` | existing／joined／considering 獎品資格映射 |
| `js/participationValidation.js` | 匿名 payload 驗證及拒絕個資欄位 |
| `js/apiClient.js` | 本機 Mock、Apps Script 請求、同 request 恢復和 Mock localStorage 清理 |
| `js/environment.js` | Development、Demo、Production 入口判定和共用 `/exec` URL |
| `js/sessionRecovery.js` | sessionStorage 保存待重試 payload、requestId 與 sessionId |
| `js/redemptionView.js` | 已分配／暫停領獎畫面；含 Pioneer 專屬標籤判定 |
| `js/shareCard.js` | 複製網站共用結果卡 DOM，DOM-to-image 產生 1080×1920 PNG |
| `js/hydrationEquipment.js` | 九種結果對應的補水裝備圖片 |
| `js/projectAssets.js` | GitHub Pages 子路徑下解析本地資產 |
| `js/vendor/html-to-image.js` | 隨 repo 提供的 DOM-to-image 函式庫；含 license 檔 |
| `assets/`、`taipei.svg` | 主站結果、補水、獎品、永續及背景視覺資產 |

主站沒有 `/cute/` 執行入口。舊 Cute 原型封存在 `_archive/cute-prototype/`；不可把該處歷史程式當現行主站來源。

## API 與資料流

1. `appV2.js` 用 CSV 問題資料蒐集五個原始 answer ID，呼叫 `classificationEngine.js` 建立結果。
2. 使用者完成必要的永續響應選擇後，產生匿名 payload：`submissionVersion: 1`、`quizVersion: 2`、答案、分類／補水狀態、隨機 `requestId` 和 `sessionId`。
3. `participationValidation.js` 檢查 payload；禁止姓名、Email、電話、地址、抽獎和個資同意欄位。
4. `apiClient.js` 根據 `environment.js` 走 local Mock 或 `/exec`。前端核對公開狀態版本和 Demo 標記；Production 失敗時不會退回 Mock。
5. Apps Script `Validation.gs` 重新驗證答案、重算分類與資格；`Allocation.gs` 執行冪等檢查、分配及寫表。
6. 只有後端成功回覆後才進入兌獎畫面；paused 回應隱藏獎品卡，顯示「獎品已發放完畢，謝謝參與」。

Pioneer 標籤只由原始 Q4 `pioneer` 判斷，且只在購物袋優先分配成功時顯示「先鋒隊專屬」。有永續獎勵資格但不是優先購物袋的跑者仍顯示綠色「恭喜你抽中！」。這與是否採綠色兌獎主題是不同判斷。

## API 環境

`js/environment.js` 目前只設定一個 Apps Script Web App URL：

- `localhost`、Codespaces host 且無 Demo query：Development localStorage Mock。
- 任一 host 加 `?mode=apps-script-demo`：同一 `/exec` 帶 Demo mode，Apps Script 寫入 `Demo*` 工作表。
- GitHub Pages 一般網址：同一 `/exec` 不帶 mode，Apps Script 寫入 Production 工作表。
- `STAGING_HOSTS` 中的 `.invalid` host 是未部署的 placeholder，不構成可用的獨立 Staging 環境。

Demo mode 是工作表路由，不是認證或 API 存取控制。正式入口會使用正式庫存，不得用一般公開網址做測試提交。

## Apps Script 檔案

| 路徑 | 責任 |
|---|---|
| `apps-script/Code.gs` | GET status／request recovery、POST 匿名提交、Demo／Production tab routing |
| `apps-script/Validation.gs` | payload 驗證、伺服器重算分類與資格、個資欄位拒絕 |
| `apps-script/Allocation.gs` | requestId＋fingerprint 冪等、LockService 分配、Participants／Requests／Allocations／InventoryLog 寫入 |
| `apps-script/Inventory.gs` | 管理員庫存調整、分配暫停／恢復、一致性檢查 |
| `apps-script/Setup.gs` | 空白 Sheet 安裝、中文化與 schema migrations；`setupActivitySheets()` 可能初始化獎品，只適用全新空白資料庫 |
| `apps-script/README.md` | API 契約、schema、操作風險及人工部署程序 |

### 現行匿名 API 欄位

Request 的必要欄位包括 `submissionVersion`、`quizVersion`、`requestId`、`sessionId`、`answers.q1–q5`、`runnerType`、`hydrationStyle`、`q4Answer`、`existingSelfHydration`、`hydrationCommitment`、`sustainabilityRewardEligible`、`premiumPrizeEligible`。不接受任何姓名、Email、聯絡方式或隱私告知欄位。

Response 會含 `allocationStatus`（`allocated`／`paused`）、runnerType、獎品（paused 時為 null）、requestId/sessionId 等技術資料。`requestId` 只保護同一提交重播，不限制每人施測次數。

## Sheets 欄位與 Migration

`Setup.gs` 的 Production `Participants` 允許精簡 13 欄摘要 schema：participantId、createdAt、runnerType、existingSelfHydration、sustainabilityRewardEligible、premiumPrizeEligible、hydrationStyle、q1Answer–q5Answer、nameZh（獎品中文名稱）。匿名完整 schema 則是舊 18 欄＋V2 三欄＋匿名五欄，共 26 欄；新匿名列的 legacy raffle/name/email/privacy 欄位留空。Demo `DemoParticipants` 使用 26 欄。`Requests`／`DemoRequests` 是舊 7 欄＋`submissionVersion`、`submissionFingerprint`，共 9 欄。

- `migrateStagingAnonymousSchema()`：處理 DemoParticipants／DemoRequests，只追加已知缺少欄位。
- `migrateProductionAnonymousSchema()`：處理 Participants／Requests；可支援精簡 13 欄 Participants，不再追加參與者欄，只檢查／追加 Requests 欄位；舊完整 schema 則 append-only 追加。
- `migrateProductionParticipantSummary()`：把已知完整 Participants schema 轉為 13 欄，會覆寫參與者範圍並刪除額外欄位，屬破壞性 migration。未經備份、試算表副本演練及授權，不可執行。

Migration 不應由此 Repository 自動觸發。不要在既有 Spreadsheet 執行 `setupActivitySheets()`，不要重設 Prizes 或庫存。詳見 [Apps Script 手冊](apps-script/README.md)。

## 測試索引

- `tests/v2.contract.test.mjs`：答案、分類／Q2 平手、九種推薦及匿名資料契約。
- `tests/v2.backend.test.mjs`：記憶體 Sheets、migration、分配、fallback、paused、冪等及庫存。
- `tests/v2.mock.test.mjs`、`tests/mockBackend.test.mjs`：local Mock、資格、重播與庫存行為。
- `tests/prizeEligibility.test.mjs`：existing／joined／considering 資格。
- `tests/environment.test.mjs`：Mock／Demo／Production 路由與 fail-closed。
- `tests/mainRunnerNames.test.mjs`、`tests/hydrationEquipment.test.mjs`、`tests/redemptionView.test.mjs`：顯示名稱、裝備資產及兌獎呈現。
- `tests/v2UiRegression.cjs`：選用 Playwright 瀏覽器流程測試；需本機安裝 Chromium／Playwright，與 Node 單元測試分開。

預設快速驗證採與變更範圍相稱的測試；核心契約、後端資料或正式流程變更需跑相關測試。測試只能使用 fixture／Mock，不得呼叫正式 API 或操作真實庫存。
