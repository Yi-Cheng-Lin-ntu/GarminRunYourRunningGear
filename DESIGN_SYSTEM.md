# Garmin Run 2026 — Main V2 Design System

以提供的文字規格製作；未取得 PDF，沒有依據不存在的附件推測版面。歷史 Urban 規格保留在 `archive/v1/DESIGN_SYSTEM.md`；Cute 原型已封存於 `_archive/cute-prototype/`，不屬於目前主站。

## 定位與七色

主網站維持深黑、冰藍、螢光綠的 Garmin Run 品牌語言，以使用者提供的狗狗 PNG 為中心。結果圖直接融入深色頁面，不使用白色外框卡片；保留低對比道路紋理，裝飾不與圖片及文字競爭。系統 Sans-serif、直立字體，不額外下載字型。

主網站只載入 `style.css`。目前入口沒有 Cute 樣式或 UI variant 載入。主站目前的品牌色以 `style.css` 的 tokens 為準：

| Token | HEX | 用途 |
|---|---|---|
| --brand-black | #080B0D | 主背景、綠色CTA及亮色領獎頁的文字 |
| --brand-surface | #11171A | 選項、推薦、輸入框背景 |
| --brand-white | #F7FAF8 | 深色畫面主要文字 |
| --brand-muted | #8E9BA0 | 次要文字與測試標記 |
| --brand-blue | #7BCCFF | 資訊、次要互動、一般領獎背景 |
| --brand-blue-mid | #A9DEF2 | 標籤層次 |
| --brand-green | #00FF19 | CTA、選取、完成進度、永續領獎 |

主要 CTA 綠底黑字，次要按鈕冰藍邊框／文字。錯誤沿用原本粉紅文字與提示邊界，不用綠色表示錯誤。領獎頁維持原本亮色主題與深色文字。

## 字體、間距與元件

沿用系統字型 fallback：Helvetica Neue／Arial、Noto Sans TC、PingFang TC、Microsoft JhengHei。主要結果名稱26–36px、固定 slogan16px、推薦標題20px、標籤13px、正文16px。行高1.4–1.7，中文不使用強負字距。

620px單欄；基礎spacing4/8/16/24/32/48px；頁面透明無外框、推薦與選項6px、主要CTA4px，沿用原本方正俐落的元件比例。輸入框52px高；按鈕至少52px；隱藏radio仍有卡片focus與實體選取記號。

## 結果卡順序

1. 「你是！」→狗狗名稱→固定 slogan。
2. 四格標籤與中央完整 PNG。
3. 「下一場，可以試試……」→依 `runnerType:hydrationStyle` 的裝備／肯定標題與推薦文案。
4. 永續邀請：precision／rest二選一，pioneer只感謝；「繼續領獎」。
5. 次要「重新測驗」。

推薦 slogan 與固定跑者 slogan 是不同資料，不可互相覆蓋。pioneer gear=null，不顯示虛構裝備。

## 四個固定標籤與圖片

`runner-scene` 使用兩欄三列 Grid 保留圖片完整通道，四個tag分散在上下四角：左右垂直錯位、依內容決定寬度，僅有少量角度變化，避免形成按鈕列。tag不跨入圖片row；空字串保留較短的裝飾色塊並設aria-hidden=true，無button角色。

結果名稱由 `content.csv` 提供，三種 ID 的中文名稱目前已是新版名稱。**目前工作區缺少新版狗狗 PNG**：`assets/result/` 實際只包含 `賽事收藏家.png`、`自在巡航員.png`、`配速計算機.png`，主站仍用 `js/appV2.js` 的 `RESULT_ILLUSTRATIONS` 顯示這三張舊圖。CSV 中狗狗檔名與檢查點文件記錄的 SHA-256，無法在目前工作區找到對應檔案；恢復原圖前不應宣稱狗狗圖片已正確呈現。

中央row手機220px、桌機260px，圖片width/height100%、object-fit:contain；臘腸橫幅與直立犬共用相同slot，不以逐圖座標調整。長英文標籤自然換行，拉高自己的row，不侵入中央圖片。結果頁主要尺寸與標籤位置由 `style.css` 的 `RESULT PAGE — QUICK TUNING` variables 控制，完整對照見 [UI_TUNING_GUIDE.md](UI_TUNING_GUIDE.md)。

補水裝備圖片只出現在推薦區，使用 `js/hydrationEquipment.js` 以穩定的 `runnerType:hydrationStyle` 對應；pioneer 不顯示裝備圖。圖片使用 `object-fit:contain` 與獨立小尺寸區域，不影響狗狗圖或四角標籤。

## 聯絡與領獎

先鋒隊選項放在 `.hydration-choices`，手機／桌機皆為等寬雙欄，圖形標記位於上方；選取維持綠框、綠色側線及radio提示。間距由 `--hydration-choice-gap` 控制。

聯絡頁獨立：姓名、Email、未核准測試告知及確認checkbox，沒有raffle toggle；所有合法提交自動登記測試抽獎。畫面明示虛構資料，Demo提示保留網域限制，不捏造官方政策或期限。

領獎保留原版markup與共用rendering、商品圖片contain、paused畫面及再測一次。existing／joined綠底，considering冰藍。顏色代表行動資格，不是狗狗分類或獎品等級。

## Accessibility 與驗收

深色畫面使用White／Muted，focus為冰藍；亮色領獎頁使用Black文字及focus。Black on Green約14.4:1、Black on Ice Blue約16.9:1。重要邊界使用深色；選取狀態除顏色外有側線／勾號或radio。空標籤不朗讀，PNG有雙語alt；錯誤保留alert，尊重reduced-motion。

至少驗收375／390／430／768／1280px、中文／英文、四格位置、長標籤、完整PNG、邀請gating、必填聯絡與Mock領獎。證據與限制見 `V2_REVIEW.md`。英文為暫譯待核定；實機Safari／Android與螢幕閱讀器仍需人工驗收。

`V2_REVIEW.md` 與 `docs/v2-review/` 是既有驗收紀錄；目前可人工調整的 CSS 與文案位置請以 [UI_TUNING_GUIDE.md](UI_TUNING_GUIDE.md) 及目前程式為準。
