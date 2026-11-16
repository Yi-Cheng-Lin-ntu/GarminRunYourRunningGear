# Garmin Run 2026 Project Map

此文件描述目前匿名測驗提交版本。前端為 HTML/CSS/Vanilla JS ES Modules，部署目標為 GitHub Pages；獎項分配由 Apps Script + Google Sheets 執行。

## 使用者流程與資料流

測驗 → 結果＋永續倡議 → 匿名提交 → 後端分配 → 領獎結果。

1. js/contentData.js 載入 content.csv，提供中英文題目、跑者結果、九種補水內容與介面文案。
2. js/classificationEngine.js 按 Q1、Q2、Q3、Q5 分類，最高分平手採 Q2 的答案；Q4 獨立產生 hydrationStyle、q4Answer 和 existingSelfHydration。
3. js/prizeEligibility.js 根據 existingSelfHydration 和結果頁的 joined／considering 選擇產生兩種獎項資格。只有 existing 有購物袋優先資格。
4. js/appV2.js 在結果頁完成匿名 payload，保留相同 requestId 重試；成功或 paused 回應才交給 js/redemptionView.js。
5. js/apiClient.js 依 js/environment.js 的 hostname 環境使用 Development Mock、已設定的 Staging API 或 Production API。Production 沒有 API URL 時提交停用，沒有 Mock fallback。
6. Apps Script Validation.gs 依伺服器答案重算 runnerType 和 Q4，核對前端分類及資格。Code.gs 依請求 `mode=apps-script-demo` 選擇 Demo 系列工作表；一般請求選 Production 系列工作表。Allocation.gs 在 LockService 下分配，寫入匿名答案與庫存異動。

網站沒有聯絡資料頁。紙本抽獎獨立運作，不由網站收集或匯出紙本名單。

## 主站入口與重點檔案

| 檔案 | 用途 |
|---|---|
| index.html | 首頁、五題、結果、領獎畫面；不含姓名／Email表單 |
| style.css | 主網站唯一 CSS；保留既有主題與結果／領獎版面 |
| content.csv | 執行期雙語內容、結果名稱、Slogan、tag、九種推薦與 UI 文案 |
| js/appV2.js | 畫面狀態、題目呈現、結果資料、補水選擇、匿名提交、重試與刷新恢復 |
| js/contentData.js | CSV 解析與資料映射 |
| js/classificationEngine.js | 前端分類；Q1/Q2/Q3/Q5 計分、Q2 tie-break、Q4獨立 |
| js/classificationRules.js | 版本與計分題設定 |
| js/prizeEligibility.js | existing／joined／considering 的資格映射 |
| js/participationValidation.js | 前端匿名提交契約檢查；拒絕姓名、Email等個資欄位 |
| js/apiClient.js | 本機 Mock、Apps Script API、分配恢復與 Mock 資料最小化 |
| js/environment.js | Development／Staging／Production 路由及 API URL 設定 |
| js/sessionRecovery.js | 以 sessionStorage 暫存匿名待重試 payload、requestId、sessionId |
| js/redemptionView.js | 顯示已確認的獎品或 paused 畫面 |
| js/shareCard.js | 結果 PNG 輸出，不參與資料提交 |
| js/hydrationEquipment.js | 九種結果所用補水裝備圖片映射 |
| apps-script/Code.gs | 匿名 API、部署環境、status、既有分配恢復 |
| apps-script/Validation.gs | 伺服器驗證、重算分類、拒絕個資欄位 |
| apps-script/Allocation.gs | request 冪等、獎品分配、Participants／Requests／Allocations／InventoryLog寫入 |
| apps-script/Setup.gs | 空白活動表安裝及 append-only 匿名 schema migration |
| apps-script/Inventory.gs | 管理員庫存調整、暫停與一致性檢查；不再匯出抽獎名單 |
| tests/v2.contract.test.mjs | 五題、分類、九種結果及前後端契約 |
| tests/v2.backend.test.mjs | 記憶體 Sheets、匿名寫入、migration、冪等與獎品分配 |
| tests/v2.mock.test.mjs | Development Mock、重播與舊本機資料清理 |
| tests/environment.test.mjs | Production query 隔離與 fail-closed |
| tests/mockBackend.test.mjs | 獎品資格、Mock分配及防重 |
| tests/v2UiRegression.cjs | 可選的本機瀏覽器流程測試 |
| apps-script/README.md | 分環境部署、migration、測試與回滾手冊 |

歷史 Cute 原型及 V1 controller 保存在封存目錄，不由主站載入。圖片資產與原版結果視覺未因匿名流程改版而重做。

## 分類與補水契約

- 計分只看 Q1、Q2、Q3、Q5；答題選項隨機顯示不影響答案 ID。
- 平手必須採 Q2 選項所屬類型。
- Q4 precision/rest → existingSelfHydration=false；pioneer → true。
- hydrationCommitment：pioneer 必須 existing；其他 Q4 必須 joined 或 considering。
- sustainabilityRewardEligible = existingSelfHydration || joined。
- premiumPrizeEligible = existingSelfHydration。
- 九種推薦依 runnerType × hydrationStyle；推薦與分類結果名稱不反向影響資格。

## 匿名 API 契約

前端 request 版本為 submissionVersion 1、quizVersion 2。環境由部署端決定，不允許 request 指定 demoMode。

匿名 request 欄位：

- requestId、sessionId：每輪／每次提交的隨機技術識別碼。
- answers：q1–q5 原始答案 ID。
- runnerType、hydrationStyle、q4Answer。
- existingSelfHydration、hydrationCommitment、sustainabilityRewardEligible、premiumPrizeEligible。
- submissionVersion、quizVersion。

不允許 name、email、phone、address、raffleOptIn、privacyConfirmed 或個資告知版本欄位。伺服器重算答案和資格後才寫表或分配。

成功 response 含 ok、allocationStatus、runnerType、prize（或 null）、requestId/sessionId、匿名 participantId、分配方式與 sustainabilityRewardEligible。paused 回應不含獎品，不可顯示恭喜得獎。

Apps Script 目前由單一 Web App 依請求 mode 路由至同一 Spreadsheet 內不同的 Demo／Production 工作表。前端 `?mode=apps-script-demo` 會把 mode 帶到 `/exec`；一般 GitHub Pages 入口不帶 mode，使用 Production 工作表。兩組庫存仍由不同工作表隔離。

## Sheets schema 與 migration

舊 Participants 18 欄原樣保留，已存在的 V2 尾欄為 quizVersion、hydrationStyle、q4Answer。匿名 migration 再 append：

1. Participants：submissionVersion、q1Answer、q2Answer、q3Answer、q5Answer。
2. Requests：submissionVersion、submissionFingerprint。

因此由 18 欄 legacy Participants 最終追加 8 欄；由既有 21 欄 V2 Participants 只追加 5 欄。Q4 已由 q4Answer 保存，不重複。舊姓名／Email／告知欄位不刪除，但所有匿名新列留空；舊列保留不回填。Requests 保留原 7 欄並追加 2 欄。Migration 檢查已知表頭、只 append、重跑安全、未知結構時停止，不碰獎品或庫存。

現有工作表禁止直接執行 setupActivitySheets()；它是全新空白試算表安裝流程，可能初始化獎品。

## 環境與安全限制

- Development 僅在 localhost／Codespaces 使用 localStorage Mock。舊 Mock participant 個資欄位會在啟動時清除；新 Mock 不存個資。
- Staging 需專用 Spreadsheet、Apps Script 專案與測試庫存。未設定 API URL / hostname 前不連線。
- Production GitHub Pages 不顯示 Mock badge、Mock 工具，也不能從 query string 啟用 Mock。未配置 Production URL 時安全停用提交。
- GAS 只接受 `mode=apps-script-demo` 或預設 Production；未知 mode 會拒絕。Mode 用於路由工作表，不是存取控制。
- requestId 只防同一提交重播，不限制同一自然人多次施測。公開匿名 API 仍可能被濫用而消耗庫存；正式開放前需核准伺服器端 CAPTCHA／節流或現場通路控制方案。
- Spreadsheet 採最小權限分享；原始答案及 allocation/InventoryLog 需制定活動結束後保留與刪除時程。暫定提案：原始答案在活動結束後 90 日彙總後刪除；庫存／操作稽核資料保留 12 個月，需由資料負責人核定。本程式不自動刪除資料。

## 測試與部署界線

node --test tests/*.test.mjs 只應使用本機瀏覽器 Mock 和記憶體 Spreadsheet fixture。不可在測試中呼叫真實 Apps Script、正式 Sheet 或正式庫存。

此 Repository 的 .gs 尚需人工同步到 Staging Apps Script、執行 staging migration 並驗收。Production migration、部署和 GitHub Pages 發布未執行，亦不可由測試自動觸發。
