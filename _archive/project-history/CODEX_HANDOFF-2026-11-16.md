# Codex Handoff｜匿名測驗與即時獎項分配改版

最後整理：2026-11-16。工作區位於 main；本次變更尚未 commit、push 或部署。沒有呼叫會寫入 Google Sheets 的 API，也沒有操作庫存或提交參與紀錄。

## 已完成

- 前端移除姓名、Email、個資確認與線上抽獎登記表單；結果頁直接驗證補水選擇並提交匿名測驗。
- Request 使用 submissionVersion 1 / quizVersion 2，包含 Q1–Q5、runnerType、hydrationStyle、Q4 原始答案、補水承諾、計算後資格與 requestId/sessionId。不含姓名、Email、電話、地址、抽獎或個資告知欄位。
- 前端／Mock 與 Apps Script 都拒絕個資欄位；保留既有 5 題分類、Q2 平手、Q4 分類、資格及獎項分配規則。
- 同一次提交保留 requestId、sessionId 與匿名 payload 供重試／重新整理恢復。Apps Script Requests 新增 submissionFingerprint，拒絕相同 requestId 搭配不同提交內容；重播完成請求不會再扣庫存。
- 新流程只在後端回覆分配成功或 paused 後顯示領獎頁；無獎品時 prize 為 null，不顯示獲獎畫面。
- Development Mock 只在 localhost／Codespaces hostname 運作。Production 不因 query string 啟用 Mock，未設定 API URL 時 fail closed；Mock 工具於正式環境隱藏及拒絕事件操作。
- Mock 新資料不儲存個資；初始化時清除同源舊 Mock participant 記錄中的姓名、Email、電話、地址、抽獎及告知欄位。待重試 payload 改存 sessionStorage。
- Apps Script 共用單一 `/exec`；`mode=apps-script-demo` 路由到 Demo 系列工作表，無 mode 路由到 Production 系列工作表。這是表格路由，不是存取控制。
- 新增可重跑 append-only migration：Participants 追加匿名版本與 Q1/Q2/Q3/Q5 欄；Requests 追加 submissionVersion、submissionFingerprint。保留舊欄、舊資料及庫存；migration 不初始化獎品。
- 移除 Apps Script 線上抽獎名單 CSV 匯出功能。更新 README、PROJECT_MAP、Apps Script 手冊及相關設計／UI 文件。

## 已修改檔案

- 前端：index.html、content.csv、js/appV2.js、js/apiClient.js、js/environment.js、js/participationValidation.js、js/sessionRecovery.js。
- Apps Script：本次改動 apps-script/Code.gs、apps-script/Setup.gs；Validation.gs、Allocation.gs、Inventory.gs 沿用現有版本。
- 測試：tests/environment.test.mjs（新增）、tests/v2.backend.test.mjs、tests/v2.contract.test.mjs、tests/v2.mock.test.mjs、tests/mockBackend.test.mjs、tests/v2UiRegression.cjs。
- 文件：README.md、PROJECT_MAP.md、apps-script/README.md、DESIGN_SYSTEM.md、UI_TUNING_GUIDE.md、docs/ui-screenshots/current-zh/README.md。
- 本次環境路由修改仍在工作樹，尚未 commit／push／deploy；沒有修改 CSS。

## 測試結果

已執行：

- 2026-11-16 模式路由改版：`node --test tests/environment.test.mjs tests/v2.backend.test.mjs tests/v2.contract.test.mjs tests/v2.mock.test.mjs tests/mockBackend.test.mjs`，5 個測試檔通過、0 失敗；涵蓋單一 Web App 的 Demo／Production 表格隔離與前端 URL 模式。
- 目標測試：v2.contract、v2.backend、v2.mock、mockBackend，通過。
- 全部 Node 測試：node --test tests/*.test.mjs，8 個測試檔通過、0 失敗。包含 243 種分類組合、Q2 平手、九種推薦、匿名契約、個資欄位拒絕、Mock 個資清理、append-only migration、冪等回放、paused、既有獎品優先／fallback。
- js/appV2.js、js/apiClient.js、js/participationValidation.js 曾通過 node --check。

未執行：

- tests/v2UiRegression.cjs 尚未以 Playwright／Chromium 執行；沒有本次瀏覽器視覺驗收或截圖。
- 未呼叫遠端 Apps Script，也未在任何真實 Spreadsheet 執行 migration。
- 未驗證已部署的 Web App URL、執行身分、存取權限、CORS 或遠端 schema。

## 尚未修復／風險

1. **遠端 Apps Script 尚未更新。** 使用者提供的 `/exec` 曾回覆 `API_ENVIRONMENT_NOT_CONFIGURED`。本次 Code.gs 已改為按 `mode` 選 Demo／Production 工作表，需由使用者同步並部署更新後的程式，再分別查兩種狀態回應。
2. **前端與後端共用同一 Web App。** `?mode=apps-script-demo` 會把 mode 附在 API 請求；一般入口不帶 mode。前端仍會比對後端 `demoMode`，錯誤模式不會送出分配 POST。
3. **Sheets migration 尚未執行。** 備份後確認 DemoParticipants／DemoRequests 與正式 Participants／Requests 表頭，再分別執行 `migrateStagingAnonymousSchema()` 和 `migrateProductionAnonymousSchema()`。不得以 `setupActivitySheets()` 代替 migration。
4. **Sheets 非交易式部分寫入仍需人工恢復。** Allocation.gs 以 LockService 保護寫入順序，但多工作表不能原子交易。中途失敗可能留下 processing request 或表間不一致；Inventory.gs 的 verifyInventoryConsistency() 可提示 processing 與庫存／allocation 計數異常，仍需人工對帳。尚無自動補償或自動修復，也未做故障注入。
5. **公開匿名 API 濫用風險未解決。** requestId 防同一請求重播，不代表一人限領一次；目前沒有伺服器驗證 CAPTCHA、可信代理節流或身份限制。公開正式分配前需由安全／活動負責人決定防濫用方案。
6. **舊試算表歷史個資仍保留。** 新程式不再寫入，但 append-only migration 刻意不刪除舊姓名／Email欄或歷史紀錄。需限縮 Sheets 存取並核定保留／刪除時程。文件中的 90 日原始答案、12 個月操作紀錄僅為待核准提案，程式未自動刪除。
7. **瀏覽器流程未測。** 更新後的 tests/v2UiRegression.cjs 尚未執行；下一次可先在 Codespaces 本機啟動 server，以 Playwright 驗證匿名提交、九種結果組合、refresh/retry、Mock 儲存不含個資及 RWD。若 Playwright 未安裝，不需為此任務擅自加進網站 runtime dependencies。

## 下一步建議

1. 備份 Apps Script 專案及綁定 Spreadsheet，將更新後 Code.gs、Setup.gs 同步至遠端。
2. 建立新 Web App 版本，唯讀查詢 `?action=getPublicCampaignStatus&mode=apps-script-demo` 與無 mode 版本，確認分別回報 true／false。
3. 備份並核對兩組工作表，依核准操作執行 Demo 與 Production schema migration；不要執行 `setupActivitySheets()`。
4. 在 Demo 模式做端到端測試；Production 請先維持受控狀態，避免用測試提交正式庫存。
