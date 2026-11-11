# Cute Running Club — UI Prototype Review

> 封存歷史驗收紀錄，不代表目前主網站。現行主站 runnerType／名稱／圖片為：`experience`＝賽事收藏家（`assets/result/賽事收藏家.png`）、`lifestyle`＝自在巡航員（`assets/result/自在巡航員.png`）、`performance`＝配速計算機（`assets/result/配速計算機.png`）。本文的柴犬、臘腸、杜賓名稱與截圖只屬於當時 Cute 原型。

日期：2026-11-05。開發起點 `c693ed9`／`checkpoint/pre-cute-20261105`。保留原版、使用共享業務模組；未 push、未改公開部署、未連線寫入 Apps Script 或 Google Sheets。

## 架構與變更

新增 `cute/index.html`、`cute/cute.css`、`cute/preview.js` 與 `cute/assets/`，作為同一網站的 `/cute/` 入口。既有 `index.html`、`style.css`、`content.csv`、API client、分類與資格、Apps Script 均未修改。

新增 `js/uiVariant.js` 集中顯示設定；共用 `app.js` 僅增加設定選擇、結果顯示覆層、圖片資產解析及 Cute 結果圖片 alt。提交仍送原始 runnerType，沒有犬種、variant 或新資格欄位。

`tests/uiRegression.cjs` 僅補可設定本機 URL，並將舊版冰藍硬編碼預期改成開發起點實際已有的 #7BCCFF，避免把既有變更誤判為本次回歸。Cute 的七色在自己 scope 明確固定為本次要求，Ice Blue 為 #D6F2FF。原版現有地圖色與透明度亦原樣保留。

## 設計審查

- 首頁以三隻狗狗在曲線路線上跑步為焦點，降低科技地圖、巨字與速度環；不提前展示完整結果名稱。
- 冰藍頁底、白色內容、深色字，14–18px 卡片圓角與膠囊 CTA；可愛感來自角色、留白與形狀。
- 測驗五題、原選項文字與圖示選取規則不變；題號縮至20px，選項仍有大觸控區與非顏色選取記號。
- 三張角色為獨立、同尺寸、同風格 SVG 概念稿；結果完整呈現，首頁縮放共用相同資產。
- 一般冰藍／永續綠領獎主題保留，產品圖完整顯示；概念狗狗不遮擋產品。
- 所有畫面清楚區分 UI Prototype 與 Mock／Apps Script Demo；頁尾註明共用測試資料及庫存。

## 截圖入口

截圖僅含 Mock 資料，不含姓名、Email。

| 畫面 | 390px 手機 | 1280px 桌機 |
|---|---|---|
| 首頁 | [手機](docs/cute-review/cute-390-landing.png) | [桌機](docs/cute-review/cute-1280-landing.png) |
| 題目與選取 | [手機](docs/cute-review/cute-390-quiz.png) | [桌機](docs/cute-review/cute-1280-quiz.png) |
| 柴犬結果 | [手機](docs/cute-review/cute-390-result-experience.png) | [桌機](docs/cute-review/cute-1280-result-experience.png) |
| 臘腸結果 | [手機](docs/cute-review/cute-390-result-lifestyle.png) | [桌機](docs/cute-review/cute-1280-result-lifestyle.png) |
| 杜賓結果 | [手機](docs/cute-review/cute-390-result-performance.png) | [桌機](docs/cute-review/cute-1280-result-performance.png) |
| Participation | [手機](docs/cute-review/cute-390-participation.png) | [桌機](docs/cute-review/cute-1280-participation.png) |
| 一般領獎 | [手機](docs/cute-review/cute-390-general.png) | [桌機](docs/cute-review/cute-1280-general.png) |
| 永續領獎 | [手機](docs/cute-review/cute-390-green.png) | [桌機](docs/cute-review/cute-1280-green.png) |

375px、430px 同畫面也保存在該目錄。原版歷史截圖見 [UI_REVIEW.md](UI_REVIEW.md)；本輪另以 checkpoint app 與新 app 做原版同場景像素比較。

## 驗收結果

- 三個 Node 測試檔通過；`git diff --check` 通過。
- 雙版本 matrix 13 組通過（含原版 checkpoint baseline、兩版四寬度、兩版專案子路徑 Mock／Demo fixture）。
- 原版390px首頁／結果／一般領獎 PNG 與 checkpoint app 像素一致。
- 既有原版完整 UI 回歸375／390／430／768／1280px通過。
- 本輪沒有修改原版HTML／CSS／CSV／分類／API／Apps Script；Cute名稱移除「你是｜」前綴以免手機出現單字孤行，原版前綴保留。

## 測試內容

測試指令：

```bash
node --test tests/*.test.mjs
```

涵蓋 Mock 資格、分配、requestId、防負庫存、加權抽樣，以及 variant 映射不改動原始描述、未知 variant 回退、資產解析與 Cute 七色固定。

瀏覽器測試：

```bash
npm install --prefix /tmp/garmin-cute playwright
```

啟動 repository 本機 server 後，在另一終端執行：

```bash
PLAYWRIGHT_MODULE=/tmp/garmin-cute/node_modules/playwright \
CHROMIUM_PATH=/path/to/chrome \
UI_BASE_URL=http://127.0.0.1:8012 \
UI_OUTPUT_DIR=/tmp/garmin-cute-results \
node tests/cuteUiRegression.cjs
```

`CHROMIUM_PATH` 可省略以使用 Playwright 已安裝的預設瀏覽器。測試專案前綴時，server 必須將 `/GarminRunYourRunningGear/` 對應 repository 根目錄。在 repository 根目錄可用以下本機 server 重現（不更動 Pages 設定）：

```bash
python3 - <<'PYTHON'
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        prefix = '/GarminRunYourRunningGear'
        if path == prefix or path.startswith(prefix + '/'):
            path = path[len(prefix):] or '/'
        return super().translate_path(path)

ThreadingHTTPServer(('127.0.0.1', 8012), Handler).serve_forever()
PYTHON
```

可選 `URBAN_BASELINE_APP=/path/to/checkpoint-app.js` 加入原版390px首頁／結果／領獎的像素比對。

瀏覽器驗收場景：

- 原／新版375、390、430、1280px，三種 runnerType 完整五題與正確顯示名稱。
- Cute 英文候選名、原版名稱、結果與領獎頁語言切換。
- 行動 joined／considering 切換、選填抽獎展開／取消、未選抽獎仍可提交。
- Mock 一般領獎、joined綠色領獎與貼紙／飄帶、existing購物袋。
- 儲存的原始 IDs、資格及抽獎 opt-out 不因狗狗角色改變。
- 重新測驗、品牌回首頁、重新整理回首頁。
- 原／新版專案子路徑下CSV、module、CSS、插圖與獎品圖片解析。
- 原／新版專案子路徑 Apps Script Demo fixture：POST仍使用原API URL、payload、原始ID、demoMode=true，UI無開發工具。
- 無頁面水平捲動、console error、pageerror、資產404或失敗請求。

外部流量全部封鎖；Demo POST 由本機測試 fixture 攔截回應，沒有實際寫入或扣遠端庫存。這驗證路徑與前端契約，不代表已驗收目前遠端部署版本、權限或 CORS。

機器結果：[雙版本 matrix](docs/cute-review/results.json)、[原版完整 UI 回歸](docs/cute-review/urban-regression-results.json)。既有原版 UI 測試另覆蓋768px、鍵盤焦點、200%根字級、五款圖片及耗盡狀態。

## 剩餘確認

- 角色造型、正式插畫與英文名稱待確認；目前是 SVG 概念稿，並非正式定稿。
- 實機 Safari／Android、現場日照、螢幕閱讀器仍需人工確認。
- 原版設計文件與現行藍色／地圖設定有歷史落差，本輪保留原版實際外觀，未順帶改回舊樣式。
- 共用 HTML selector 更動時需雙入口驗收；Mock／Demo 資料並非每個 UI 各自隔離。
- 未修正或宣稱已解決既有後端 processing 中斷恢復與正式隔離議題。
