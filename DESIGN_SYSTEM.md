# Garmin Run 2026 — Visual Identity & UI Design System v1.0

## 定位與核心原則

Urban Athletic Minimalism：現代、運動、極簡、精準、親切與永續。使用深色介面、穩定直立字體與克制的都市道路圖形。每個畫面以一個任務為焦點；裝飾退後，內容、選項及 CTA 優先。手機單欄，內容最大 620px。

本文件規範視覺，不變更五題、答案、分類、永續資格、抽獎、分配、重測及 API。一般／永續領獎主題代表行動響應，絕不代表獎品等級或 A 級資格。

## 品牌與語意 Token

`style.css` 的 `:root` 為唯一 Token 來源。保留 `--color-*` alias 相容既有樣式；新元件優先使用 semantic tokens。

| Primitive | 色彩 | 語意角色 |
|---|---|---|
| `--brand-black` | #080B0D | `--bg-primary`、主要 CTA 深色文字 |
| `--brand-surface` | #11171A | `--bg-surface`、卡片 |
| `--brand-white` | #F7FAF8 | `--text-primary` |
| `--brand-muted` | #8E9BA0 | `--text-secondary` |
| `--brand-blue` | #D6F2FF | `--text-highlight`、`--action-secondary`、`--theme-general` |
| `--brand-blue-mid` | #A9DEF2 | 圖形輔助 |
| `--brand-green` | #00FF19 | `--action-primary`、`--state-selected`、`--state-complete`、`--theme-sustainability` |

一般畫面深黑／Surface 占大部分，藍色負責資訊，綠色集中 CTA、完成與選取。勿以綠色作一般裝飾或錯誤提示。

邊界：`--border-default` 為 22% 白，作非必要分隔；`--border-strong` 為 50% 白，作可操作卡片及輸入框邊界。錯誤使用 `--error-border` #FFB3B3、`--error-text` #FFDEDE、`--error-bg` 淡紅底。

## 字體與 Typography

`--font-sans`：系統字體 → Helvetica Neue / Arial → Noto Sans TC / PingFang TC / Microsoft JhengHei → sans-serif。不下載外部字型。

| Role | Token / 字級 | 字重 / 行高 |
|---|---|---|
| Hero | `--type-display`，44–72px | 700–800 / 1.12 |
| Result H1 | `--type-h1`，32–48px | 700 / 1.25 |
| H2 / 題目 | `--type-h2`，26–36px | 700–800 / 1.25–1.3 |
| H3 / 獎品 | `--type-h3`，20–24px | 700 / 1.3 |
| Body | `--type-body`，16px | 400–500 / 1.65–1.75 |
| Label | `--type-label`，14px | 600–700 / 1.4 |
| Caption | `--type-caption`，13px | 500–700 / 1.45 |

標題、題號、選項、結果與按鈕使用 normal，不使用 italic、skew 或 scaleX 製造運動感。中文標題無負字距；英文短標籤可用 .06–.1em。裝飾 RUN 字只用少量 -.02em。長英文可換行，不裁切功能文字。

## 空間與外框

Spacing：xs 4、sm 8、md 16、lg 24、xl 32、2xl 48、3xl 64px。少量 12／20px 作中間值。手機 gutter 16px，一般 20px。所有頁面維持同一內容對齊線。

卡片 `--radius-card` 6px；按鈕／輸入框 `--radius-control` 4px。圓環及 radio 例外。以背景、細邊框與留白分層，不新增發光效果。一般元件不斜切。

## 元件

### Buttons

主要按鈕綠底深字、最小 52px 高、700 字重；hover 保留綠色並輕微降低亮度。次要按鈕透明底冰藍框／字。hover 位移最多 1px；focus 使用外側 2px outline。測試工具的主要操作改用冰藍，避免搶跑者 CTA。

### Forms

抽獎與行動邀請各自為 Surface 卡片。姓名／Email 48px 高、16px 字、深黑底、強邊界；checkbox 維持原生 20px 控制，不套文字欄位寬高。錯誤區使用粉紅邊與文字，保留 alert。抽獎仍選填，未加入抽獎者不必填聯絡資訊。

### Selection Cards

測驗與行動卡片共用方正低圓角、Surface／深色底、強邊界。選取以綠框、淡綠底與實體記號表達：測驗有勾號，行動邀請有實心 radio。鍵盤 focus 以卡片外框標示，使用 native checked state，避免語言重繪後視覺遺失。觸控區至少 44px。

### Result Cards

跑者名稱為主焦點；預留結果圖縮為 180px，不以巨字壓過名稱。推薦與裝備分層為深色卡片，冰藍標籤；永續推薦以綠色側線提示。圖片來源仍沿用 CSV，不新增或捏造跑者圖片。

### Product Cards

領獎以產品為中心：一致的淺色圖框、24px 留白、`object-fit: contain`，不裁切、不加產品濾鏡。名稱深色字。送完獎品仍保留既有 paused 畫面，隱藏圖片，不生成虛構產品。

## 各畫面主題

- Landing：主標與開始按鈕；縮小 RUN 裝飾與圓環，保留道路辨識。
- Quiz：進度 → 小型直立題號 → 題目 → 選項 → 下一題；題號不與題目競爭。
- Result：跑者名稱與圖、說明、推薦、領獎 CTA。
- Participation：完成確認、選填抽獎、行動邀請、最終提交；兩種選擇有各自卡片與留白。
- General redemption：冰藍背景、深色文字與邊界。
- Sustainability redemption：螢光綠背景、深色文字；existing 與 joined 共用，保留貼紙／飄帶提示。
- Mock：深灰工具、次要文字；所有寬度保留清楚模式標記。現有 Apps Script Demo 隱藏測試工具；未來 Production 也不得顯示。

## Graphic Motifs 與 Motion

保留原台北 SVG、道路粗細與各 breakpoint 的構圖／縮放。原圖部分道路偏灰，以原 SVG 的 alpha 作 CSS mask，統一使用 Ice Blue；移除 invert / brightness 濾鏡，低 opacity .07，不改 SVG 資產。僅作背景，不承載操作資訊。

保留少量圓環、細斜線；降低透明度，不對文字做變形。避免滿版裝飾突破桌機內容邊界。動畫以 160ms 狀態變化、260ms 畫面淡入為上限，尊重 `prefers-reduced-motion`。

## Accessibility 與後續頁面規範

一般文字目標 4.5:1、大字 3:1、必要邊界 3:1。Muted 只在深色背景上使用；亮色領獎頁使用 Midnight Black。分隔線不作為唯一操作邊界。選取狀態除顏色外必須有勾號或 radio。

輸入框、連結、按鈕與隱藏 radio 均須有 focus-visible。保持原生表單語意，不以 div 取代控制項。測試 375、390、430、768、1280px、中英文、放大文字、減少動畫及完整 Mock 流程。測試不可發送真實個資或操作遠端庫存。

新增頁面必須沿用 Token、字階、卡片、主／次 CTA 與單欄寬度；不得為單頁另創品牌色、全頁斜體或第四種資格主題。視覺修改不得順帶修改業務規則。驗收證據與前後差異見 `UI_REVIEW.md`。
