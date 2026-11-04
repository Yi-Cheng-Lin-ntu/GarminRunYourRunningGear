# Garmin Run Apps Script Phase 3 操作指南

本目錄是正式 Google Sheets 後端骨架；尚未部署前不會連接正式活動資料。

## 您需要提供

1. 可建立試用 Spreadsheet 的 Google 帳號。
2. 建立或指示建立試用 Spreadsheet 後的網址。
3. Garmin 核准後的正式個資告知版本字串。
4. 正式 Apps Script Web App 部署 URL。
5. 正式獎品圖片與權限確認。

正式個資告知未核准前，`privacyNoticeVersion` 仍為 `DRAFT_NOT_APPROVED`；公開正式提交會拒絕。

## 安裝

1. 建立或開啟 Google Spreadsheet。
2. 選擇「擴充功能 → Apps Script」。
3. 建立 `Code.gs`、`Validation.gs`、`Allocation.gs`、`Inventory.gs`、`Setup.gs`，並貼上此目錄對應程式。
4. 執行一次 `setupActivitySheets`，或重新載入 Sheet 並使用「Garmin Run 管理」選單。
5. 先部署試用 Demo Web App。
6. 正式核准與設定完成後，再部署正式 Web App。

## Web App 部署

1. Apps Script 選擇「部署 → 新增部署作業」。
2. 類型選「Web 應用程式」。
3. Execute as 選「自己」。
4. Who has access 先選「任何人」，GitHub Pages 參與者需要無登入提交。
5. 部署後取得 `/exec` URL。

不要使用 JSONP、`mode: no-cors` 或私密 API 金鑰。前端需能讀取 Apps Script JSON 回應。

## API

POST submitParticipation 使用 JSON：

```json
{
  "requestId": "uuid",
  "sessionId": "uuid",
  "runnerType": "experience",
  "existingSelfHydration": false,
  "hydrationCommitment": "joined",
  "sustainabilityRewardEligible": true,
  "premiumPrizeEligible": false,
  "raffleOptIn": false,
  "name": "",
  "email": "",
  "privacyNoticeVersion": "DRAFT_NOT_APPROVED",
  "privacyAcknowledgedAt": "",
  "demoMode": true,
  "answers": {
    "q1": "q1_experience",
    "q2": "q2_sustainability",
    "q3": "q3_experience",
    "q4": "q4_lifestyle",
    "q5": "q5_performance"
  }
}
```

伺服器依 `answers` 重算跑者類型、sustainability 與獎品資格，不信任前端資格欄位。

Recovery：

`...?action=getExistingAllocation&requestId=...&sessionId=...&demoMode=true`

Public status：

`...?action=getPublicCampaignStatus&demoMode=false`

## CORS / HTTPS

Apps Script Web App 使用 HTTPS，可被 GitHub Pages 使用 fetch 讀取 JSON。但部署權限、組織政策或瀏覽器 CORS 預檢仍可能阻擋；不得改用 `mode: no-cors` 假裝成功。若無法可靠讀取回應，需改用 Apps Script HTML Service 或經授權的中介後端。

## 管理員操作

Spreadsheet 的「Garmin Run 管理」選單可：

- 初始化工作表
- 檢查庫存一致性
- 調整獨立獎品庫存
- 暫停或恢復分配
- 匯出抽獎名單

庫存調整會寫入 InventoryLog 與 AdminAudit。正式上線前請確認管理員帳號與操作範圍。

## 正式部署前人工確認

- 正式 Sheets 無測試參與者資料。
- Demo 與正式工作表及庫存分離。
- 個資告知版本已由 Garmin 核准。
- Google 帳號管理權限已限制。
- Web App 已部署版本固定。
- 重複 requestId、網路重試、一般池耗盡、購物袋耗盡、A 級優先及抽獎匯出均已試跑。
