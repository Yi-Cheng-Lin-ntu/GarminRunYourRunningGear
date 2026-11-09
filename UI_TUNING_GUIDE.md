# Garmin Run｜UI 人工微調指南

主網站入口是 `index.html`，互動由 `js/appV2.js` 控制，樣式集中在 `style.css`，可見文案主要由 `content.csv` 管理。`cute/` 是獨立參考版本，不要用它的 CSS 調整主網站。

## A. CSS 微調

結果頁的集中參數區在 [style.css](./style.css) 的 `RESULT PAGE — QUICK TUNING`。手機預設值寫在 `#result`，桌機覆寫在 `@media (min-width: 720px)`，極窄手機覆寫在 `@media (max-width: 430px)`。

| 想調整的元素 | Selector | CSS variable | 改大／改小的效果與裝置 |
|---|---|---|---|
| 跑者名稱字級 | `.v2-result-heading h2` | `--result-title-size` | 改大／改小名稱；手機預設、桌機可另外設定 |
| Slogan 字級 | `.v2-slogan` | `--result-slogan-size` | 改大／改小 Slogan |
| 狗狗圖片高度／寬度 | `.runner-scene`、`.runner-image img` | `--result-dog-height`、`--result-dog-width` | 改變圖片區域；圖片仍保持比例，不會裁切 |
| 狗狗圖與標題距離 | `.runner-scene` | `--result-title-image-gap` | 改大會讓狗狗圖離標題更遠 |
| 狗狗圖與推薦區距離 | `.runner-scene` | `--result-image-recommendation-gap` | 改大會增加推薦區前的留白 |
| 四個標籤位置 | `.tag-1` 至 `.tag-4` | `--tag-1-x/y` 至 `--tag-4-x/y` | 用正負 `px` 移動標籤；不會覆蓋原本旋轉 |
| 標籤旋轉角度 | `.tag-1` 至 `.tag-4` | `--tag-1-rotation` 至 `--tag-4-rotation` | 調整各標籤角度；不影響位置偏移 |
| 標籤字級與內距 | `.runner-tag` | `--result-tag-font-size`、`--result-tag-padding` | 改大會使標籤文字或色塊更大 |
| 標籤上下錯位 | `.tag-2`、`.tag-3` | `--result-tag-stagger` | 改大增加兩個標籤的錯位幅度 |
| 空白標籤寬度 | `.runner-tag[aria-hidden="true"]` | `--result-blank-tag-width` | 改變空白裝飾色塊寬度 |
| 推薦區內距 | `.v2-recommendation` | `--recommendation-padding` | 改大會增加文字與卡片邊緣的距離 |
| 推薦標題／內文 | `.v2-recommendation h3`、`[data-recommendation-description]` | `--recommendation-heading-size`、`--recommendation-copy-size` | 調整推薦文案字級 |
| 補水圖片大小 | `.hydration-equipment-image` | `--hydration-image-size` | 改變每張裝備圖的顯示框；圖像使用 `contain` |
| 補水圖片間距／與文字距離 | `.hydration-equipment` | `--hydration-image-gap`、`--hydration-image-text-gap` | 改變圖片彼此及圖片與推薦文字的距離 |
| 永續選項間距／高度／字級 | `.hydration-choices`、`.hydration-choices .choice-card span` | `--hydration-choice-gap`、`--hydration-choice-height`、`--hydration-choice-font-size` | 兩個選項維持左右並排；手機與桌機可分開調整 |
| 「繼續領獎」按鈕前後距離 | `.screen-result .button-primary` | `--result-continue-margin-top`、`--result-continue-margin-bottom` | 改變按鈕上下留白 |

手機調整預設值；桌機調整 `@media (min-width: 720px)` 內的 `#result` 變數；寬度不超過 430px 的手機另有局部覆寫。若只想快速試值，可在 DevTools 選取 `#result`，暫時新增或修改對應的 `--變數名稱`。

狗狗圖與補水裝備圖各有獨立容器：`.runner-image` 與 `.hydration-equipment`。不要把裝備圖放進 `.runner-scene`，也不要修改狗狗圖的 `object-fit: contain`。

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
| 九種補水推薦標題 | `type=recommendation`；用 `parent_id`（跑者 ID）及 `hydration_style`（`precision`／`rest`／`pioneer`）定位；標題在 `zh`、`en` |
| 九種補水推薦內文 | 同一 row 的 `description_zh`、`description_en` |
| 永續邀請與選項 | `type=ui`：`v2.invitation`、`v2.invitationNote`、`v2.joined`、`v2.considering`、`v2.pioneerThanks` |
| 聯絡頁標題、告知及按鈕 | `type=ui`：`v2.contactTitle`、`v2.contactIntro`、`v2.privacy`、`v2.privacyConfirm`、`participation.submit` |
| 錯誤提示 | `type=ui`：`v2.chooseError`、`v2.nameError`、`v2.emailError`、`v2.privacyError`、`v2.demoEmailError`、`v2.submitError`、`v2.backendOld` |
| 一般流程按鈕 | `type=ui`：`navigation.back`、`navigation.next`、`quiz.seeResult`、`v2.continue`、`v2.retry` |

### 不在 CSV 的文字或資料

- HTML 的 `<title>`、meta description、按鈕與區塊結構、預設文案：`index.html`。正常載入後，帶有 `data-i18n` 的文字會由 CSV 的同 ID 覆蓋。
- 獎品暫停訊息由 Mock 或 Apps Script 回傳；獎品名稱及圖片路徑由 `js/apiClient.js` 的 Mock catalog 或 Apps Script 獎品資料提供。
- 領獎畫面的部分動態文字與圖片載入失敗備援在共用的 `js/redemptionView.js`。
- 補水裝備圖檔案、雙語替代文字與九組對應在 `js/hydrationEquipment.js`；這是推薦展示圖，不是現場獎品或庫存。
- 載入 CSV 失敗時的提示、題數格式及測試工具中的庫存按鈕文案在 `js/appV2.js`。
- `content.csv` 中的 V1 `ui` 文案不一定由 V2 使用；修改前先確認 ID 是否由 `index.html` 的 `data-i18n` 或 `js/appV2.js` 引用。

## C. Chrome DevTools 快速步驟

1. 按 **F12** 開啟 DevTools。
2. 在 **Elements** 點選想調整的文字、圖片或區塊。
3. 在右側 **Styles** 暫時修改 CSS，或在選取的 `#result` 上新增 CSS 變數。
4. 查看樣式右側顯示的檔名與行號，確認來源是 `style.css`。
5. 找到相同 selector／變數後，把滿意的數值寫回 `style.css`。
6. 重新整理頁面，確認修改已寫入檔案且沒有依賴 DevTools 的暫存樣式。

CSS 尺寸通常使用 `px`；例如 `--hydration-image-size: 100px;`。標籤位置可用正負值，例如 `--tag-1-x: 6px;`。只改 CSS 外觀，不要修改分類、資格或庫存邏輯。

## D. 補水裝備圖片對應

結果推薦以內部 `runnerType:hydrationStyle` 對應圖片，不比較中英文畫面文字：

| 推薦 ID | 圖片 |
|---|---|
| `experience:precision` | 水袋背心 |
| `experience:rest`、`lifestyle:rest`、`performance:precision`、`performance:rest` | 軟水杯 |
| `lifestyle:precision` | 軟水壺＋水袋背心 |
| 三種 `*:pioneer` | 不顯示裝備圖，保留原本肯定與邀請文案 |

圖片檔案尺寸：水袋背心 1199×1312、軟水壺 1024×1536、軟水杯 221×424。CSS 限制圖片顯示框、使用 `object-fit: contain`，雙圖在窄畫面可換行，不會更動狗狗圖片區。
