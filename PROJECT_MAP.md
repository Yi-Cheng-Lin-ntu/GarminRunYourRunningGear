# Garmin Run 2026 Project Map — V2

以 2026-11-09 工作區為準；本機 V2 驗收版本，不代表正式上線。舊架構文件在 `archive/v1/PROJECT_MAP.md`。

## 入口與狀態

`/` → `js/appV2.js` → Quiz → Result + Sustainability invitation → Contact → Redemption。

`/cute/` → `cute/preview.js` → `js/app.js`（V1 controller）→ `archive/v1/content.csv`／`legacyClassificationRules.js`。

視覺入口與 API Mode 獨立。共用 API client 的 `?mode=apps-script-demo` 仍指向既有 Demo Web App；未傳則 Mock。V2 提交前查公開狀態的 `quizVersion`，不相容則阻擋。沒有新增 Production 模式或公開部署設定。

## 檔案地圖

| 檔案 | 職責 |
|---|---|
| `index.html` | 主網站 V2 DOM，結果頁邀請與獨立聯絡頁 |
| `style.css` | 主網站唯一樣式表；含元件、結果頁、補水邀請、領獎與響應式樣式 |
| `js/appV2.js` | V2 狀態、問題 rendering、結果／邀請、必填聯絡、同 request 重試、回首頁 |
| `js/contentData.js` | CSV parser／雙語資料映射；V2 強制五題三選、九推薦、獨立標籤欄 |
| `content.csv` | V2 唯一執行期內容來源 |
| `js/hydrationEquipment.js` | 依 `runnerType:hydrationStyle` 映射補水裝備展示圖片；不使用獎品庫存 ID |
| `js/classificationEngine.js` | `classifyV2AnswerIds()`、Q2 平手、Q4 style；明確 version=1 時保留舊規則 |
| `js/classificationRules.js` | V2 version=2、四個計分題與 Q2 tie break 設定 |
| `js/prizeEligibility.js` | existing／joined／considering 資格，原邏輯未改 |
| `js/participationValidation.js` | V2 Mock／前端 payload 檢查，Demo 測試信箱與告知確認 |
| `js/apiClient.js` | 前端 Mock／Apps Script Demo API adapter；Apps Script 後端程式獨立於此模組 |
| `js/sessionRecovery.js` | 原 recovery／pending keys；新流程不恢復舊領獎頁 |
| `js/redemptionView.js` | 從舊 app 抽出的同一套領獎 rendering，兩版共用，分配由後端決定 |
| `js/uiVariant.js` | 歷史 Cute 顯示設定與 `resolveProjectAsset()`，V2 僅使用資產解析 |
| `js/app.js`、`legacyClassificationRules.js` | Cute／V1 參考 controller 與分類規則，讀取 `archive/v1/content.csv` |
| `cute/` | 使用 `cute/base.css`、`cute/cute.css` 與 `cute/preview.js`；不載入主站 `style.css` |
| `archive/v1/` | V1 CSV 與歷史 README／Map／Design System |
| `assets/result/` | 使用者提供的三張 PNG；未生成、下載、替換或重新編碼 |
| `assets/waterequip/` | 三張補水裝備 PNG；由 `js/hydrationEquipment.js` 映射至結果推薦區 |
| `UI_TUNING_GUIDE.md` | CSS 變數、CSV 文案欄位與 DevTools 操作指引 |
| `apps-script/*.gs` | 下述 V2 後端與既有分配／管理 |

## CSV 契約

保留原欄位及順序，尾端追加 `hydration_style`、`slogan_zh/en`、`tag1_zh/en` … `tag4_zh/en`。

- `metadata` / `quizVersion`：中文值 2，辨識 V2 schema。
- `question`：Q1–Q5，固定順序；配對 `question_subtitle` row 以 `parent_id=q1...q5` 提供雙語副標。
- `option`：每題三個唯一 ID；四個計分題為 `qN_experience/lifestyle/performance`。
- Q4 只允許 `q4_precision/rest/pioneer`，traits 空白、hydration_style 對應；只有 pioneer 的 sustainability=true。
- `result`：三個原 ID、狗狗名稱、固定 slogan、四個獨立 tag 欄、PNG／alt；標籤空字串保留位置。
- `recommendation`：以 `parent_id=runnerType`、`hydration_style` 建立九個唯一映射；zh/en 為裝備／肯定標題，description 為推薦文案。pioneer 的 runtime gear=null。
- `ui`：新版標籤、錯誤、測試告知，使用 `v2.*` key。英文暫譯，尚待核定。

CSV parser 保留逗號、雙引號、多行文字能力；不要移除欄位、手動破壞引號或將空白 tag 寫成「空白」。

## 分類與資格

Q1／Q2／Q3／Q5 各一分；最高分平手用 `answers.q2` 的類型，不看顯示排序。Q4 完全不計分。

| Q4 | hydrationStyle | existingSelfHydration | 可選 commitment | premium |
|---|---|---|---|---|
| q4_precision | precision | false | joined／considering | false |
| q4_rest | rest | false | joined／considering | false |
| q4_pioneer | pioneer | true | existing | true |

sustainabilityRewardEligible = existingSelfHydration 或 joined。狗狗名稱不參與資格；結果頁的承諾不是第六題或跑團會員。

## V2 提交與儲存

共用原 payload，增加 `quizVersion:2`、`hydrationStyle`、`q4Answer`、`privacyConfirmed:true`、Demo 的 `testDataConfirmed:true`；仍傳原 answers、runnerType、eligibility、sessionId、requestId。

姓名／Email／告知確認全員必填；合法提交固定 raffleOptIn=true。Mock notice=DRAFT_NOT_APPROVED、Demo=DEMO_ONLY，均為測試標記。Production 原設定為 DRAFT_NOT_APPROVED，所有提交必經版本檢查並被拒絕；沒有 opt-out 路徑繞過。

Participants／DemoParticipants 既有18欄不移動，追加：第19欄 quizVersion、第20欄 hydrationStyle、第21欄 q4Answer。舊列新欄保持空白，不回填猜測；舊題 Q4 與 V2 語意不同，不應合併分析。Requests／Allocations／Prizes／InventoryLog／Settings 不改 schema。Mock V2 participant 同步存三欄；舊紀錄不刪除、不重設庫存。

## Apps Script 更新

需更新 Code.gs、Validation.gs、Allocation.gs、Setup.gs；Inventory.gs 不需變更。已部署 `/exec` 不會因本機 `.gs` 或 GitHub push 自動更新。

現有 Demo 只手動執行 `migrateDemoV2()`，追加 DemoParticipants metadata header，不碰正式表與任何庫存。不得為測試執行整套 setup／正式 migration。缺 migration 時在任何 request／扣庫存寫入前拒絕。詳細順序見 `apps-script/README.md`。

新的後端只接受 V2；舊／cute 的 V1 payload 在新 `/exec` 會得到 UNSUPPORTED_QUIZ_VERSION。保留舊部署供參考時應使用獨立部署URL，但本輪不建立或切換任何部署。V2 UI 對舊 `/exec` 先查版本後阻擋提交。

## 測試與安全邊界

`node --test tests/*.test.mjs`：原 Mock／資格 + V2 exhaustive分類、文案、PNG、九推薦、聯絡與確認、Demo reserved email、Production草稿、記憶體後端分配與append-only migration。

`tests/v2UiRegression.cjs`：五尺寸主流程、雙語、圖片／標籤不重疊、空白格、必填／邀請 gating、Mock獎品與paused、刷新／重測、Pages子路徑、舊後端阻擋與V2 Demo fixture、Cute參考smoke。

本輪不做真實遠端寫入、高並發、故障注入或 processing 部分寫入恢復；不變更部署、庫存或真實個資。姓名／Email不寫URL、一般console、公開文件或截圖。測試只在隔離瀏覽器contexts與記憶體Sheet操作。
