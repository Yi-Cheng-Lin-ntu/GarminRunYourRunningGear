# Garmin Run 2026｜主站設計規範

本文件記錄目前 `index.html`＋`style.css` 主站。Cute Running Club、V1 與早期視覺探索已封存，不是現行 UI 規格。結果頁參考稿已整理在 `_archive/design-history/2026-result-page/`；現行頁面以 repository 中的 HTML/CSS 為準。

## 定位與原則

Urban Athletic Minimalism：深色都市跑步視覺、清晰資訊層次、冰藍資訊提示、螢光綠重要操作。保留台北道路背景及運動識別，但圖形不可壓過題目、結果與獎品。以留白、字級和字重建立層次；一般 UI 文字使用直立字體。

優先順序：手機可讀與可點 → 結果／獎品清楚 → 一致元件 → 裝飾。共用測驗與分類程式不得因 UI 調整而改變。

## 品牌與語意色

目前實際色值定義於 `style.css :root`。勿只依舊版或 Cute 文件推斷目前值。

| Token | 現行值 | 用途 |
|---|---|---|
| `--brand-black` | `#080B0D` | 主背景與綠底文字 |
| `--brand-surface` | `#11171A` | 選項與深色區塊 |
| `--brand-white` | `#F7FAF8` | 深色背景主要文字 |
| `--brand-muted` | `#8E9BA0` | 次要資訊 |
| `--brand-blue` | `#7BCCFF` | 資訊提示、一般兌獎主題與次要操作 |
| `--brand-blue-mid` | `#A9DEF2` | 輔助藍色層次 |
| `--brand-green` | `#00FF19` | CTA、選取、永續資格主題 |

`--bg-*`、`--text-*`、`--action-*`、`--state-*`、`--theme-*`、`--border-*` 及 `--error-*` 是用途 token。維持深黑底；不新增主品牌色，也不以綠色表達錯誤。一般文字需清楚對比，互動狀態不可只靠顏色區分。

## 字體與版面

- 使用系統 Sans-serif fallback，不載入額外網路字型。
- 字階由 `--font-display`、`--font-h1`、`--font-h2`、`--font-h3`、`--font-body`、`--font-small` 控制；桌機在 `@media (min-width: 720px)` 調整。
- 一般內文使用較寬鬆行高；避免中文負字距、全站斜體或窄體字。
- 內容最大寬度由 `--content-width` 控制，主站採單欄；間距使用 4／8px 為基準。
- 一般卡片和按鈕沿用方正、低圓角比例；結果標籤及圖片不可遮蔽重要內容。

## 主要元件

- **主要按鈕**：螢光綠底、深色粗體字、清晰 focus；動態克制。
- **次要按鈕**：透明深色底、冰藍邊框及文字。
- **測驗選項**：深色表面、足夠觸控區；選取有框線／標記並支援鍵盤 focus。
- **永續選項**：桌機及一般手機雙欄，等寬等高，radio 選擇標記保留。
- **結果卡**：名稱、固定 slogan、四個 tag、圖片、補水推薦及 pioneer 特殊訊息；結果頁和 PNG 分享輸出複用同一份結果卡 DOM/CSS。
- **補水裝備**：獨立 `.hydration-equipment-image`，contain 顯示；pioneer 不顯示虛構裝備。
- **兌獎頁**：獎品名稱與圖片取自 allocation／CSV；paused 時隱藏獎品卡及 instruction，只顯示庫存結束訊息。
- **結果分享下載**：`js/shareCard.js` 使用本地 `html-to-image` 將共用 DOM 輸出 1080×1920 PNG。不要另維護 Canvas 文字／座標版本。

## 領獎主題與限定標籤

`sustainabilityRewardEligible` 決定綠色兌獎主題：原已自帶補水或在結果頁選擇加入者皆可使用綠色。`premiumPrizeEligible` 只來自 Q4 pioneer，購物袋優先分配也只依此資格。

「先鋒隊專屬」只在原始 Q4 選 pioneer 且成功取得購物袋優先獎時顯示；若 pioneer 因購物袋無庫存而取得一般獎品，標題為一般「恭喜你抽中！」但仍可維持綠色主題。一般庫存也耗盡時，所有跑者只看暫停訊息。

## 圖像與動態

台北 SVG 地圖透過 `body::before` 顯示，顏色為 `#85FDD3`、透明度由 `--map-opacity: .2` 控制。背景對比需低於正文。三種跑者圖、獎品圖與裝備圖需保留比例、以 contain 完整呈現。動態尊重 `prefers-reduced-motion`，避免循環閃爍或大幅位移。

## 維護規則

1. 新增主站畫面沿用 `style.css` 的 primitive／semantic tokens 與既有元件。
2. 可編輯文案優先放 `content.csv`；分類 ID、推薦組合 ID、資產路徑等機制資料留在程式。
3. 不要讓 Cute 或歷史 archive CSS 進入主站 cascade。
4. 修改分類、資格、API、個資或庫存需做 Level 3 對應驗證；一般排版調整按 `AGENTS.md` 快速迭代原則處理。
5. 避免在文件中把程式庫原始碼等同遠端 Apps Script 已部署；部署狀態需在 Google 端確認。

CSS 人工調整入口見 [UI_TUNING_GUIDE.md](UI_TUNING_GUIDE.md)。
