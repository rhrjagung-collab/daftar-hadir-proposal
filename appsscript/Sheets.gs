// Sheets.gs — Google Sheets as the metadata store (report: replaceable DB layer).

var TABLES = {
  events: [
    'event_id', 'name', 'academic_year', 'semester', 'program', 'faculty',
    'exam_date_label', 'exam_place', 'timezone', 'privacy_notice_version',
    'drive_folder_id', 'status', 'penguji_i', 'penguji_ii', 'penguji_iii',
    'koordinator_nama', 'koordinator_nip', 'created_at'
  ],
  peserta: [
    'event_id', 'no', 'nim', 'nama', 'peminatan', 'judul',
    'pembimbing', 'pendamping', 'penguji_utama',
    'penguji_i', 'penguji_ii', 'penguji_iii'
  ],
  audiens: ['event_id', 'no', 'nim', 'nama', 'received_at'],
  submissions: [
    'receipt_id', 'event_id', 'type', 'nim', 'nama', 'sha256',
    'drive_file_id', 'status', 'notice_version', 'notice_ack',
    'attendance_confirmed', 'idempotency_key', 'received_at', 'stored_at'
  ],
  sessions: ['token_hash', 'scope', 'ref', 'created_at', 'expires_at'],
  ratelimit: ['key', 'window_start', 'count'],
  audit: ['ts', 'actor', 'action', 'detail']
};

function ensureTables_() {
  const ss = SpreadsheetApp.openById(getProp_(CFG.DB_SPREADSHEET_ID));
  Object.keys(TABLES).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = TABLES[name];
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  return ss;
}

function sheet_(name) {
  const ss = SpreadsheetApp.openById(getProp_(CFG.DB_SPREADSHEET_ID));
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" not found. Run setup() first.');
  return sh;
}

function readAll_(name) {
  const sh = sheet_(name);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) return [];
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const raw = values[i];
    if (raw.join('') === '') continue;
    const o = {};
    for (let c = 0; c < headers.length; c++) o[headers[c]] = raw[c];
    rows.push(o);
  }
  return rows;
}

function appendRow_(name, obj) {
  const sh = sheet_(name);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const row = headers.map(function (h) {
    const v = obj[h];
    return v === undefined || v === null ? '' : v;
  });
  sh.appendRow(row);
}

function countRows_(name, predicate) {
  return readAll_(name).filter(predicate).length;
}
