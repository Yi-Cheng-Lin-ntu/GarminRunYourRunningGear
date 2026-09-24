# Garmin Run Your Running Gear

Garmin Run 2026 的跑者風格與補水方式互動測驗 prototype。

這是一個不需要 backend 的 static website，使用 HTML、CSS 與 Vanilla JavaScript，可直接部署到 GitHub Pages。

## 開發狀態

目前已完成第一版 functional MVP：

- Landing、六題測驗、結果、重新測驗流程
- 六題固定順序、全部必答、每題單選
- 每次測驗會隨機排列各題選項，但題目順序固定
- 返回上一題時保留該次測驗的選項排列，重新測驗才會重新排列
- Q6 支援五個選項，由資料動態產生
- 返回上一題後重新選擇會覆蓋舊答案
- 中英文 UI 與內容切換
- 三向度 rule-based classification 與集中式 tie-breaking
- 獨立的 sustainability boolean flag，不作為第四個分數向度
- 結果圖片預留固定路徑欄位，尚未放入正式圖片

目前題目與結果文案已依 MVP 規格配置；分類仍是活動互動用途，不代表正式心理測量結果。

## Project Structure

```text
/
├── index.html
├── style.css
├── README.md
└── js/
		├── app.js
		├── quizData.js
		├── classificationEngine.js
		├── classificationRules.js
		└── resultData.js
```

### 資料與責任邊界

- `quizData.js`：Q1-Q6、選項、雙語文字、`traits`、`isMeme` 與 `sustainability`
- `classificationRules.js`：三向度 runner types 與 tie-break order
- `classificationEngine.js`：計算三向度分數、sustainability flag 與最終 result object
- `resultData.js`：三種 runner type、永續組合文案、補水建議、圖片路徑與 CTA 內容
- `app.js`：狀態、DOM rendering、答案儲存與頁面導覽
- `style.css`：mobile-first layout 與視覺樣式

UI 不會判斷某個答案屬於哪一種跑者類型。分類器在完成最後一題時，依照目前 `answers` 重新計算所有 trait，因此返回修改答案不會產生 double scoring。

## 修改題目或分類

一般分類選項使用三向度的 `traits` 陣列：

```js
{
	id: "q1_a",
	text: {
		zh: "選項文字",
		en: "Option text"
	},
	traits: ["experience"]
}
```

Meme 或 sustainability 選項不應增加三向度分數：

```js
traits: [],
isMeme: true
```

永續選項使用獨立 flag：

```js
traits: [],
sustainability: true
```

Q6 的所有選項都不影響 runnerType；只有 Q6 永續選項可以觸發 sustainability flag。

目前 tie-break 流程是：

1. 只計算 Q1-Q5 的 `experience`、`lifestyle`、`performance`
2. 最高分唯一時直接使用該 runner type
3. 平手時依 `classificationRules.js` 的順序：`experience` > `lifestyle` > `performance`
4. Q2、Q4、Q6 的 sustainability option 只設定 flag，不進入 scores

這些是 placeholder rules，尚未代表正式分類設計。

## 本機預覽

因為 JavaScript 使用 ES modules，請透過 local server 預覽：

```bash
python3 -m http.server 8000
```

再開啟 <http://localhost:8000>。
