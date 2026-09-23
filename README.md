# Garmin Run Your Running Gear

Garmin Run 2026 的跑者風格與補水方式互動測驗 prototype。

這是一個不需要 backend 的 static website，使用 HTML、CSS 與 Vanilla JavaScript，可直接部署到 GitHub Pages。

## 開發狀態

目前已完成第一版 functional MVP：

- Landing、五題測驗、結果、重新測驗流程
- 五題固定順序、全部必答、每題單選
- Q2 的五個選項由資料動態產生
- 返回上一題後重新選擇會覆蓋舊答案
- 中英文 UI 與內容切換
- Rule-based classification 與集中式 tie-breaking
- 結果圖片預留固定路徑欄位，尚未放入正式圖片

目前選項的 `traits` 是為了測試 UI 流程的 placeholder mapping，不代表正式心理測量結果。

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

- `quizData.js`：題目、選項、雙語文字與每個選項的 `traits`
- `classificationRules.js`：tie-break 優先題目與 fallback 設定
- `classificationEngine.js`：計算 trait 數量、套用分類規則，只回傳 result type 與 counts
- `resultData.js`：結果名稱、描述、補水建議、圖片路徑與 CTA 內容
- `app.js`：狀態、DOM rendering、答案儲存與頁面導覽
- `style.css`：mobile-first layout 與視覺樣式

UI 不會判斷某個答案屬於哪一種跑者類型。分類器在完成最後一題時，依照目前 `answers` 重新計算所有 trait，因此返回修改答案不會產生 double scoring。

## 修改題目或分類

每個選項目前使用可擴充的 `traits` 陣列：

```js
{
	id: "q1_a",
	text: {
		zh: "選項文字",
		en: "Option text"
	},
	traits: ["light"]
}
```

未來可以直接改成多個 trait：

```js
traits: ["light", "sustainability"]
```

不需要修改 UI。正式 classification matrix 確認後，只需更新 `quizData.js` 的 traits 與 `classificationRules.js` 的規則。

目前 tie-break 流程是：

1. 先比較 trait 計數
2. 平手時依 `priorityQuestions` 檢查指定題目
3. 仍平手時使用最後一個有回答的題目
4. 最後使用 `fallbackType`

這些是 placeholder rules，尚未代表正式分類設計。

## 本機預覽

因為 JavaScript 使用 ES modules，請透過 local server 預覽：

```bash
python3 -m http.server 8000
```

再開啟 <http://localhost:8000>。
