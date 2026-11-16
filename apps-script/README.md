## 正式參與者表精簡（目前版本）

`Participants` 現在只保留以下 13 欄，順序固定：

1. 參與者代號
2. 建立時間
3. 跑者風格
4. 自備補水裝備
5. 永續獎勵資格
6. 優先獎品資格
7. 補水風格
8. 第1題答案
9. 第2題答案
10. 第3題答案
11. 第4題答案
12. 第5題答案
13. 獎品中文名稱

本節取代下方舊版文件對「正式 Participants 26 欄、保留姓名／郵件等欄位」的描述；DemoParticipants 仍維持 26 欄。Requests、Allocations、InventoryLog、Prizes、Settings 與 API 契約不變，本地 JS 不需修改。兌獎代碼仍保留於 API 結果／Requests，以維持原有前端流程；僅從正式參與者表移除。這不是跨工作表的歷史個資全面清除。

### 既有正式表轉換

1. 在儲存庫之外備份試算表，確認綁定檔案及正式 `Participants`。轉換會永久移除未列出的欄位及其內容，不會另外建立含舊個資的備份工作表。
2. 同步 `Setup.gs` 與 `Allocation.gs` 至 Apps Script，兩份必須一起更新。新版在轉換前仍可寫入原有完整 26 欄表。
3. 暫停現場提交、等待進行中的提交完成後，將 Web App 更新至新版，再於編輯器執行 `migrateProductionParticipantSummary()`；也可重新開啟試算表使用「Garmin Run 管理 → 精簡正式參與者欄位」。不要用初始化函式轉換既有表。
4. 核對 13 欄順序、原參與者筆數、五題答案及中文獎品名稱。此函式只寫入 `Participants`，不初始化獎品、不改庫存、不處理 Demo 或其他紀錄。先在試算表副本確認。
5. 確認新提交與相同提交重試正常後恢復現場操作。轉換後若回滾舊程式，須配合還原舊表結構，否則舊版 schema 檢查會拒絕提交。

轉換接受既有英文或中文的已知 18／21／26 欄格式與新版 13 欄格式，可重跑。舊格式原先未紀錄的答案／補水風格保留空白，不推測補值。舊獎品代碼依正式 `Prizes` 中文名稱回填；未知獎品代碼或未知表頭會在寫入前停止。未分配獎品時中文名稱留空。

本次僅在記憶體試算表測試，未修改遠端正式資料、未部署。若外部報表依舊欄位位置讀取 Participants，需配合更新。

## 中文表單資訊

新建工作表使用中文表頭；參與者紀錄的跑者風格、補水風格、承諾、資格、分配／兌獎狀態與五題答案以中文儲存。API、提交指紋、結果 JSON、技術識別碼，以及 Requests／Allocations／InventoryLog／Settings 的機器判斷值仍保留原始格式，避免影響重試與庫存處理。工作表名稱維持原名。

既有表格：同步本次 Setup.gs、Allocation.gs、Inventory.gs 後，重新開啟試算表，使用「Garmin Run 管理 → 將既有表單資訊轉為中文」，或在編輯器執行 `localizeActivitySheets()`。先於試算表副本確認；此函式會轉換同一試算表內正式與 Demo 的已知表頭及參與者顯示欄位，可重跑，不變更庫存、設定值、識別碼或技術紀錄。舊版與中文表頭均可通過 schema 檢查；若缺少匿名版本欄位，仍須先執行原有 migration。請勿為了中文化執行初始化。

本次未連線修改遠端試算表或部署 Apps Script。更新 Web App 版本後，新提交才會使用新版寫入方式。若有外部報表直接依英文表頭或參與者英文值取資料，需同步調整。

# Apps Script｜匿名提交、Sheets Migration 與部署手冊

此手冊對應目前 Repository 中的匿名 submissionVersion 1。Repository 的 .gs 修改不會自動更新任何已部署 Web App。本次沒有連線、寫入或修改任何遠端 Spreadsheet，也未部署 Apps Script／GitHub Pages。

## 資料契約

前端只提交答案、分類、補水狀態和技術識別碼。紙本抽獎由活動現場獨立處理，網站不建立紙本名單。

Request 範例（所有識別碼皆為每輪隨機技術值，不是使用者追蹤 ID）：

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

Response 範例：

    {
      "ok": true,
      "demoMode": true,
      "participantId": "staging-random-id",
      "requestId": "random-request-id",
      "sessionId": "random-session-id",
      "allocationStatus": "allocated",
      "runnerType": "experience",
      "prize": {
        "prizeId": "cap",
        "nameZh": "Garmin 牛仔帽",
        "nameEn": "Garmin Cap",
        "imagePath": "./assets/prizes/Garmin漁夫帽.png"
      },
      "redemptionCode": "STG-REQUEST",
      "allocationMethod": "general_weighted",
      "sustainabilityRewardEligible": true
    }

獎品完全耗盡或分配停用時回傳 allocationStatus paused、prize null。前端只能在取得後端回應後顯示領獎頁。Response 不含姓名、Email或抽獎登記欄位。

Validation.gs 驗證五個答案 ID，重算 Q1/Q2/Q3/Q5 runnerType 和 Q2 平手，獨立重算 Q4 hydrationStyle。它逐一核對 runnerType、q4Answer、existingSelfHydration、hydrationCommitment、sustainabilityRewardEligible、premiumPrizeEligible；包含任何姓名、Email、電話、地址、抽獎或告知欄位均拒絕。伺服器不相信前端 qualification。

## 需同步更新的 .gs

請在目標 Apps Script 專案更新以下全部檔案：

- Code.gs：API、部署環境讀取、公開狀態與提交恢復。
- Validation.gs：匿名契約、答案及資格驗證。
- Allocation.gs：同一提交指紋、requestId 冪等、分配及匿名 Participants 寫入。
- Setup.gs：新空白表頭及 append-only schema migration。
- Inventory.gs：保留庫存管理與一致性檢查；移除線上抽獎名單匯出入口。

其他與本任務無關的 Apps Script 檔案可保持不變。更新前比對各檔案是否有遠端獨有修改，不要以整份 Repository 盲目覆蓋遠端版本。

### 在 Apps Script 編輯器更新

1. 更新前備份現有 Apps Script 專案與綁定 Spreadsheet，確認其中 Demo 與 Production 工作表都存在。
2. 逐檔更新上述五份原始碼；若 GAS 編輯器將多個檔案合併在同一 .gs 檔，保留函式唯一定義並同步全部內容。
3. 本版不使用 `APP_ENVIRONMENT` Script Property。單一 Apps Script Web App 依請求參數路由：`mode=apps-script-demo` 使用 Demo 系列工作表；無 mode 或 `mode=production` 使用 Production 系列工作表。綁定的 Spreadsheet 必須同時有兩組工作表。
4. 確認 Web App 的 Execute as 設定與 Spreadsheet 權限符合組織政策。公開測驗若需匿名呼叫，Web App 存取權限可能設為 Anyone；這會增加濫用風險，需先採納下方防濫用措施。不要將 Spreadsheet 本身公開分享。
5. Deploy → Manage deployments，確認實際 /exec 指向更新後的部署版本與正確 Script 專案。建立新版本後記錄 deployment ID、版本、環境與綁定 Spreadsheet。
6. 以唯讀 GET 檢查 `action=getPublicCampaignStatus&mode=apps-script-demo`，預期 quizVersion=2、submissionVersion=1、demoMode=true；不帶 mode 再查一次，預期 demoMode=false。未知 mode 應回 `INVALID_API_MODE`。

舊部署可能仍要求姓名／Email／同意，也可能忽略匿名契約。新前端要求狀態回應包含 submissionVersion=1；舊 /exec 缺少此欄時，前端不得 POST。若錯誤地把新前端指向舊 /exec，它應因狀態版本不相容而停止；舊後端即使收到匿名 POST，也應因缺少舊個資欄位而拒絕，不應分配。需先在 Staging 確認，不可將此推論當成已部署驗證。

## Google Sheets 非破壞性 Migration

Migration 函式不執行 setupActivitySheets()，不建立表、不初始化或修改獎品、不刪除或重寫舊資料。既有表格不可為升級執行 setupActivitySheets()：該函式可能初始化空庫存。

原 Participants 18 欄及 V2 的第 19–21 欄保留。migrateStagingAnonymousSchema() 在 DemoParticipants 表尾追加：

    submissionVersion, q1Answer, q2Answer, q3Answer, q5Answer

q4Answer 已存在，不重複。由原始 18 欄直接遷移時會先追加原先缺少的 V2 三欄，再追加匿名五欄。Requests／DemoRequests 原 7 欄保留，尾端追加：

    submissionVersion, submissionFingerprint

Migration 只接受已知表頭前綴，未知表頭、欄位順序或空白資料表會停止。可安全重跑。舊列欄位不回填；新增匿名列在舊欄位 raffleOptIn、name、email、privacyNoticeVersion、privacyAcknowledgedAt 留 false／空白。不要刪除歷史個資欄或歷史紀錄；其存取與清除需依組織資料政策另行安排。

### Demo 工作表操作順序

1. 確認 Web App 綁定的 Spreadsheet 正確；先備份並記下正式與 Demo 系列的庫存及表頭。
2. 確認 DemoParticipants、DemoPrizes、DemoAllocations、DemoInventoryLog、DemoRequests 與正式系列工作表分開存在。
3. 在編輯器手動執行 migrateStagingAnonymousSchema()。它只處理 DemoParticipants 和 DemoRequests；不執行獎品初始化。
4. 核對表頭最終為 Participants 26 欄與 Requests 9 欄（Staging 對應 DemoParticipants／DemoRequests）。重跑一次，確認沒有新增重複欄位。
5. 比較舊欄、舊列、Prizes、DemoPrizes、Allocations 和 InventoryLog migration 前後內容。此函式不應改動任一獎品或紀錄。
6. 部署新 Web App 版本，先查帶 `mode=apps-script-demo` 的 status，再用 Demo 入口及經核准的虛構答案做端到端驗收。清理 Demo 測試資料需由維護者人工確認。

### Production Migration（需授權維護者操作）

1. 建立唯讀備份／複本，確認 Spreadsheet ID、Participants、Requests 表頭、舊紀錄及目前各獎品庫存。
2. 由資料負責人核准上線時段、資料保留、存取權限與回滾方式。
3. 使用同一份 Apps Script 程式碼及 Web App；無 mode 的 Production 請求只使用正式系列工作表。
4. 核對備份與欄位前綴後，才可由授權維護者手動執行 migrateProductionAnonymousSchema()。本函式只追加欄位，但仍會寫入正式表頭；本次沒有執行。
5. 確認 Participants 原欄與舊資料逐項相同、Requests 原 7 欄相同、獎品庫存與 Allocation／InventoryLog 未變，並重跑唯讀一致性檢查。

## 即時分配、冪等及失敗檢查

Allocation.gs 保留既有獎品數量、購物袋資格優先與耗盡 fallback、一般庫存加權、enabled 檢查、LockService、Allocations、InventoryLog、管理員庫存調整與 paused 結果。分配被停用或獎品全數用完時不會回報獎品。

Requests 新增的 submissionFingerprint 由五個答案 ID、runnerType、補水類型、承諾與資格組成。重試必須同時符合 requestId、sessionId 及指紋；完全相同時回放既有結果，不再扣庫存。相同 requestId 搭配不同資料回 REQUEST_ID_CONFLICT。

Sheets 沒有跨工作表交易。若程式在 stock 更新後發生部分寫入失敗，Request 可能停留 processing。Inventory.gs 的 verifyInventoryConsistency() 會檢查 processing request、Prizes 初始／剩餘／已分配數及 Allocations 數量。發現異常時暫停公開分配，依 requestId 對照 Requests、Participants、Allocations 和 InventoryLog；先備份，再由授權維護者人工復原／對帳。不要用新 requestId 重送，也不要直接修改庫存以掩蓋差異。正式前應另做故障注入與恢復演練。

## 環境隔離與公開匿名 API 風險

- Development：localhost/Codespaces 一般入口使用本機 Mock，僅本機 localStorage，不送 Apps Script。
- Demo：任何入口加上 `?mode=apps-script-demo`，前端會對共用 `/exec` 傳遞相同 mode；後端必須回報 `demoMode=true` 才會繼續提交。
- Production：一般入口不帶 mode，使用同一 `/exec` 並路由到正式系列工作表；正式分配仍受 Settings 的 allocationEnabled 控制。
- `mode=mock` 不會在公開網域啟用 Mock。本機與 Codespaces 不帶參數仍使用 localStorage Mock。

公開匿名 API 無法從 requestId 證明不同自然人，也不能可靠依 Apps Script Web App 取得使用者 IP。LockService 與冪等只避免併發超賣及相同請求重扣，不能防止攻擊者大量建立新 requestId 消耗獎品。正式開放前需由安全／活動負責人核准伺服器驗證 CAPTCHA／可信反向代理節流或現場受控 kiosk／分發方式；不可將前端隱藏按鈕或 sessionId 當防護。allocationEnabled 是緊急暫停開關，維護者也可在活動開始前暫停公開分配。

建議以最小權限限縮 Spreadsheet 分享，只允許指定活動營運與資料管理者存取。建議保留原始答案至活動結束後 90 日供彙總，完成去除細項後刪除原始回答；分配與庫存稽核資料暫提保留 12 個月。以上是待資料負責人核准的提案，本程式沒有自動清除任務，不代表法遵判定。

## 前端設定

修改 js/environment.js 內共用的 Apps Script Web App URL：

1. 前端兩種模式共用同一個 `/exec`；Demo 請求自動附加 `mode=apps-script-demo`，一般入口不附加 mode。
2. Apps Script 依 `e.parameter.mode` 路由至 Demo 或 Production 工作表；mode 只選擇資料表，不是驗證身分或授權。
3. 不要以 query string、瀏覽器旗標或 localStorage 在正式網域啟用 Mock。
4. 不在前端加入 private key、管理員權限或 CAPTCHA secret。

目前 Staging 與 Production 前端設定使用同一個使用者提供的 `/exec`。前端會核對後端狀態；若 Demo 請求回報 `demoMode=false`，不會送出分配請求。

## Production 上線清單（僅人工執行）

1. 備份 Production Spreadsheet，記錄庫存與 schema。
2. 確認正式獎項數量／資格、存取權限和資料保留核准。
3. 將更新後的 Apps Script 檔案同步至綁定正式 Spreadsheet 的 Apps Script 專案。
4. 核准後執行 Production append-only migration；確認庫存及舊列不變。
5. 部署新 Web App 版本並記錄版本／權限；一般入口不帶 mode 即路由至 Production 工作表。
6. 更新前端 Production API URL；在部署前保持 Production API URL 空白或配置 allocationEnabled=false。
7. 先在 Staging 驗收全部五題、三種補水承諾、獎品 fallback、paused、request replay、失敗重試與不同環境隔離。
8. 正式驗收只用受控授權流程，不建立測試領獎或個資紀錄；確認庫存／Requests／InventoryLog。
9. 由發布負責人明確啟用公開提交與 GitHub Pages。
10. 保留上一版 Apps Script deployment、前端版本、表格備份及暫停分配回滾流程。

## 測試與本次狀態

Repository 測試以 Node VM、記憶體 Sheet 和 localStorage mock 運行，不需 Apps Script 登入。不得用真實參與者資料或 Production API。

本次只修改 Repository 原始碼與文件；未執行 migration、遠端 GET/POST、正式庫存操作、Apps Script deployment、GitHub Pages 發布、commit 或 push。正式 Staging Spreadsheet、部署 URL、Production URL、Web App 權限、資料保留核准仍待維護者確認。
