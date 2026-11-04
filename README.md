# Garmin Run Your Running Gear

Garmin Run 2026 的跑者風格與補水方式互動測驗 prototype。

這是使用 HTML、CSS 與 Vanilla JavaScript 建立的 static front end，可直接部署到 GitHub Pages，不需要後端服務。

## 開發狀態

- Landing、五題測驗、結果、參與、領獎與重新測驗流程
- 五題固定順序、全部必答、每題單選
- 每次測驗隨機排列各題選項；返回上一題時保留排列，重新測驗才重新排列
- 返回上一題後重新選擇會覆蓋舊答案
- 中英文 UI 與內容切換
- 三向度 rule-based classification 與集中式 tie-breaking
- 獨立的 sustainability boolean flag，不作為第四個分數向度
- 結果圖片與五項現場獎品圖片已提供 assets 路徑
- Mock Backend 與 Apps Script Demo 後端可切換
- 五項獎品圖片已放入 `assets/prizes`
- 購物袋優先與一般獎品加權分配已實作
- 獎品耗盡時仍記錄參與者並進入領獎頁，顯示送完獎品狀態

目前題目與結果文案已依 MVP 規格配置；分類仍是活動互動用途，不代表正式心理測量結果。

## 本機預覽

JavaScript 使用 ES modules，且測驗內容由瀏覽器 `fetch` 載入 CSV；請透過 local server 預覽，不要直接以 `file://` 開啟：

```bash
python3 -m http.server 8000
```

再開啟 <http://localhost:8000>。

## Mock Edition 手動驗收指南

目前網站使用瀏覽器 Mock Backend，正式 Google Sheets 尚未整合；畫面會明確顯示 `MOCK MODE`，且頁面中的 `DEMO MODE` 標記表示測試資料，不代表正式抽獎或獎品憑證。

### 開始測試

1. 在專案資料夾執行：

   ```bash
   python3 -m http.server 8000
   ```

2. 在瀏覽器開啟 <http://localhost:8000>。
3. 確認頁面頂部有 `MOCK MODE` 與 `測試工具`。
4. 點選 `測試工具` 可查看：
   - 五種獎品初始、已分配與剩餘數量
   - Mock Participants
   - Mock Allocations
   - Mock Inventory Log
   - 直接修改剩餘數量
   - 預設情境與清除工具

### 測試情境

#### A 級購物袋有庫存

1. 開啟測試工具。
2. 點 `購物袋有庫存`。
3. 完成測驗並進入自帶補水邀請畫面。
4. 若原本自帶補水，完成領獎後應取得 `Garmin 鏤空購物袋`。
5. 檢查購物袋剩餘數量應減 1。

#### A 級已耗盡

1. 點 `購物袋耗盡`。
2. 使用原本自帶補水的跑者完成領獎。
3. 應取得一般獎品池中的獎品，不得取得購物袋。
4. 檢查 Allocation 的 `allocationMethod` 應為 `premium_fallback`。

#### 一般獎品已耗盡

1. 點 `一般獎品耗盡`。
2. 完成一次領獎提交。
3. 應進入領獎頁並顯示「現場獎品已贈送完畢，謝謝您的參與～」。
4. 不應顯示虛構獎品名稱或圖片。
5. Participant／Request 應記錄 `allocationStatus=paused`；不得增加 Allocation、扣庫存或產生負庫存。

#### 一般獨立抽獎

1. 點 `重置初始庫存`。
2. 依跑者原本是否自帶補水完成測驗。
3. 原本未自帶且選擇加入永續行動時，不可取得購物袋。
4. 原本未自帶且選擇考慮時，不可取得購物袋。
5. 測試工具中的剩餘數量應與實際獲得獎品一致減 1。

#### 重複提交與重新測驗

1. 點 `重置初始庫存`。
2. 完成領獎流程一次。
3. 連續點兩次提交按鈕；第二次不應再次扣庫存。
4. 同一 Email 可在新的測驗中再次提交。
5. 點領獎頁的 `再測一次`；應回到五題測驗，前一次姓名、Email、答案與獎品不得保留。
6. 領獎後重新整理；預設應回到首頁，不應自動恢復領獎頁。

#### 修改庫存

1. 開啟測試工具。
2. 修改五個剩餘數量欄位。
3. 點 `套用庫存數量`。
4. 只接受 0 或正整數；負數、小數應顯示錯誤並維持未套用的庫存。

### 判斷失敗

請判定為失敗，如果發現：

- 頁面沒有 `MOCK MODE` 標記或看似正式收集個資
- joined / considering 結果取得購物袋
- 重新整理後自動開啟舊領獎頁
- 再測一次保留上一輪答案、Email 或獎品
- 同一 request 重試扣庫存超過一次
- 出現負庫存
- 库存耗盡後仍繼續分配
- Mock Allocation 或 Participant 不正確
- 減庫存後未出現在 Inventory Log

### 資料儲存位置

Mock 資料儲存在目前瀏覽器的 `localStorage`，使用以下測試鍵：

- `garminRunMockRequests`
- `garminRunMockStock`
- `garminRunMockParticipants`
- `garminRunMockAllocations`
- `garminRunMockInventoryLog`
- `garminRunDemoAllocation`
- `garminRunPendingRequest`

清除瀏覽器網站資料也會清除 Mock 測試資料。

- 網頁重新整理：Mock stock、Participant、Allocation、Inventory Log 會保留；首頁不會自動恢復領獎頁。
- 再測一次：只重置前端本次流程，不刪除 Mock 歷史紀錄。
- 重啟 `python3 -m http.server 8000`：不會清除瀏覽器資料，重新整理後仍可看到首頁及測試工具中的歷史紀錄。
- Mock `清除測試資料`：會清除 Mock requests、stock、participant、allocation、inventory log 與 recovery 資料。

### 自動化驗證結果

執行：

```bash
node --test tests/*.test.mjs
```

目前已自動驗證：

- existing / joined / considering 資格
- 購物袋優先與耗盡 fallback
- joined 不取得購物袋
- 一般獎品耗盡時安全停止
- 同一 requestId 不重複扣庫存或建立紀錄
- raffle 資料驗證
- 負數、小數庫存拒絕
- 30,000 次加權抽樣統計比例

仍須人工驗證：

- 375px、390px、430px、768px 與桌機版面
- 真實手機觸控與鍵盤操作
- 中英文切換後表格與按鈕文字
- 頁面重新整理確實回到首頁
- `再測一次` 清除姓名、Email、答案與獎品顯示
- 瀏覽器私密視窗及另一台裝置無恢復憑證
- 網路中斷與逾時訊息（正式後端整合前僅能部分模擬）

## 專案地圖與內容修改

[`PROJECT_MAP.md`](PROJECT_MAP.md) 是技術架構與維護指南，集中說明檔案職責、相依關係、修改入口與風險。測驗題目、選項、結果與相關 UI 文案都由 [`content.csv`](content.csv) 提供；要修改內容或分類欄位，請先看 Project Map 的「編輯題目與結果 CSV」及「分類行為與資料契約」。
