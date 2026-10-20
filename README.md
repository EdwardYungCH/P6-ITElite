# P6-ITElite

IT精英班：小六學生到校體驗的三堂電腦課活動網頁。全部是純 HTML，不需要登入或伺服器。

| 路徑 | 內容 |
|---|---|
| `index.html` | 首頁，連到各堂 |
| `game/` | 第一堂「小小遊戲設計師」：學生創作遊戲 |
| `game/#teacher` | 老師控制台：匯入作品碼、評分、頒獎建議、備份 |
| `game/#gallery` | 遊戲展覽館：第三堂各組試玩及投票 |
| `hunt/` | 第三堂「校園尋寶護照」（iPad） |
| `hunt/#teacher` | 老師計分板、開場 QR 碼、站點及大使資料 |
| `hunt/#posters` | 站點海報 |

## 要注意

- 作品、評分、投票和計分板都只存在該部電腦或 iPad 的瀏覽器（localStorage）。換機要用控制台的「備份碼」。
- 第三堂的站點地點、通行碼和題目在 `hunt/index.html` 最上面的 `STATIONS` 設定，可按學校實際情況修改。
- 如用 Google 表格收集作品碼，把預先填入連結放在 `game/index.html` 的 `FORM_URL`。
