/**
 * IT精英班 第二堂：3D 作品上載後台（Google Apps Script）
 *
 * 安裝方法（只需做一次）：
 * 1. 打開 https://script.google.com ，按「新增專案」。
 * 2. 刪除原有內容，把這個檔案全部貼上。
 * 3. 把下面的 TEACHER_PIN 改成你自己的老師密碼。
 * 4. 按「部署」→「新增部署作業」→ 齒輪揀「網頁應用程式」：
 *      執行身分：我
 *      誰可以存取：所有人
 *    按「部署」，按指示授權。
 * 5. 複製「網頁應用程式網址」（以 /exec 結尾），交給 Claude 放入網頁。
 *
 * 作品會存放在你 Google Drive 的「IT精英班 3D 作品」資料夾，
 * 記錄表「IT精英班 3D 作品記錄」會自動建立在同一個資料夾。
 * 修改這個程式後，要「部署」→「管理部署作業」→ 編輯 → 版本揀「新版本」才會生效。
 */

const TEACHER_PIN = '2026';                 // ← 改成你的老師密碼
const FOLDER_NAME = 'IT精英班 3D 作品';
const MAX_SGL_MB = 30;
const MAX_JPG_MB = 8;
const HEAD = ['id', 'time', 'name', 'cls', 'num', 'title', 'sglId', 'sglName', 'jpgId', 'thumb', 'level', 'star', 'comment', 'active'];

/* ---------- 入口 ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'list') return out({ ok: true, works: listWorks(false) });
    if (p.action === 'tlist') { if (!pinOk(p.pin)) return out({ ok: false, error: 'pin' }); return out({ ok: true, works: listWorks(true) }); }
    if (p.action === 'file') return out(getFile(p.id, p.kind));
    if (p.action === 'ping') return out({ ok: true, pong: true });
    return out({ ok: true, msg: 'IT精英班 3D 作品後台運作正常' });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'upload') return out(upload(d));
    if (d.action === 'mark') return out(mark(d));
    if (d.action === 'checkpin') return out({ ok: pinOk(d.pin) });
    return out({ ok: false, error: 'unknown action' });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

/* ---------- 工具 ---------- */
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function pinOk(pin) { return String(pin || '') === String(TEACHER_PIN); }
function clean(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, '').trim().slice(0, n); }

function folder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', f.getId());
  return f;
}
function sheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (e) {} }
  const ss = SpreadsheetApp.create('IT精英班 3D 作品記錄');
  DriveApp.getFileById(ss.getId()).moveTo(folder());
  const sh = ss.getSheets()[0];
  sh.appendRow(HEAD);
  sh.setFrozenRows(1);
  props.setProperty('SHEET_ID', ss.getId());
  return sh;
}
function rows() {
  const sh = sheet();
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, HEAD.length).getValues().map((r, i) => {
    const o = { _row: i + 2 };
    HEAD.forEach((h, k) => { o[h] = r[k]; });
    return o;
  });
}

/* ---------- 上載 ---------- */
function upload(d) {
  const name = clean(d.name, 20), cls = clean(d.cls, 6).toUpperCase(), num = parseInt(d.num, 10), title = clean(d.title, 30);
  if (!name || !cls || !(num >= 1 && num <= 45)) return { ok: false, error: '請先填寫姓名、班別和班號' };
  if (!d.jpg) return { ok: false, error: '請附上作品圖片' };
  const jpgBytes = Utilities.base64Decode(d.jpg);
  if (jpgBytes.length > MAX_JPG_MB * 1048576) return { ok: false, error: '圖片太大' };
  let sglBytes = null;
  if (d.sgl) {
    sglBytes = Utilities.base64Decode(d.sgl);
    if (sglBytes.length > MAX_SGL_MB * 1048576) return { ok: false, error: '3D 檔太大' };
  }
  const thumb = String(d.thumb || '');
  if (thumb.length > 48000 || !/^data:image\/jpeg;base64,/.test(thumb)) return { ok: false, error: '縮圖格式不正確' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const f = folder();
    const stamp = Utilities.formatDate(new Date(), 'Asia/Hong_Kong', 'MMdd-HHmmss');
    const base = cls + '-' + ('0' + num).slice(-2) + '-' + name + '-' + stamp;
    const jpg = f.createFile(Utilities.newBlob(jpgBytes, 'image/jpeg', base + '.jpg'));
    let sglId = '', sglName = '';
    if (sglBytes) {
      const sglFile = f.createFile(Utilities.newBlob(sglBytes, 'application/octet-stream', base + '.sgl'));
      sglId = sglFile.getId(); sglName = base + '.sgl';
    }
    const sh = sheet();
    // 同一位同學再交：舊紀錄設為不顯示（檔案保留），評分搬到新紀錄
    let keep = { level: '', star: '', comment: '' };
    rows().forEach(r => {
      if (r.active === true && String(r.cls) === cls && Number(r.num) === num) {
        keep = { level: r.level, star: r.star, comment: r.comment };
        sh.getRange(r._row, HEAD.indexOf('active') + 1).setValue(false);
      }
    });
    const id = Utilities.getUuid().slice(0, 8);
    sh.appendRow([id, new Date(), name, cls, num, title, sglId, sglName, jpg.getId(), thumb, keep.level, keep.star, keep.comment, true]);
    return { ok: true, id: id };
  } finally { lock.releaseLock(); }
}

/* ---------- 清單 ---------- */
function listWorks(full) {
  return rows().filter(r => r.active === true).map(r => {
    const o = { id: r.id, cls: r.cls, num: r.num, title: r.title, thumb: r.thumb, star: r.star === true, hasSgl: !!r.sglId,
      time: r.time instanceof Date ? r.time.getTime() : 0 };
    if (full) { o.name = r.name; o.level = r.level; o.comment = r.comment; }
    return o;
  });
}

/* ---------- 下載原圖或 3D 檔 ---------- */
function getFile(id, kind) {
  const r = rows().find(x => x.id === id);
  if (!r) return { ok: false, error: '找不到作品' };
  const fid = kind === 'sgl' ? r.sglId : r.jpgId;
  if (!fid) return { ok: false, error: '沒有這個檔案' };
  const file = DriveApp.getFileById(fid);
  return { ok: true, name: file.getName(), mime: kind === 'sgl' ? 'application/octet-stream' : 'image/jpeg', b64: Utilities.base64Encode(file.getBlob().getBytes()) };
}

/* ---------- 老師評分 ---------- */
function mark(d) {
  if (!pinOk(d.pin)) return { ok: false, error: 'pin' };
  const r = rows().find(x => x.id === d.id && x.active === true);
  if (!r) return { ok: false, error: '找不到作品' };
  const sh = sheet();
  if ('level' in d) sh.getRange(r._row, HEAD.indexOf('level') + 1).setValue(clean(d.level, 10));
  if ('star' in d) sh.getRange(r._row, HEAD.indexOf('star') + 1).setValue(!!d.star);
  if ('comment' in d) sh.getRange(r._row, HEAD.indexOf('comment') + 1).setValue(clean(d.comment, 100));
  return { ok: true };
}
