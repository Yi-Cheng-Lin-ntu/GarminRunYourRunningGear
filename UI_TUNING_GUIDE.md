# Garmin Run｜UI 微調指南

主站使用 `index.html`、單一 `style.css`、`content.csv` 與 Vanilla JS。此指南只列現行路徑；封存版位於 `_archive/`。

## 先改哪裡

- 一般介面文字：修改 `content.csv` 的 `type=ui`／`question`／`option`／`result`／`recommendation` 對應列與 `zh`／`en` 欄。不要改 ID、`parent_id`、分類或 hydration 欄位。
- 版面、顏色、字級：修改 `style.css`。主站唯一載入此 CSS。
- 結果內容映射：`js/appV2.js` 的 `buildResultViewModel()` 從 CSV 組合文字和結果卡資料；`js/hydrationEquipment.js` 只負責裝備圖映射。
- 結果圖片檔名：`js/appV2.js` 的 `RESULT_ILLUSTRATIONS` 與 CSV `image_src` 應保持一致。
- 題目 ID、分類、資格、API、分配規則不是文案；不要只為修改顯示而改這些資料。

## 結果頁常用 CSS

在 `style.css` 搜尋 `QUICK TUNING`。手機預設值在 `#result`，桌機覆寫在 `@media (min-width: 720px)`，窄螢幕另有 `@media (max-width: 430px)`。

| 目標 | Selector／變數 | 調整效果 |
|---|---|---|
| 跑者名稱、標題、字階 | `.v2-result-heading h2`、`:root --font-*` | 改字級；全站使用同一字階 token |
| 主圖區高寬比例 | `.runner-visual`、`--result-visual-ratio` | 改中央結果圖框比例；圖片保持 contain |
| 標題與圖片相對位置 | `--result-heading-height`、`--result-heading-frame-overlap`、`--result-heading-image-pull` | 微調結果身份框、圖像和標題的上下關係 |
| 標籤留白 | `.runner-tags`、`--result-tags-gap`、`--result-tag-padding` | 改標籤間距及色塊內距；tag 內容由 CSV 提供 |
| 結果卡區塊間距 | `.result-layout`、`--result-section-gap` | 調整主視覺與推薦區的垂直距離 |
| 補水圖片大小 | `.hydration-equipment-image`、`--hydration-image-size` | 調整推薦裝備顯示框，保持比例 |
| 補水圖片與文案距離 | `.hydration-recommendation-row`、`--hydration-content-gap` | 調整推薦圖片與文字分隔 |
| 永續選項間距／高度 | `.hydration-choices`、`--hydration-choice-gap`、`--hydration-choice-height` | 兩個選項維持左右等欄；調整 gap／觸控高度 |
| 結果 CTA 留白 | `.screen-result .button-primary`、`--result-continue-margin-*` | 調整繼續領獎按鈕前後間距 |

## 分享 PNG

網站與下載輸出複用 `<article class="result-share-card">` 的 DOM/CSS。輸出函式在 `js/shareCard.js`，尺寸固定為 1080×1920 PNG；不要再找 Canvas 字級或手工座標設定。分享卡專用標頭／頁尾在 `index.html` 的 `.share-render-header`、`.share-render-footer`，尺寸及背景等參數在 `style.css` 的 `.share-render-*` 區塊。兌獎頁的下載縮圖由 `[data-share-preview]` 顯示。

## 兌獎頁快速參數

在 `style.css` 搜尋 `REDEMPTION RESULT PAGE — QUICK TUNING`。主要變數：

- `--redemption-prize-max-width`、`--redemption-prize-padding`：獎品區寬度和內距。
- `--redemption-title-width`、`--redemption-title-height`：上方標籤條尺寸。
- `--redemption-prize-image-height`：獎品圖顯示高度。
- `--redemption-action-gap`、`--redemption-extra-margin`：下載／IG 雙卡間距及區塊上下留白。
- `--redemption-action-radius`、`--redemption-action-shadow`：縮圖卡圓角和陰影。
- `--redemption-cta-height`、`--redemption-cta-radius`：綠色按鈕尺寸。
- `--share-card-aspect-ratio`、`--redemption-preview-aspect-ratio`：下載圖／預覽比例（現行 9:16）。
- `--share-card-padding-block`、`--share-copy-gap`：分享卡內部留白及縮圖文字間距。
- `--share-hover-lift`、`--share-active-scale`：卡片 hover／按壓回饋強度。

桌機在 `@media (min-width: 720px)` 有變數覆寫；調手機時修改基礎值，調桌機時修改 media query 覆寫。圖片容器務必保留 `min-width: 0`、`max-width: 100%` 與 `object-fit: contain`，避免內容撐寬。

## 用 DevTools 安全試值

1. 在本機／Codespaces 開啟頁面，以 F12 選取目標元素。
2. 在 Styles 面板調現有 CSS custom property，觀察手機寬度與桌機寬度。
3. 找到右側顯示的 `style.css` selector／行號，把最後值寫回同一個變數區。
4. 重新整理確認不是 DevTools 暫存覆寫才看起來正常。
5. 只調外觀時使用本機 Mock，不要透過 GitHub Pages 一般入口送出測試提交；一般入口走 Production。
