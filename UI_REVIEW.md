# Visual refinement v1.0 — Audit 與驗收

日期：2026-11-04。使用 repository 當下檔案作基準；保留既有 paused 領獎行為。未連接 Apps Script／Google Sheets，未部署，未改動正式庫存。

## Audit 與前後差異

| 項目 | Before | After |
|---|---|---|
| 字體 | Arial Narrow / Impact 混用；Hero、題號、選項字母、結果字、推薦、表單標題、獎品標題皆有 italic | 統一系統 Sans-serif；上述全改直立，取消 scaleX 與文字強負字距 |
| 階層 | 80–128px 題號與裝飾爭奪主焦點 | 題號 32–44px、問題 26–36px、結果 32–48px；留白與字重建立順序 |
| 首頁 | 280–390px RUN 圖形、巨大圓環、斜切 CTA | 168–220px 圖形、小圓環；主標與低圓角 CTA 優先 |
| 元件 | 按鈕斜切、推薦斜切、不同外框、checkbox 受通用 input 規則影響 | 按鈕／輸入 4px、卡片 6px；統一高度、邊界、焦點與選取記號 |
| 配色 | 綠色標籤、裝備、工具及推薦處處出現 | 綠色集中 CTA、選取、進度與永續；資訊／工具為冰藍或次要灰 |
| 領獎 | 一般頁深底、僅圖片冰藍；永續頁全綠 | 一般冰藍、永續綠，皆深字、相同產品卡；兩主題無獎品等級含義 |
| 地圖 | invert / brightness 強濾鏡與路網對比偏高 | SVG 不改；相同尺寸與位置，以 alpha mask 套淡冰藍，opacity .07 |
| 裝飾 | 桌機視覺突破主欄、速度線加 skew | 保持 620px 對齊線、降低速度線對比，取消 skew；保留少量細斜線與圓環 |
| Mock | 手機隱藏模式標記，工具有鮮綠主操作 | 所有寬度可辨模式，工具使用次要色並在表格內捲動 |
| UI 重繪 | 領獎頁語言不更新、答案重繪可能失去鍵盤焦點 | 僅暫存顯示結果供語言重繪；選取後恢復原 radio 焦點 |

## 代表性截圖

截圖涵蓋 390px 手機與 1280px 桌機。Before 以修改前保存的 CSS 搭配相同 Mock 流程呈現；HTML 結構與內容維持一致，屬樣式前後比較。測試固定亂數以便對比同款獎品。截圖皆無姓名與 Email。

| 畫面 | 手機 Before / After | 桌機 Before / After |
|---|---|---|
| 首頁 | [Before](docs/visual-review/before-390-landing.png) / [After](docs/visual-review/after-390-landing.png) | [Before](docs/visual-review/before-1280-landing.png) / [After](docs/visual-review/after-1280-landing.png) |
| 結果 | [Before](docs/visual-review/before-390-result.png) / [After](docs/visual-review/after-390-result.png) | [Before](docs/visual-review/before-1280-result.png) / [After](docs/visual-review/after-1280-result.png) |
| 一般領獎 | [Before](docs/visual-review/before-390-general.png) / [After](docs/visual-review/after-390-general.png) | [Before](docs/visual-review/before-1280-general.png) / [After](docs/visual-review/after-1280-general.png) |
| 永續領獎 | [Before](docs/visual-review/before-390-green.png) / [After](docs/visual-review/after-390-green.png) | [Before](docs/visual-review/before-1280-green.png) / [After](docs/visual-review/after-1280-green.png) |

## 驗證範圍

既有本機測試：`node --test tests/*.test.mjs`，兩檔通過。`git diff --check` 無空白錯誤。

瀏覽器測試使用 Chromium、844px viewport 高度與 reduced-motion；所有外部請求封鎖，只允許本機 127.0.0.1。每個寬度皆測：

- 375、390、430、768、1280px：首頁、五題、結果、Participation、展開抽獎欄位、一般／joined／existing 領獎。
- 三種跑者預期結果、joined／considering 反覆切換。
- 自願抽獎欄位展開，取消後清空姓名；不參加仍可領獎。
- existing 取得購物袋；joined 為綠色主題、顯示貼紙／飄帶；一般頁為冰藍。
- 重測回首頁、重新整理回首頁；中英文題目／表單／結果／動態領獎內容。
- 200% 根字級的表單版面無水平捲動。
- 原生 radio 鍵盤 Space 選取後保留焦點與 focus-visible 卡片提示。
- Mock 工具開關與頁面無水平捲動、無 pageerror。
- 390px 另驗證五款圖片 decode 成功、all_empty 時顯示送完且隱藏產品圖。

機器結果見 [results.json](docs/visual-review/results.json)。這是指定場景的自動化驗證，不代表完整跨瀏覽器或無障礙認證。

## 對比計算

依 sRGB 相對亮度公式計算，未僅憑截圖判斷：

| 前景 / 背景 | 對比 |
|---|---:|
| Muted / Surface | 6.33:1 |
| White / Surface | 17.21:1 |
| Black / Ice Blue | 16.92:1 |
| Black / Green | 14.40:1 |
| Ice Blue / Surface | 15.50:1 |
| 50% White 操作邊界 / Surface | 5.07:1 |

22% 白僅用於非必要分隔；選項與文字輸入框使用較強操作邊界。錯誤文字使用粉紅，focus 在深色區使用冰藍、亮色領獎區使用深黑。產品圖屬影像，其實物對比不由文字比值判定。

## 重跑瀏覽器驗收

專案不新增 runtime 相依套件。可將 Playwright 安裝至暫存目錄，另啟動本機 server：

```bash
npm install --prefix /tmp/garmin-visual playwright
python3 -m http.server 8011 --bind 127.0.0.1
```

在另一終端執行（Chromium 路徑依環境調整）：

```bash
PLAYWRIGHT_MODULE=/tmp/garmin-visual/node_modules/playwright \
CHROMIUM_PATH=/path/to/chrome \
UI_OUTPUT_DIR=/tmp/garmin-ui-results \
node tests/uiRegression.cjs
```

有安裝 Playwright 預設瀏覽器時可省略 `CHROMIUM_PATH`。選用 `BASELINE_CSS=/path/to/original.css` 可重建樣式 Before 對照。預設輸出 /tmp，不覆蓋 repository 證據。

## 修改範圍與剩餘限制

- `style.css`：Token、字體、RWD、元件、主題、圖形與無障礙狀態。
- `index.html`：既有錯誤區補上 live region 屬性。
- `js/app.js`：只修正顯示結果的語言切換、Mock 工具重繪與 radio 焦點。
- 新增設計規範、此審查紀錄、截圖及可重跑 UI 測試；README／Project Map 補文件入口。
- 未修改 `content.csv`、分類、資格、Mock API、Apps Script、Sheets schema 或獎品演算法。

仍需實機 iOS Safari／Android Chrome、現場日照、螢幕閱讀器與瀏覽器 200% zoom 人工確認；本次的 200% 根字級測試不等同完整瀏覽器 zoom。跑者正式圖片仍未提供，保留既有占位圖。原有英文文案與中文的差異、部分英文結果空欄保持原樣，避免更動本次禁止的題目與答案。正式環境隔離與後端故障恢復屬另案，本次未連線驗證。
