# Cute Running Club — Alternate UI Prototype v0.1

## 定位與狀態

柔和、可愛、活潑、有一點幽默感的 Garmin Run 跑步社群測驗。關鍵字：Cute、Friendly、Soft、Playful、Cheerful、Minimal、Illustration-driven、Running Community。

此為獨立視覺 prototype，不取代 [Urban Athletic Minimalism](DESIGN_SYSTEM.md)。三隻角色目前為本專案製作的簡化 SVG **概念稿**，用於確認角色、配色與構圖，不代表已完成正式專業插畫或品牌核定。英文名稱亦為候選文案。既有測驗描述及建議未改寫。

## 雙版本架構

| 入口 | UI Variant | API Mode |
|---|---|---|
| `/` | Urban（預設） | Mock |
| `/cute/` | Cute | Mock |
| `/?mode=apps-script-demo` | Urban | Apps Script Demo |
| `/cute/?mode=apps-script-demo` | Cute | Apps Script Demo |

GitHub Pages 上皆加 `/GarminRunYourRunningGear` 專案前綴。沒有建立第二個 repo、fork 或 deployment，也沒有修改發布設定。

- `cute/index.html`：獨立畫面骨架，保留共用 app 的 screen id、data selector 及表單契約。未複製任何核心 JavaScript 或 CSV。
- `cute/cute.css`：載入共用 `style.css` 後套用的新版視覺；所有 selector 限定 `html[data-ui-variant="cute"]`，不回寫原版 CSS。
- `cute/preview.js`：載入共享 app，讓「看看原版」連結保留既有 Demo query。
- `js/uiVariant.js`：集中 UI 名稱、首頁 copy、狗狗圖、專案資產解析；不讀 mode、不計分、不產生資格。
- `js/app.js`：依 HTML 的 variant 套顯示資料；原始 runnerType 仍供分類與提交。未知 variant 回到 Urban。
- `js/contentData.js`：仍以 module URL 載入同一份 CSV。
- `resolveProjectAsset()`：以 `import.meta.url` 找 repository 根目錄，讓原版與 cute 的獎品及結果圖均支援 Pages 子路徑；遠端回傳的 `./assets/...` 亦可正確顯示。

兩版於同來源共用 localStorage 的 Mock stock、participants、requests 與 recovery 資料，並非獨立庫存。切換 URL 不會清空 Mock 歷史。兩版 Apps Script Demo 也指向同一個既有 Demo Web App／庫存。頁尾明示此事；UI variant 不作為後端資格或新增資料欄位。

## 品牌色與 Semantic Tokens

Cute scope 明確固定下列七個 primitive token；可愛感來自比例與角色，不新增 UI 主色。實際原版 HEAD 的 `--brand-blue` 已是 #7BCCFF、地圖另有既有調整，與舊文件不同；本次保留原版實際外觀，只在 Cute scope 使用指定 #D6F2FF。

| Primitive | HEX | Cute 用途 |
|---|---|---|
| Brand Black | #080B0D | 主要文字、外框、focus |
| Brand Surface | #11171A | 次要文字、錯誤底色 |
| Brand White | #F7FAF8 | 主內容與表單欄位 |
| Brand Muted | #8E9BA0 | 保留品牌資產；不拿來當淺底小字 |
| Ice Blue | #D6F2FF | 網站背景、資訊／表單卡片、一般領獎 |
| Mid Blue | #A9DEF2 | 跑步路線與裝飾 |
| Electric Green | #00FF19 | 主要 CTA、選取記號、完成進度、永續領獎 |

Cute scope 覆寫 `--bg-primary`／`--bg-surface` 為 White，`--text-primary` 為 Black，`--text-secondary` 為 Surface。淺底改用深色文字，避免 muted 對比不足。必要邊框為 50% Black；一般分隔可用 18% Black。錯誤使用深色高對比卡與 `!`、保留 alert，不使用綠色表示錯誤。

角色限定毛色 #BA855C、#946443 僅存在狗狗 SVG，不延伸成背景、表單或按鈕顏色。

## Typography

使用 ui-rounded 與既有系統 Sans-serif fallback，中文字採系統高可讀字形；不下載外部字型、不使用斜體、skew、壓縮字體或強負字距。

| Role | 字級 | 字重／行高 |
|---|---|---|
| 首頁主標 | 36–56px | 700 / 1.25 |
| 狗狗結果名稱 | 30–42px | 700 / 1.4 |
| 題目及主要 H2 | 24–32px | 700 / 1.45 |
| 內文／選項 | 16px | 400–500 / 1.65–1.75 |
| Label | 14px | 600–700 |
| 說明／概念稿標記 | 12px | 400–500 |
| 題號 | 20px | 700 |

完整中文名稱可以自然換行，不用縮小字體強迫塞一行。英文名稱先按候選稿呈現，未視為已核定文案。

## Layout 與元件

維持原本 620px 單欄與手機優先。背景冰藍、內容白色、留白穩定；大型 screen 圓角 20–24px、卡片 14–18px、輸入框 12px。Spacing 沿用 4/8/16/24/32/48px。

- **按鈕**：膠囊形、至少 54px 高，主 CTA 綠底黑字；次 CTA 黑框深字。不做 hover 位移或放大。
- **選項**：至少 80px 觸控區；字母放在小圓點，選取後有黑框、淡藍底、綠色側線／字母底與勾號。除綠色外保留形狀提示。
- **進度**：五段圓頭進度，深色表示目前、綠色表示完成；不新增題目或額外動畫。
- **表單**：抽獎與補水選擇分為冰藍卡片；姓名／Email 白底、52px 高；checkbox 保持原生。所有必填規則及提交時機不變。
- **領獎**：一般冰藍、existing／joined 永續綠；同一套產品卡、contain 完整顯圖；不以狗狗分類決定資格，不讓插圖遮產品。paused 仍顯示送完訊息，不生成獎品。
- **開發工具**：白色工具面板、深色文字、清楚 Mock／Demo 模式標記；Demo 仍沿用共用 app 隱藏 Mock 工具的行為。
- **無障礙**：淺底深字；沿用 keyboard focus、radio 勾選記號、alert、觸控尺寸與 reduced-motion。三種狗狗圖有雙語 alt；首頁三隻是純裝飾，不提前揭露結果名稱。

## 三種角色與內部映射

| 內部 ID（不變） | Cute 中文 | 英文候選 | 角色與配件 |
|---|---|---|---|
| `performance` | 突破PB飆速杜賓 | PB Chasing Doberman | 積極衝刺、很認真又友善；跑錶、綠色鞋、少量速度線 |
| `experience` | 我就是來看看柴犬 | Just Here to Vibe Shiba | 圓臉、捲尾、好奇參賽；號碼布、輕快姿勢 |
| `lifestyle` | 志在參加臘腸 | Happy to Be Here Dachshund | 長身短腿、舒服地努力跑；綠色頭帶、小水壺 |

既有三種跑者分類、tie-break、sustainability、原始五題與選項完全保留。沒有大幅改寫個性描述；狗狗只取代顯示標題及圖像。

## 插圖系統與主視覺

三張 320×280 viewBox、透明背景、圓線端、主要 4px 輪廓，扁平色塊、簡化臉部；不使用漸層、光影、寫實／3D、網路素材或不同來源混合。

- `cute/assets/doberman-concept.svg`
- `cute/assets/shiba-concept.svg`
- `cute/assets/dachshund-concept.svg`
- `cute/assets/club-route.svg`：獨立淡藍曲線裝飾，不承載資格資訊。

首頁三隻分布在上下兩層的彎曲路線上，保留呼吸空間；結果只顯示該犬種。原版地圖與 RUN 字不在 Cute 顯示，但原版資產及樣式保持原樣。概念稿與版面以獨立圖片接口分開，可各自迭代。

### 換成正式插畫

1. 待角色造型與正式素材權利確認後，把新檔放在 `cute/assets/`（建議獨立版本檔名）。
2. 保持一致 viewBox／留白；透明 PNG／WebP 亦可，解析度至少支援 2× 顯示；避免背景烘焙進圖片。
3. 更新 `js/uiVariant.js` 的對應 image.src 與雙語 alt；不修改 ID 或任何資格欄位。
4. 更新首頁三個 img 的 src、必要時微調 `.hero-*` 構圖；其餘畫面不需改核心 JS。
5. 正式核定後再移除／改寫「概念稿」標記，並更新本文件；目前不得宣稱素材已正式核定。

## 與原版差異與修改邊界

Urban：深色、方正低圓角、台北道路、運動字階、原跑者名稱。
Cute：冰藍／白色、柔和卡片與膠囊 CTA、三隻跑步狗狗、親切首頁語氣及新顯示名稱。

原版 `index.html`、`style.css`、`content.csv`、分類、API client、Apps Script 均不修改。HTML 屬獨立 UI 殼，未來若更動共用 selector，須一起檢查兩個入口；共用狀態與行為仍只維護一份。

開發起點：乾淨 HEAD `c693ed9`，本機分支 `checkpoint/pre-cute-20261105`。本次不切換／重設分支、不 push、不部署。

## 預覽與驗收

一般 Codespaces 預覽：

```bash
python3 -m http.server 8000
```

從 Ports 開啟 8000，原版 `/`、新版 `/cute/`；Demo query 可獨立加在任一入口後。本次預覽伺服器使用 8012，另支援 `/GarminRunYourRunningGear/` 前綴以測試 Pages 路徑。

- `node --test tests/*.test.mjs`：既有資格與 Mock 測試，以及新的顯示映射／資產 URL 測試。
- `tests/cuteUiRegression.cjs`：原／新版四尺寸、三種分類、雙語、領獎、重測、refresh、素材 404／console／pageerror 檢查；專案子路徑與 Demo fixture 提交。
- `tests/uiRegression.cjs`：既有原版完整回歸。
- [測試紀錄與截圖](CUTE_UI_REVIEW.md)。Demo fixture 是攔截回應，不代表遠端寫入驗收；測試封鎖外部流量，未扣 Demo 庫存。

仍需正式插畫、英文名稱確認與實機 Safari／Android 操作驗收。正式後端隔離及故障恢復是既有獨立議題，本次 UI prototype 不處理或宣稱已解決。
