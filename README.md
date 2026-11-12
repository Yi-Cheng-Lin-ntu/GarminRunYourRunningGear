# Garmin Run 2026｜跑者風格測驗

五題匿名跑者測驗，結果頁同時呈現補水建議與永續倡議；使用者選擇後提交匿名結果，由 Google Apps Script 重新驗證並即時分配現場周邊。活動紙本抽獎獨立於網站，不建立線上抽獎名單。

## 流程與資料

1. Q1、Q2、Q3、Q5 計分；平手依 Q2 答案決定跑者類型。
2. Q4 獨立決定補水類型；只有 pioneer 表示既有自帶補水。
3. 非 pioneer 在結果頁選擇加入或考慮；pioneer 沿用 existing。
4. 按下「繼續領獎」後前端提交匿名答案、分類、補水狀態與技術請求識別碼。
5. Apps Script 重算答案與資格，在 LockService 保護下執行即時分配；成功或暫停結果才進入領獎頁。

跑者 ID 仍為 experience、lifestyle、performance，顯示名稱依 content.csv。保留既有 A 級購物袋優先、一般獎品依剩餘庫存加權、fallback、暫停、RequestId 冪等性及庫存日誌。

**網站不蒐集或提交姓名、Email、電話、地址、同意資料或紙本抽獎資料。** requestId、sessionId、時間與答案仍是可關聯的技術／活動資料，故不宣稱符合所有法規意義上的完全匿名。sessionId 僅供同一提交恢復，不作跨活動識別。

## API 環境與預覽

API 環境由 js/environment.js 依部署 hostname 決定，不接受網址 query string 切換 Mock：

- localhost、Codespaces：Development，使用瀏覽器 localStorage 測試庫存與匿名 Mock 紀錄。
- 經明確設定的 Staging hostname：使用獨立測試 Apps Script／Spreadsheet；目前尚未設定 Staging URL 與 hostname。
- 其他 hostname（含 GitHub Pages）：Production。Production API URL 目前留空，因此提交安全停用，不會靜默切回 Mock。

在 Codespaces 啟動：

    python3 -m http.server 8020 --bind 0.0.0.0

從 Ports 開啟 8020。Mock 資料只在該瀏覽器來源的本機儲存；啟動新版本會移除舊 Mock 參加者紀錄中的姓名／Email 欄位，新的 Mock 不寫這些欄位。Production 不展示 Mock 工具，也不讀取或分配 Mock 獎品。

## Apps Script 與 Sheets

Repo 中 .gs 原始碼不會自動更新遠端 /exec。請先看 Apps Script 部署與遷移手冊。匿名契約為 submissionVersion 1、quizVersion 2；Apps Script 以 Script Property APP_ENVIRONMENT 決定 staging 或 production，忽略並拒絕前端環境切換欄位。

Migration 僅追加 Participants 的 8 個追溯欄，以及 Requests 的 2 個冪等欄位；保留舊 18 欄、舊資料及所有庫存。Migration 不執行 setupActivitySheets()，也未對遠端 Spreadsheet 執行。

## 開發與驗證

    node --test tests/*.test.mjs

測試使用記憶體 Spreadsheet 與本機 Mock；不可連正式 API、正式 Sheet 或正式庫存。選用瀏覽器測試 tests/v2UiRegression.cjs 只適用本機/Codespaces，需已安裝 Playwright 與 Chromium。

## 文件

- PROJECT_MAP.md：入口、資料流、API 與欄位契約。
- DESIGN_SYSTEM.md：既有主網站視覺規範。
- UI_TUNING_GUIDE.md：結果頁 CSS 與 CSV 文案維護。
- apps-script/README.md：Staging／Production 隔離、migration、部署及回滾。
- V2_REVIEW.md：本次匿名流程改版與驗證摘要。

本次程式碼未部署 Apps Script、未發布 GitHub Pages、未連線或修改任何遠端試算表，亦未提交真實參與紀錄。
