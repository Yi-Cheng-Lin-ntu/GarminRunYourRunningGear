# Garmin Run 2026｜跑者風格測驗

Garmin Run 2026 的五題匿名跑者測驗。網站依答案顯示跑者類型與補水建議；使用者完成補水行動選擇後，由 Google Apps Script 驗證資料並即時分配現場周邊。紙本抽獎獨立於網站辦理。

## 目前使用者流程

1. Q1、Q2、Q3、Q5 各為三選一並參與跑者分類；最高分平手依 Q2 答案所屬類型決定。
2. Q4 不參與計分，獨立決定 `precision`、`rest` 或 `pioneer` 補水類型。
3. 跑者 ID 與名稱：`experience`＝賽事收藏家、`lifestyle`＝自在巡航員、`performance`＝配速計算機。
4. `pioneer` 表示原已自帶補水；其餘跑者在結果頁選擇「加入」或「考慮」。
5. 按「繼續領獎」後匿名送出答案、分類和補水狀態。Apps Script 重新驗證後分配獎品；前端只在收到已分配或暫停回應後顯示兌獎結果。

保留既有獎品規則：原已自帶補水者優先取得購物袋；購物袋無庫存時依原 fallback 規則進入一般獎池；一般獎品按啟用狀態及剩餘庫存加權；無可分配獎品時顯示「獎品已發放完畢，謝謝參與」。同一 `requestId` 重試會重播既有結果，不再次扣庫存。

## 隱私與資料界線

正式流程不收集姓名、Email、電話、地址、線上抽獎登記或個資告知欄位。舊 Sheets schema 仍可能保留歷史個資欄位；新版匿名列將這些欄位留空，並不等於已刪除歷史資料。request/session ID、作答及時間仍屬可關聯的活動資料，因此本專案不宣稱完全匿名或法遵認證。紙本抽獎資料不進入本系統。

## 環境與網址

`js/environment.js` 設定單一 Apps Script `/exec` URL，依網址與主機決定模式：

| 開啟方式 | 前端模式 | 資料去向 |
|---|---|---|
| localhost／Codespaces，一般網址 | Development Mock | 僅該瀏覽器的 localStorage；不送 Apps Script |
| 任一主機加 `?mode=apps-script-demo` | Demo | 共用 Apps Script 以 `mode=apps-script-demo` 路由至 `Demo*` 工作表 |
| GitHub Pages 一般網址，不帶 mode | Production | 同一 Apps Script 路由至正式工作表 |

Demo query 是資料表路由，不是權限或身份驗證。Repository 目前沒有獨立 Staging hostname／Spreadsheet；`STAGING_HOSTS` 的 `.invalid` 項目只是未設定範例。Production 一般入口會連到正式系列資料表，請勿用它做測試提交。若正式 API 未設定或狀態不相容，提交會停止，不會退回 Mock。

### Codespaces 預覽

在 repository 根目錄執行：

```sh
python3 -m http.server 8020 --bind 0.0.0.0
```

從 Codespaces Ports 開啟 8020。一般入口使用本機 Mock；請以虛構答案測試，Mock 只影響本機瀏覽器儲存資料。

## 開發與測試

```sh
node --test tests/*.test.mjs
```

測試使用 Node、記憶體 Spreadsheet fixture 與本機 Mock，不應連線到正式 Apps Script、正式 Sheets 或正式庫存。可選的 `tests/v2UiRegression.cjs` 需要本機 Playwright／Chromium，不是每次 UI 微調的必要步驟。

## 文件導覽

- [AGENTS.md](AGENTS.md)：開發限制與分級驗證方式。
- [PROJECT_MAP.md](PROJECT_MAP.md)：現行入口、資料流、模組和 Sheets schema。
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)：主站設計規範。
- [UI_TUNING_GUIDE.md](UI_TUNING_GUIDE.md)：結果卡、下載圖與兌獎頁的微調位置。
- [apps-script/README.md](apps-script/README.md)：API、環境、Migration 與人工部署步驟。
- [docs/ui-screenshots/mobile-launch-review-2026-11-16/](docs/ui-screenshots/mobile-launch-review-2026-11-16/)：最近一次本機 Mock 手機流程截圖；不是遠端 Production 驗收。
- [_archive/README.md](_archive/README.md)：已封存原型、設計稿、歷程及不再使用的檔案索引。

## 部署狀態

Repository 的 `.gs` 檔案不會自動同步至 Apps Script。是否已更新部署與試算表欄位，需在 Google 端另行核實。本專案不會因 GitHub Pages push 自動完成 Apps Script 部署或 Sheet migration。
