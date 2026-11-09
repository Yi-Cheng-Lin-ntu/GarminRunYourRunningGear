> 本文件保留 2026-11-09 的 V2 實作與驗收摘要。現行入口與模組以 [PROJECT_MAP.md](PROJECT_MAP.md) 為準；結果頁人工微調請參考 [UI_TUNING_GUIDE.md](UI_TUNING_GUIDE.md)。

# Garmin Run 2026 V2 — 實作與驗收紀錄

日期：2026-11-09。基準 `f0f5ff7`，維持 main 工作區，依最新指示不建分支，以 [V2_CHECKPOINT.md](V2_CHECKPOINT.md) 記錄檢查點。未commit、push、merge、改Pages設定、部署Apps Script或操作遠端Sheets／庫存。三張未追蹤PNG原樣保留，雜湊未變。

## 已實作

- `content.csv`：五題各三選，中文逐字依需求；metadata=2；三個result、固定slogan、四組獨立tag欄；九個recommendation；完整雙語UI。所有新英文為暫譯，待核定。
- `classificationEngine.js`／`classificationRules.js`：四題計分、Q2平手，Q4僅處理補水與原本自帶旗標。IDs保持三種runnerType。
- `index.html`／`style.css`／`appV2.js`：主入口V2，結果＋永續邀請→獨立必填聯絡→既有領獎；precision/rest未選不能前進，pioneer直接繼續。
- `participationValidation.js`／`apiClient.js`：V2 Mock重新驗證答案與資格，全員聯絡／確認／自動抽獎；Mock participant追加三個追溯欄位；分配權重、數量、防重、paused不改。
- `redemptionView.js`：原領獎renderer抽為共用模組，保留markup行為與產品圖，主V2／舊Cute共用。
- `app.js`／`legacyClassificationRules.js`／`archive/v1/`：V1參考入口使用凍結的CSV與規則；`cute/`所有原始檔無差異。舊JS資料加歷史標記，非V2來源。
- `.gs`更新：Validation、Code、Setup、Allocation；Inventory無修改。只在記憶體模擬中驗證，未對Google服務執行任何函式。
- README、Project Map、Design System、Apps Script操作文件與測試同步更新。舊文件保存在archive/v1。

## 圖片與版面

未找到工作目錄內PDF，也沒有本輪可用PDF附檔；依文字規格實作，未聲稱讀過PDF。

| 類型 | 原始PNG | 大小／格式 |
|---|---|---|
| experience | `志在參加臘腸.png` | 43,080 bytes，334×163 RGBA |
| lifestyle | `我就是來看看柴犬.png` | 64,579 bytes，156×342 RGBA |
| performance | `突破PB飆速杜賓.png` | 30,869 bytes，156×297 RGBA |

不裁切、不轉檔、不生成或替換；`object-fit:contain`，module相對專案root解析。狗狗為主視覺，四格tag使用固定Grid上下角，中央row專留圖片，沒有逐圖座標。空白標籤仍保留色塊並aria-hidden，非按鈕。

V2固定七色；舊base CSS的歷史值不回寫Cute。淺底深字、CTA綠底黑字。已檢視375／390與1280代表截圖；長英文及中文tag不與圖片重疊，左右不溢出。pioneer保留推薦區標題，但內容改為肯定與邀請朋友，不顯示裝備名稱。

## 測試結果

`node --test tests/*.test.mjs`：**6個測試檔、24項測試通過**，其中exhaustive一項覆蓋243種答案組合。

| 檔案 | 覆蓋 |
|---|---|
| mockBackend.test.mjs | 既有A級優先、fallback、joined一般池、防負庫存、paused、requestId與加權抽樣 |
| prizeEligibility.test.mjs | existing／joined／considering資格 |
| uiVariant.test.mjs | 舊Cute顯示映射與原內容不變、七色與資產根路徑 |
| v2.contract.test.mjs | 五題原文與三選、243組前後端同分數／同結果、所有最高分／18組平手配置、排序不影響、九推薦、PNG、slogan／四tag、全員聯絡／確認、Production草稿與Demo限制 |
| v2.backend.test.mjs | 記憶體Sheet的append-only／可重跑migration、舊列與兩庫存不變、衝突／缺migration拒絕、端到端分配、防重、fallback／joined、paused及三個metadata欄位 |
| v2.mock.test.mjs | V2完整Mock提交、固定抽獎、資格、原始Q4紀錄、同request不重扣、無庫存安全結果 |

`tests/v2UiRegression.cjs` 實際啟動Chromium，僅本機流量；測試自行管理server生命週期。

- 375、390、430、768、1280px全部通過：五題、每題三選、三種結果、PNG載入、四標籤／空白格不重疊、邀請必選、pioneer跳過邀請、聯絡／Email／確認必填、沒有raffle toggle、Mock三種資格與領獎背景、刷新及重測清除。
- 390px額外渲染全部九種推薦、paused無虛構獎品。
- 中文／英文結果與聯絡頁、回切保留固定slogan／tag；沒有水平捲動、資產404、console error或pageerror。
- Pages專案子路徑下 PNG／CSV／modules／獎品圖正確；舊Demo fixture不送POST並顯示V2未更新；V2 fixture正確送原始ID、Q4、固定raffleOptIn與告知確認。
- 舊Cute入口smoke通過，使用凍結V1題目與概念SVG；只供參考。

[瀏覽器機器結果](docs/v2-review/results.json)。`git diff --check`通過；三張PNG SHA-256與檢查點一致；`git diff -- cute/`無差異。中途一次獨立本機server中斷，改由測試擁有server後完整重跑通過，不把中斷那輪當作完成證據。

### 代表截圖

| 畫面 | 390px | 1280px |
|---|---|---|
| 首頁 | [手機](docs/v2-review/390-landing.png) | [桌機](docs/v2-review/1280-landing.png) |
| 題目 | [手機](docs/v2-review/390-quiz.png) | [桌機](docs/v2-review/1280-quiz.png) |
| 臘腸＋precision | [手機](docs/v2-review/390-result-experience-precision.png) | [桌機](docs/v2-review/1280-result-experience-precision.png) |
| 柴犬＋rest | [手機](docs/v2-review/390-result-lifestyle-rest.png) | [桌機](docs/v2-review/1280-result-lifestyle-rest.png) |
| 杜賓＋pioneer | [手機](docs/v2-review/390-result-performance-pioneer.png) | [桌機](docs/v2-review/1280-result-performance-pioneer.png) |
| 聯絡頁 | [手機](docs/v2-review/390-contact.png) | [桌機](docs/v2-review/1280-contact.png) |
| 英文結果 | [手機](docs/v2-review/390-english-result-performance.png) | [桌機](docs/v2-review/1280-english-result-performance.png) |
| 一般領獎 | [手機](docs/v2-review/390-redemption-experience.png) | [桌機](docs/v2-review/1280-redemption-experience.png) |
| 永續領獎 | [手機](docs/v2-review/390-redemption-lifestyle.png) | [桌機](docs/v2-review/1280-redemption-lifestyle.png) |
| 耗盡 | [手機](docs/v2-review/390-paused.png) | — |

其餘尺寸／九種結果截圖同目錄。表單截圖清空虛構聯絡欄位，所有文件／URL／一般console皆不含真實個資。

## 手動更新與相容性

完整操作見 [apps-script/README.md](apps-script/README.md)。必要順序：四個.gs更新→手動`migrateDemoV2()`→核對DemoParticipants新增第19–21欄→更新Demo Web App版本→確認GET quizVersion=2→另行授權測試。既有Demo不執行整套setup，不改正式表或庫存。

- **舊 `/exec` 未更新**：主V2無法Demo提交，前端會提示，不是只push前端即可完成。
- **V2後端／V1客戶端**：未帶quizVersion=2會拒絕；Cute不是本輪Demo相容目標。
- **舊Participant資料**：新欄保持空白，不猜測Q4；分析須依quizVersion分開。
- **現有Mock歷史／庫存**：不重設，同源仍共用；舊列不會被改為V2。
- **正式個資**：沒有核定告知版本，Production草稿仍阻擋；本輪沒有啟用正式蒐集。

## 尚未完成／未執行

- Garmin核准的正式個資告知、正式版本與抽獎辦法；本頁是清楚的測試占位。
- 新英文內容核定、PDF示意核對（尚未取得）。
- 真實Apps Script更新、Demo migration／重新部署與遠端寫入／CORS驗收；需維護者執行，不能以本輪fixture代替。
- 實機iOS Safari／Android、螢幕閱讀器、現場光線及瀏覽器zoom人工驗收；沒有宣告完整無障礙認證。
- 高並發、故障注入與processing部分寫入恢復依原決議延後，未納入本輪。
- 正式庫存核定、管理權限與正式發布仍待原流程，不宣告正式上線。

## 預覽

Codespaces Ports開啟 **8020**，主入口 `/`，可另測 `/GarminRunYourRunningGear/`。網址的 `?mode=apps-script-demo` 只適用完成V2更新後的Demo；現在優先預設Mock並填虛構資料。

若預覽程序已停止，在repository根目錄執行 `python3 -m http.server 8020 --bind 0.0.0.0` 再從Ports開啟，使用 `/` 即可。自動化重跑方式見README。
