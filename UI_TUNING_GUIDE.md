# Garmin Run｜UI 人工微調指南

主網站入口是 `index.html`，互動由 `js/appV2.js` 控制，樣式集中在 `style.css`。主站供跑者閱讀的中英文文案集中在 `content.csv`；依畫面 key 編輯 `type=ui` 的 `id` 與 `zh`／`en` 欄位。Cute 原型已封存於 `_archive/cute-prototype/`，不會由主網站載入。

## Color Design System

主站顏色分成兩層，集中在 `style.css` 的 `:root`。調整品牌色請改 Brand Palette；Semantic Colors 以用途引用品牌色，介面樣式使用語意 token。`--color-*` 別名已移除，改用下表對應 token。

| 類別 | 保留／使用中的 tokens | 原 `--color-*` 別名取代方式 |
|---|---|---|
| 品牌色盤（調色請改此處） | `--brand-black`、`--brand-surface`、`--brand-white`、`--brand-muted`、`--brand-blue`、`--brand-blue-mid`、`--brand-green` | — |
| 背景 | `--bg-primary`、`--bg-surface` | `--color-bg` → `--bg-primary`；`--color-bg-soft` → `--bg-surface` |
| 文字 | `--text-primary`、`--text-secondary`、`--text-highlight` | `--color-text` → `--text-primary`；`--color-muted` → `--text-secondary`；`--color-blue` → `--text-highlight` |
| 操作、狀態、主題 | `--action-primary`、`--action-primary-text`、`--action-secondary`、`--state-selected`、`--state-complete`、`--theme-general`、`--theme-sustainability` | `--color-accent` → `--action-primary` |
| 邊框與錯誤 | `--border-default`、`--border-strong`、`--error-border`、`--error-text`、`--error-bg` | `--color-line` → `--border-default` |
| 品牌輔色 | `--brand-blue-mid` | `--color-blue-mid` → `--brand-blue-mid` |

`js/shareCard.js` 透過 `getComputedStyle()` 讀取 `--brand-black`、`--brand-white`、`--brand-blue`、`--brand-green`；這些品牌 tokens 保留原名與色值。封存原型 CSS 不屬於主站重構範圍。

## Typography Design System

全站字體變數集中在 `style.css` 的 `:root` 區塊 `TYPOGRAPHY SYSTEM — QUICK TUNING`。以下是初始設計值；手機以 390px 為主要參考，桌面值從既有的 `@media (min-width: 720px)` 套用。

| Typography Level | CSS variable | Mobile 字級 | Desktop 字級 | 字重 | 使用的頁面與元素 | 主要 selector |
|---|---|---:|---:|---:|---|---|
| Display | `--font-display` | 32px | 40px | 900 | 首頁品牌、We Change、跑者名稱 | `.start-brand`、`.start-manifesto span:last-child`、`.v2-result-heading h2` |
| H1 | `--font-h1` | 28px | 32px | 800 | 首頁標題、個資頁與兌獎頁主標題 | `#start-title`、`.participation-header h2`、`.redemption-banner h2`、`.redemption-prize-title` |
| H2 | `--font-h2` | 22px | 24px | 800 | 測驗題目／題號、區塊標題、獎品名稱、永續標題 | `.question-intro h2`、`.question-number`、結果推薦標籤、`.prize-name` |
| H3 | `--font-h3` | 18px | 20px | 700 | 跑者 slogan、推薦標題、永續邀請、互動卡片標題 | `.v2-slogan`、`.v2-recommendation h3`、`.v2-invitation legend` |
| Body | `--font-body` | 16px | 16px | 400（按鈕／強調文字 700） | 一般說明、推薦內文、欄位與按鈕 | `body`、推薦說明、`.v2-contact-fields label`、`.button` |
| Small | `--font-small` | 13px | 13px | 400（強調標籤 700） | 題目副標、標籤、輔助／次要說明與工具狀態 | `.question-subtitle`、`.runner-tag`、`.privacy-copy`、`.mock-mode-badge` |

字重、行高與字距也有共用變數：`--weight-body`、`--weight-emphasis`、`--weight-heading`、`--weight-display`、`--line-height-heading`、`--line-height-body`、`--line-height-small`、`--letter-spacing-brand` 與 `--letter-spacing-ui`。選取頁面元素後，可在 DevTools 的 `:root` 規則調整字級 token，立即檢視全站對應層級；若只在某頁測試，可在該頁容器暫時覆寫同名變數。

Canvas 下載圖不繼承 CSS，字級集中在 `js/shareCard.js` 的 `SHARE_CARD_TYPE` 與 `SHARE_CARD_LINE_HEIGHT`；數值以 1080×1920 PNG 輸出尺寸為準。下載圖沿用結果頁的內容順序與區塊框架，頁首／頁尾文案使用 `brand.headerPrefix`、`brand.headerRun`、`v2.shareCardHeaderSuffix` 與 `v2.startFooter`，並以獨立像素尺寸繪製。

## A. CSS 微調

結果頁的集中參數區在 [style.css](./style.css) 的 `RESULT PAGE — QUICK TUNING`。手機預設值寫在 `#result`，桌機覆寫在 `@media (min-width: 720px)`，極窄手機覆寫在 `@media (max-width: 430px)`。

| 想調整的元素 | Selector | CSS variable | 改大／改小的效果與裝置 |
|---|---|---|---|
| 跑者名稱字級 | `.v2-result-heading h2` | `--font-display` | 改大／改小名稱；手機與桌面共用 Typography token |
| Slogan 字級 | `.v2-slogan` | `--font-h3` | 改大／改小 Slogan |
| 結果圖片顯示區比例 | `.runner-visual` | `--result-visual-ratio` | 調整圖片容器的寬高比例；實際寬度受結果頁內容寬度限制 |
| 結果頁主要區塊間距 | `.result-layout` | `--result-section-gap` | 調整主視覺區與推薦區的垂直距離 |
| 四個標籤間距 | `.runner-tags` | `--result-tags-gap` | 調整 flex 群組中標籤彼此的間距；目前沒有單顆標籤的 X／Y offset 變數 |
| 標籤旋轉角度 | `.tag-1` 至 `.tag-4` | `--tag-1-rotation` 至 `--tag-4-rotation` | 調整各標籤角度；不影響位置偏移 |
| 標籤字級與內距 | `.runner-tag` | `--font-small`、`--result-tag-padding` | 改大會使標籤文字或色塊更大 |
| 標籤上下錯位 | `.tag-2`、`.tag-3` | `--result-tag-stagger` | 改大增加兩個標籤的錯位幅度 |
| 空白標籤寬度 | `.runner-tag[aria-hidden="true"]` | `--result-blank-tag-width` | 改變空白裝飾色塊寬度 |
| 推薦區內距 | `.v2-recommendation` | `--recommendation-padding` | 改大會增加文字與卡片邊緣的距離 |
| 推薦標題／內文 | `.v2-recommendation h3`、`[data-recommendation-description]` | `--font-h3`、`--font-body` | 調整推薦文案字級 |
| 補水圖片大小 | `.hydration-equipment-image` | `--hydration-image-size` | 改變每張裝備圖的顯示框；圖像使用 `contain` |
| 補水圖片間距／與文字距離 | `.hydration-equipment` | `--hydration-image-gap`、`--hydration-image-text-gap` | 改變圖片彼此及圖片與推薦文字的距離 |
| 永續選項間距／高度／字級 | `.hydration-choices`、`.hydration-choices .choice-card span` | `--hydration-choice-gap`、`--hydration-choice-height`、`--font-body` | 兩個選項維持左右並排；字級共用 Body token |
| 「繼續領獎」按鈕前後距離 | `.screen-result .button-primary` | `--result-continue-margin-top`、`--result-continue-margin-bottom` | 改變按鈕上下留白 |

手機調整預設值；桌機調整 `@media (min-width: 720px)` 內的 `#result` 變數；寬度不超過 430px 的手機另有局部覆寫。若只想快速試值，可在 DevTools 選取 `#result`，暫時新增或修改對應的 `--變數名稱`。

三張結果圖片分別由 `content.csv` 的 `image_src` 與 `js/appV2.js` 的 `RESULT_ILLUSTRATIONS` 對應；檔案是 `assets/result/賽事收藏家.png`、`assets/result/自在巡航員.png`、`assets/result/配速計算機.png`。結果圖容器是 `.runner-visual`，圖片 selector 是 `.runner-visual-image`；補水裝備圖使用獨立的 `.hydration-equipment` 容器。圖片使用 `object-fit: contain`。

## B. 文案修改

`content.csv` 是 V2 題目、結果、推薦及大部分畫面文案的執行期來源。只改文字欄位，不要更動 ID 或分類欄位。

| 內容 | CSV 欄位與定位方式 |
|---|---|
| 首頁標題／說明／按鈕 | `type=ui`，`id=v2.startTitle`、`v2.startDescription`、`v2.startButton` |
| Q1～Q5 副標 | `type=question_subtitle`，`parent_id=q1`～`q5`；文字在 `zh`、`en`。中英文都留空時不顯示副標 |
| Q1～Q5 主題目 | `type=question`，`id=q1`～`q5`；文字在 `zh`、`en` |
| 每題三個選項 | `type=option`，`parent_id=q1`～`q5`；文字在 `zh`、`en`。例如 `id=q1_experience` |
| 三種跑者名稱 | `type=result`，`id=experience`、`lifestyle`、`performance`；名稱在 `zh`、`en` |
| 三種 Slogan | 同一個 `result` row 的 `slogan_zh`、`slogan_en` |
| 四個固定標籤 | 同一個 `result` row 的 `tag1_zh/en`～`tag4_zh/en`；空白欄位請保持空白 |
| 領獎頁跑者名稱、標題與領取說明 | `type=ui`：`v2.redemptionRunnerPrefix`、`v2.redemptionTitle`、`v2.redemptionInstruction`；獎品名稱用 `prize.<prizeId>` |
| 九種補水推薦標題 | `type=recommendation`；用 `parent_id`（跑者 ID）及 `hydration_style`（`precision`／`rest`／`pioneer`）定位；標題在 `zh`、`en` |
| 九種補水推薦內文 | 同一 row 的 `description_zh`、`description_en` |
| 永續邀請與選項 | `type=ui`：`v2.invitation`、`v2.invitationNote`、`v2.joined`、`v2.considering`、`v2.pioneerThanks` |
| 聯絡頁標題、告知及按鈕 | `type=ui`：`v2.contactTitle`、`v2.privacy`、`v2.privacyConfirm`、`v2.submit` |
| 錯誤提示 | `type=ui`：`v2.chooseError`、`v2.nameError`、`v2.emailError`、`v2.privacyError`、`v2.demoEmailError`、`v2.submitError`、`v2.backendOld` |
| 一般流程按鈕 | `type=ui`：`navigation.back`、`navigation.next`、`quiz.seeResult`、`v2.continue`、`v2.retry` |
| 主站其他固定文案與無障礙標籤 | `type=ui`：`meta.*`、`brand.*`、`footer.*`、`language.*`、`quiz.*`、`v2.mock*`、`v2.redemption*` |
| 獎品名稱與裝備圖片替代文字 | `type=ui`：`prize.<prizeId>`、`equipment.*` |

### 不在 CSV 的文字或資料

- HTML 結構、互動屬性與 CSV key 在 `index.html`；一般文字與無障礙標籤由 `js/appV2.js` 依 key 從 CSV 填入。
- 題號、庫存數字、選項字母及內部錯誤代碼由程式產生，屬於狀態或機制資料，不是可編輯文案。
- CSV 本身無法載入時的緊急錯誤備援留在 `js/appV2.js`，因為此時無法再讀取 CSV。
- 圖檔路徑與九組補水裝備對應仍是程式設定；補水裝備替代文字則由 `content.csv` 的 `equipment.*` 提供。
- `js/apiClient.js` 保留 API／Mock 相容用的獎品名稱欄位；主站領獎頁和 Mock 工具顯示名稱以 `content.csv` 的 `prize.*` 為準。
- Cute 封存版的歷史文案位於 `_archive/cute-prototype/` 與 `archive/v1/content.csv`，不影響主站目前顯示名稱。

## C. Chrome DevTools 快速步驟

1. 按 **F12** 開啟 DevTools。
2. 在 **Elements** 點選想調整的文字、圖片或區塊。
3. 在右側 **Styles** 暫時修改 CSS，或在選取的 `#result` 上新增 CSS 變數。
4. 查看樣式右側顯示的檔名與行號，確認來源是 `style.css`。
5. 找到相同 selector／變數後，把滿意的數值寫回 `style.css`。
6. 重新整理頁面，確認修改已寫入檔案且沒有依賴 DevTools 的暫存樣式。

CSS 尺寸通常使用 `px`；例如 `--hydration-image-size: 100px;`。目前沒有每個標籤獨立的 X／Y offset 變數；如需調整標籤排列，請在 DevTools 檢查 `.runner-tags` 與 `.runner-tag` 的實際 flex 樣式。只改 CSS 外觀，不要修改分類、資格或庫存邏輯。

## D. 補水裝備圖片對應

結果推薦以內部 `runnerType:hydrationStyle` 對應圖片，不比較中英文畫面文字：

| 推薦 ID | 圖片 |
|---|---|
| `experience:precision` | 水袋背心 |
| `experience:rest`、`lifestyle:rest`、`performance:precision`、`performance:rest` | 軟水杯 |
| `lifestyle:precision` | 軟水壺＋水袋背心 |
| 三種 `*:pioneer` | 不顯示裝備圖，保留原本肯定與邀請文案 |

圖片檔案尺寸：水袋背心 1199×1312、軟水壺 1024×1536、軟水杯 221×424。CSS 限制圖片顯示框、使用 `object-fit: contain`，雙圖在窄畫面可換行，不會更動跑者結果圖片區。
