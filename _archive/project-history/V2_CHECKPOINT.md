# V2 開發檢查點

- 基準 commit：`f0f5ff766d34d7c8551e528899dc4aac2bcaaebc`
- 分支維持 `main`；依使用者最新指示不建立分支。
- 開發前只有三張 PNG 為未追蹤檔；不覆蓋、不轉檔。
- 未提交、push 或部署本次 V2；檢查點是基準 commit 與以下來源檔雜湊紀錄。
- 本機另保存基準已追蹤檔 `/tmp/garmin-v2/checkpoint-tracked.tar` 與三張原始 PNG `/tmp/garmin-v2/checkpoint/assets/result/`；暫存備份不隨 Git 分享。

> 歷史檢查點：下表雜湊是早期狗狗素材檔案的紀錄，並非目前結果圖片。這些素材已由 2026-11-11 的圖片更新提交取代；目前主站使用下表之後列出的三張跑者結果 PNG。`/tmp/garmin-v2/` 備份路徑現已不存在。

| 舊版概念 PNG（歷史記錄） | SHA-256 |
|---|---|
| 志在參加臘腸.png | `e9332b750bec6d7d554a5d79cc70404044daf8686280e91825ab8b44a05e8b97` |
| 我就是來看看柴犬.png | `e4a8b02969212339efd8116e4e526ae8448817228f422be5f929f0ff500493b7` |
| 突破PB飆速杜賓.png | `8ff43da6195c0c27fd51343414f17ec6d6a547dfeb33e3f6f778f6b21d837cc3` |

## 目前主站結果名稱與圖片

| runnerType | 顯示名稱 | 圖片 | SHA-256 |
|---|---|---|---|
| experience | 賽事收藏家 | `assets/result/賽事收藏家.png` | `273e2527fd56d3a90ee9a07050683c0cb719389d44bbdb9912b872862b2239af` |
| lifestyle | 自在巡航員 | `assets/result/自在巡航員.png` | `a42b33407060c59ab5eb243a306b01cdc16e111bdae5944cb7bf485825521318` |
| performance | 配速計算機 | `assets/result/配速計算機.png` | `573dfffe1ebb589374ce7ddc9eaaa21e3ac05a0641f6196fd72fd6906c9b0d2d` |
