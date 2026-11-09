# Garmin Run Development Rules

## Project
Garmin Run 2026 interactive quiz and prize allocation.

## Architecture
- Frontend: HTML, CSS, Vanilla JavaScript
- Hosting: GitHub Pages
- Backend: Google Apps Script
- Database: Google Sheets

## Development principles
- Preserve the existing quiz and classification rules.
- Do not modify prize eligibility without approval.
- Keep Mock and Production environments separate.
- Never store personal information in the repository.
- Do not modify production inventory during testing.
- Run tests before reporting completion.
- Explain changed files and remaining risks.

## Fast Iteration Mode｜快速迭代開發

本專案目前處於 UI 微調與功能優化階段，優先維持開發效率。以下分級驗證原則作為後續 Codex CLI 任務的預設工作方式，並具體界定原有測試要求的適用範圍。

### Level 1：一般 UI 微調（預設）

適用於 CSS、字體、間距、圖片尺寸、標籤位置、按鈕排列、簡單文案等修改。

- 直接實作，不需要先產出長篇計畫。
- 不需要每次執行完整測試。
- 不需要使用 Playwright。
- 不需要自動產生截圖。
- 不需要測試全部裝置尺寸。
- 不需要每次更新 README 或設計文件。
- 只修改相關檔案，避免順便重構其他區塊。
- 完成後簡短說明修改內容，以及供人工微調的 CSS selector。

### Level 2：局部功能修改

適用於單一頁面互動、顯示條件、簡單表單行為等修改。

- 直接實作。
- 只檢查受影響的功能。
- 有既有相關測試時，可執行少量目標測試。
- 不需要產生大量截圖或完整回歸報告。
- 不修改無關程式。

### Level 3：重大機制調整

適用於：

- 測驗分類演算法。
- Q4 補水與永續資格。
- 獎品資格及庫存分配。
- Apps Script API。
- Google Sheets 資料契約。
- 姓名、Email 等個資處理。
- 正式上線與部署前驗收。

此類修改必須進行相應的功能驗證與必要的回歸測試。完整測試範圍應以受影響機制為準，不必無差別測試所有畫面。

### 通用規則

1. 不要把每次任務都當成正式產品發布。
2. 不要為了一個 CSS 調整而進行多分鐘的完整測試。
3. 不要在沒有要求的情況下產生大量圖片、截圖或測試報告。
4. 不要擅自重構無關程式碼。
5. 不要擅自修改既有品牌配色。
6. 不要擅自修改分類、永續資格、抽獎與獎品規則。
7. 只在任務涉及重大機制、安全性、資料一致性，或使用者明確要求時進行深入驗證。
8. 如果發現明顯會破壞使用者流程的錯誤，應修正或清楚回報，不得為追求速度而忽略。
9. 除非使用者要求，否則不自動 commit、push 或部署。
10. 完成時用繁體中文簡短回報：修改內容、相關檔案、是否有尚未驗證的事項。
