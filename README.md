# Garmin Run 2026 — 主網站 V2（本機驗收中）

HTML、CSS、Vanilla JavaScript ES Modules，GitHub Pages 靜態前端，Google Apps Script + Sheets 後端。此工作區尚未 push、merge 或部署 V2，也未操作遠端庫存。依最新指示維持原分支，以 [V2_CHECKPOINT.md](V2_CHECKPOINT.md) 記錄開發起點與三張原始 PNG 雜湊。

## V2 行為

- 固定五題、各三個選項，每輪打亂選項；返回保留答案與排列。
- **Q1、Q2、Q3、Q5** 各計一分；最高分決定類型，平手直接依 **Q2 答案的類型**。
- **Q4 獨立**：precision／rest 不具原本自帶資格；pioneer 才是 existing、享購物袋優先。
- experience＝志在參加臘腸；lifestyle＝我就是來看看柴犬；performance＝突破PB飆速杜賓。
- 結果頁：固定 Slogan、四個固定標籤（含空白色塊）、完整 PNG、九組 `runnerType × hydrationStyle` 推薦、永續邀請。
- precision／rest 必須選 joined／considering 才能進聯絡頁；pioneer 直接繼續，不再二次加入。
- **全員姓名、Email、告知確認必填；合法提交固定 `raffleOptIn=true`**。
- 個資告知未經 Garmin 核准；僅測試占位，不能視為正式政策或抽獎辦法。
- 現有 A 級優先／fallback、加權庫存、requestId 防重、paused、領獎版面與商品圖保留。
- 重新整理／重測回首頁；新測驗產生新 session／request。不以 Email 或瀏覽器紀錄阻止施測。

## Codespaces 預覽

在 repository 根目錄執行：

```bash
python3 -m http.server 8020 --bind 0.0.0.0
```

從 Codespaces **Ports → 8020 → Open in Browser** 開啟：

- `/`：V2 主網站，預設本機 Mock。
- `/?mode=apps-script-demo`：相同 UI，測試 Apps Script Demo；舊後端未宣告 `quizVersion=2` 時會阻擋提交。
- `/cute/`：保留的 V1 視覺參考；使用凍結 V1 CSV／規則。不作本次正式版本。

本次 8020 預覽使用同等功能的暫存 handler，額外支援 `/GarminRunYourRunningGear/` 專案前綴；不修改 Pages 設定。

**只填虛構資料。** Mock 存在該來源瀏覽器 localStorage；不會重設現有庫存或歷史。Demo 僅接受明確確認的測試資料，Email 限保留測試網域 example.com／example.org／example.net／.test／.invalid。正式資料蒐集未開啟。

## 內容與架構

- [PROJECT_MAP.md](PROJECT_MAP.md)：檔案、資料契約、V1 參考與相容性。
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)：V2 版面、七色、四個固定標籤與圖片規範。
- [UI_TUNING_GUIDE.md](UI_TUNING_GUIDE.md)：結果頁 CSS 微調、CSV 文案欄位與 Chrome DevTools 操作。
- [content.csv](content.csv)：唯一 V2 執行期文案；英文全部為暫譯、待核定。
- [V2_REVIEW.md](V2_REVIEW.md)：測試、截圖、限制與交接清單。
- [apps-script/README.md](apps-script/README.md)：**V2 後端手動更新、Demo migration 與重新部署步驟**。

`cute/` 原始檔案與 SVG 不修改；`archive/v1/` 保存其內容與歷史文件。`js/quizData.js`、`js/resultData.js` 是更早的歷史資料，不是主網站執行期來源。

## 測試

```bash
node --test tests/*.test.mjs
```

包含 243 組分類前後端對照、九組推薦及原文、四標籤、資格、全員聯絡與確認、Production 草稿拒絕、Demo 測試資料限制、記憶體 Sheets migration／分配／防重、既有 Mock 庫存測試。

選用 Playwright 本機瀏覽器驗收（不新增網站 runtime 套件）：

```bash
npm install --prefix /tmp/garmin-v2/tools playwright
UI_SERVE=1 UI_BASE_URL=http://127.0.0.1:8021 \
PLAYWRIGHT_MODULE=/tmp/garmin-v2/tools/node_modules/playwright \
CHROMIUM_PATH=/path/to/chrome \
node tests/v2UiRegression.cjs
```

`CHROMIUM_PATH` 可省略以使用 Playwright 已安裝的 Chromium。測試自行啟停本機 server，封鎖外部流量；Apps Script 使用 fixture，不寫遠端 Sheets。預設截圖輸出 `/tmp/garmin-v2-results`；本輪證據在 `docs/v2-review/`。

先前 `uiRegression.cjs`、`cuteUiRegression.cjs` 為 V1 歷史腳本，不應再對 V2 主入口執行。延至正式上線前的高並發、故障注入及 processing 中斷恢復測試未在本輪執行。
