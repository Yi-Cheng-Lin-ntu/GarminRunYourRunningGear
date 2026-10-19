# Garmin Run Your Running Gear

Garmin Run 2026 的跑者風格與補水方式互動測驗 prototype。

這是使用 HTML、CSS 與 Vanilla JavaScript 建立的 static front end，可直接部署到 GitHub Pages，不需要後端服務。

## 開發狀態

- Landing、六題測驗、結果與重新測驗流程
- 六題固定順序、全部必答、每題單選
- 每次測驗隨機排列各題選項；返回上一題時保留排列，重新測驗才重新排列
- Q6 支援五個選項，由資料動態產生
- 返回上一題後重新選擇會覆蓋舊答案
- 中英文 UI 與內容切換
- 三向度 rule-based classification 與集中式 tie-breaking
- 獨立的 sustainability boolean flag，不作為第四個分數向度
- 結果圖片預留固定路徑欄位，尚未放入正式圖片

目前題目與結果文案已依 MVP 規格配置；分類仍是活動互動用途，不代表正式心理測量結果。

## 本機預覽

JavaScript 使用 ES modules，且測驗內容由瀏覽器 `fetch` 載入 CSV；請透過 local server 預覽，不要直接以 `file://` 開啟：

```bash
python3 -m http.server 8000
```

再開啟 <http://localhost:8000>。

## 專案地圖與內容修改

[`PROJECT_MAP.md`](PROJECT_MAP.md) 是技術架構與維護指南，集中說明檔案職責、相依關係、修改入口與風險。測驗題目、選項、結果與相關 UI 文案都由 [`content.csv`](content.csv) 提供；要修改內容或分類欄位，請先看 Project Map 的「編輯題目與結果 CSV」及「分類行為與資料契約」。
