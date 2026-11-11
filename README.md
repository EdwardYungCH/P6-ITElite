# P6-ITElite

IT精英班：小六學生到校體驗的三堂電腦課活動網頁。全部是純 HTML，不需要登入或伺服器。

| 路徑 | 內容 |
|---|---|
| `index.html` | 首頁，連到各堂 |
| `game/` | 第一堂「小小遊戲設計師」：6 款小遊戲（接寶物、飛行穿管、恐龍跑酷、打地鼠、太空射擊、過馬路）揀一款來創作，另有 4 個 ★ 進階挑戰（兩格動畫、道具、背景貼紙、背景音樂）和「帶回家玩」QR 碼 |
| `game/#teacher` | 老師控制台：匯入作品碼、評分、頒獎建議、備份 |
| `game/#gallery` | 遊戲展覽館：第三堂各組試玩及投票 |
| `sculpt/` | 第二堂「3D 造型工作室」：線性教學 1→2→3→4（a 膨脹 b 皺褶 c 抹平）→5，右邊嵌入 SculptGL；上載 .sgl 和圖片 |
| `sculpt/#gallery` | 3D 作品展覽館（顯示班別班號，不顯示姓名） |
| `sculpt/#teacher` | 老師評分：三級（圓滿完成／部分完成／未完成）、★ 精選、評語；需要老師密碼 |
| `hunt/` | 第三堂「校園尋寶護照」（iPad）：15 題校園題庫自由選做，按難度給分（★10／★★20／★★★30），每題最多答 3 次；出發前要先答對「燈泡密碼」出發題；防抄：單數組和雙數組有 4 題用不同版本 |
| `hunt/#teacher` | 老師計分板、題目設定（編輯器）、開場 QR 碼（包含題目，答案加密） |
| `hunt/#answers` | 答案表（老師及大使用，包括出發題和雙數組版本） |
| `hunt/#startshow` | 出發題投影頁：大燈泡、提示計時、顯示答案 |

## 要注意

- 作品、評分、投票和計分板都只存在該部電腦或 iPad 的瀏覽器（localStorage）。換機要用控制台的「備份碼」。
- 第三堂的題目在老師頁「題目設定」修改，存在老師那部機；學生 iPad 經開場 QR 碼取得題目。改了題目要重新產生 QR 碼。沒有改動的題庫題目在 QR 碼裏只傳編號，所以 QR 碼很短。
- 「帶回家玩」QR 碼指向 `https://edwardyungch.github.io/P6-ITElite/game/#作品碼`，需要開啟 GitHub Pages。網址在 `game/index.html` 的 `SITE_URL`。
- 如用 Google 表格收集作品碼，把預先填入連結放在 `game/index.html` 的 `FORM_URL`。

## 第二堂上載後台（Google Apps Script）

- 程式碼在 `sculpt/apps-script.gs`，檔案頂部有安裝步驟。作品和記錄表存放在老師 Google Drive 的「IT精英班 3D 作品」資料夾。
- 部署後把 `/exec` 網址填入 `sculpt/index.html` 的 `API_URL`。未填時，教學步驟照常可用，上載、展覽館和評分會顯示設定說明。
- 老師密碼在 `apps-script.gs` 的 `TEACHER_PIN`。
