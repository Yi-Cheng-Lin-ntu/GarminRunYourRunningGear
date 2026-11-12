# Codex Handoff｜匿名測驗與即時獎項分配改版

最後整理：2026-11-12。工作區位於 main；未 commit、push、deploy。未連線或操作 Google Sheets、正式 API、正式庫存，也未提交參與紀錄。

## 已完成

- 前端移除姓名、Email、個資確認與線上抽獎登記表單；結果頁直接驗證補水選擇並提交匿名測驗。
- Request 使用 submissionVersion 1 / quizVersion 2，包含 Q1–Q5、runnerType、hydrationStyle、Q4 原始答案、補水承諾、計算後資格與 requestId/sessionId。不含姓名、Email、電話、地址、抽獎或個資告知欄位。
- 前端／Mock 與 Apps Script 都拒絕個資欄位；保留既有 5 題分類、Q2 平手、Q4 分類、資格及獎項分配規則。
- 同一次提交保留 requestId、sessionId 與匿名 payload 供重試／重新整理恢復。Apps Script Requests 新增 submissionFingerprint，拒絕相同 requestId 搭配不同提交內容；重播完成請求不會再扣庫存。
- 新流程只在後端回覆分配成功或 paused 後顯示領獎頁；無獎品時 prize 為 null，不顯示獲獎畫面。
- Development Mock 只在 localhost／Codespaces hostname 運作。Production 不因 query string 啟用 Mock，未設定 API URL 時 fail closed；Mock 工具於正式環境隱藏及拒絕事件操作。
- Mock 新資料不儲存個資；初始化時清除同源舊 Mock participant 記錄中的姓名、Email、電話、地址、抽獎及告知欄位。待重試 payload 改存 sessionStorage。
- Apps Script 由 Script Property APP_ENVIRONMENT 決定環境；不接受前端 demoMode 切換。Staging／Production 須分開 Script 專案及 Spreadsheet。
- 新增可重跑 append-only migration：Participants 追加匿名版本與 Q1/Q2/Q3/Q5 欄；Requests 追加 submissionVersion、submissionFingerprint。保留舊欄、舊資料及庫存；migration 不初始化獎品。
- 移除 Apps Script 線上抽獎名單 CSV 匯出功能。更新 README、PROJECT_MAP、Apps Script 手冊及相關設計／UI 文件。

## 已修改檔案

- 前端：index.html、content.csv、js/appV2.js、js/apiClient.js、js/environment.js（新增）、js/participationValidation.js、js/sessionRecovery.js。
- Apps Script：apps-script/Code.gs、Validation.gs、Allocation.gs、Setup.gs、Inventory.gs。
- 測試：tests/environment.test.mjs（新增）、tests/v2.backend.test.mjs、tests/v2.contract.test.mjs、tests/v2.mock.test.mjs、tests/mockBackend.test.mjs、tests/v2UiRegression.cjs。
- 文件：README.md、PROJECT_MAP.md、apps-script/README.md、DESIGN_SYSTEM.md、UI_TUNING_GUIDE.md、docs/ui-screenshots/current-zh/README.md。
- 最新 git status 仍有未提交修改。tests/hydrationEquipment.test.mjs 在本次開始前已是修改狀態，未由本任務編輯；其修改仍保留。style.css 在最新 status 中沒有差異，本次沒有修改 CSS。

## 測試結果

已執行：

- 目標測試：v2.contract、v2.backend、v2.mock、mockBackend，通過。
- 全部 Node 測試：node --test tests/*.test.mjs，8 個測試檔通過、0 失敗。包含 243 種分類組合、Q2 平手、九種推薦、匿名契約、個資欄位拒絕、Mock 個資清理、append-only migration、冪等回放、paused、既有獎品優先／fallback。
- js/appV2.js、js/apiClient.js、js/participationValidation.js 曾通過 node --check。

未執行：

- tests/v2UiRegression.cjs 尚未以 Playwright／Chromium 執行；沒有本次瀏覽器視覺驗收或截圖。
- 未呼叫遠端 Apps Script，也未在任何真實 Spreadsheet 執行 migration。
- 未驗證已部署的 Web App URL、執行身分、存取權限、CORS 或遠端 schema。

## 尚未修復／風險

1. **Staging 與 Production API 尚未配置。** js/environment.js 的兩個 API URL 為空，Staging hostname 仍是不可用 placeholder。正式網站因此安全停用提交。需先建置隔離環境，再填 hostname／URL；不可沿用舊 Demo deployment 直接當成獨立 Staging。
2. **Apps Script 原始碼尚未同步／部署。** 必須更新 Code.gs、Validation.gs、Allocation.gs、Setup.gs、Inventory.gs；設定獨立專案的 APP_ENVIRONMENT。舊 /exec 不支援 submissionVersion 1，新前端會因 status 缺少該版本而停止提交。未部署前不可宣稱前後端整合完成。
3. **Sheets migration 尚未執行。** 對 Staging 先備份並確認 DemoParticipants／DemoRequests 表頭，再執行 migrateStagingAnonymousSchema()。正式 migrateProductionAnonymousSchema() 僅在核准後由維護者執行。不得以 setupActivitySheets() 代替 migration。
4. **Sheets 非交易式部分寫入仍需人工恢復。** Allocation.gs 以 LockService 保護寫入順序，但多工作表不能原子交易。中途失敗可能留下 processing request 或表間不一致；Inventory.gs 的 verifyInventoryConsistency() 可提示 processing 與庫存／allocation 計數異常，仍需人工對帳。尚無自動補償或自動修復，也未做故障注入。
5. **公開匿名 API 濫用風險未解決。** requestId 防同一請求重播，不代表一人限領一次；目前沒有伺服器驗證 CAPTCHA、可信代理節流或身份限制。公開正式分配前需由安全／活動負責人決定防濫用方案。
6. **舊試算表歷史個資仍保留。** 新程式不再寫入，但 append-only migration 刻意不刪除舊姓名／Email欄或歷史紀錄。需限縮 Sheets 存取並核定保留／刪除時程。文件中的 90 日原始答案、12 個月操作紀錄僅為待核准提案，程式未自動刪除。
7. **瀏覽器流程未測。** 更新後的 tests/v2UiRegression.cjs 尚未執行；下一次可先在 Codespaces 本機啟動 server，以 Playwright 驗證匿名提交、九種結果組合、refresh/retry、Mock 儲存不含個資及 RWD。若 Playwright 未安裝，不需為此任務擅自加進網站 runtime dependencies。

## 下一步建議

1. 先檢視本 handoff 與目前差異，確認 Staging hostname、專用 Spreadsheet、Apps Script 專案及 API URL。
2. 僅在 Staging 備份後更新五份 .gs，設定 APP_ENVIRONMENT=staging，執行 staging migration，檢查欄位及庫存未變。
3. 配置 js/environment.js 的 Staging hostname／URL，執行 Codespaces Mock 與獲授權的 Staging 端到端測試。
4. 針對 Apps Script 部分寫入與公開匿名 API 濫用風險補足核准方案及測試。
5. Production URL、migration、deployment、GitHub Pages 發布均須由使用者／授權維護者另行核准；不要自動執行。
