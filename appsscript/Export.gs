// Export.gs — builds a Google Doc replicating the DAFTAR HADIR.docx layout, then exports .docx.
// Table format per template: NO | NAMA PESERTA/NAMA MAHASISWA | NIM | TANDA TANGAN | KET

var DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
var TNR = 'Times New Roman';
// Signature canvas is exported at 2:1 aspect; table cell keeps that ratio.
var SIG_W = 110;
var SIG_H = 55;

function buildDaftarHadirDoc_(ev, docType, nim) {
  const evId = str_(ev.event_id);
  const titleBase =
    docType === 'AUDIENS_ALL'
      ? 'DAFTAR HADIR MAHASISWA SEBAGAI AUDIENS SEMINAR PROPOSAL SKRIPSI'
      : 'DAFTAR HADIR PESERTA SEMINAR PROPOSAL SKRIPSI';
  const title =
    titleBase +
    ' - ' +
    evId +
    (docType === 'PESERTA_ONE' ? ' - ' + nim : '') +
    ' - ' +
    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd-HHmm');

  let pesertaRows;
  let single = null;
  if (docType === 'PESERTA_ONE') {
    single = readAll_('peserta').filter(function (r) {
      return str_(r.event_id) === evId && str_(r.nim) === nim;
    })[0];
    if (!single) throw new Error('Peserta NIM ' + nim + ' tidak ditemukan pada event ' + evId);
    pesertaRows = [single];
  } else if (docType === 'PESERTA_ALL') {
    pesertaRows = readAll_('peserta')
      .filter(function (r) {
        return str_(r.event_id) === evId;
      })
      .sort(function (a, b) {
        return Number(a.no) - Number(b.no);
      });
  } else {
    pesertaRows = [];
  }

  const subs = readAll_('submissions').filter(function (r) {
    return str_(r.event_id) === evId;
  });
  const sigByNimType = {};
  subs.forEach(function (s) {
    sigByNimType[str_(s.nim) + '|' + str_(s.type)] = s;
  });

  const doc = DocumentApp.create(title);
  const body = doc.getBody();

  addCenteredHeader_(body, titleBase);
  addCenteredHeader_(body, str_(ev.program));
  addCenteredHeader_(body, str_(ev.faculty));
  addCenteredHeader_(body, 'SEMESTER ' + str_(ev.semester) + ' T.A. ' + str_(ev.academic_year));
  body.appendParagraph('');

  if (docType === 'PESERTA_ONE' || docType === 'PESERTA_ALL') {
    body.appendParagraph('Tanggal Ujian: ' + str_(ev.exam_date_label)).setFontFamily(TNR).setFontSize(11);
    body.appendParagraph('Tempat Ujian: ' + str_(ev.exam_place)).setFontFamily(TNR).setFontSize(11);
  } else {
    body.appendParagraph('Tanggal Ujian: ' + str_(ev.exam_date_label)).setFontFamily(TNR).setFontSize(11);
    body.appendParagraph('Tempat Ujian: ' + str_(ev.exam_place)).setFontFamily(TNR).setFontSize(11);
  }
  if (docType === 'PESERTA_ONE') {
    body.appendParagraph('Nama Peserta: ' + str_(single.nama)).setFontFamily(TNR).setFontSize(11);
    body.appendParagraph('NIM Peserta: ' + str_(single.nim)).setFontFamily(TNR).setFontSize(11);
  }
  body.appendParagraph('');

  const nameHeader = docType === 'AUDIENS_ALL' ? 'NAMA MAHASISWA' : 'NAMA PESERTA';
  const tableRows = [['NO', nameHeader, 'NIM', 'TANDA TANGAN', 'KET']];

  if (docType === 'AUDIENS_ALL') {
    const audiensRows = readAll_('audiens')
      .filter(function (r) {
        return str_(r.event_id) === evId;
      })
      .sort(function (a, b) {
        return Number(a.no) - Number(b.no);
      });
    if (audiensRows.length === 0) {
      for (let i = 1; i <= 10; i++) tableRows.push([String(i) + '.', '', '', '', '']);
      tableRows.push(['dst', '', '', '', '']);
    } else {
      audiensRows.forEach(function (a) {
        const s = sigByNimType[str_(a.nim) + '|AUDIENS'];
        tableRows.push([str_(a.no) + '.', str_(a.nama), str_(a.nim), '', s ? 'Hadir' : '—']);
      });
    }
  } else {
    pesertaRows.forEach(function (p) {
      const s = sigByNimType[str_(p.nim) + '|PESERTA'];
      tableRows.push([str_(p.no) + '.', str_(p.nama), str_(p.nim), '', s ? 'Hadir' : '—']);
    });
  }

  const table = body.appendTable(tableRows);
  table.setFontFamily(TNR).setFontSize(10);
  try {
    table.setColumnWidths([36, 175, 85, 115, 50]);
  } catch (ignored) {}
  for (let c = 0; c < 5; c++) {
    table.getCell(0, c).editAsText().setBold(true);
  }

  // Embed signature images in the TANDA TANGAN column.
  if (docType === 'AUDIENS_ALL') {
    const audiensRows = readAll_('audiens')
      .filter(function (r) {
        return str_(r.event_id) === evId;
      })
      .sort(function (a, b) {
        return Number(a.no) - Number(b.no);
      });
    audiensRows.forEach(function (a, idx) {
      const s = sigByNimType[str_(a.nim) + '|AUDIENS'];
      if (s) embedSignatureImage_(table.getCell(idx + 1, 3), str_(s.drive_file_id));
    });
  } else {
    pesertaRows.forEach(function (p, idx) {
      const s = sigByNimType[str_(p.nim) + '|PESERTA'];
      if (s) embedSignatureImage_(table.getCell(idx + 1, 3), str_(s.drive_file_id));
    });
  }

  body.appendParagraph('');
  body.appendParagraph('');
  body.appendParagraph('        Jakarta, ' + str_(ev.exam_date_label).replace(/^[A-Za-z]+,\s*/, ''))
    .setFontFamily(TNR)
    .setFontSize(11);
  body.appendParagraph('        Tanda Tangan                                   Nama Penguji:').setFontFamily(TNR).setFontSize(11);
  body.appendParagraph('');

  let p1;
  let p2;
  let p3;
  if (docType === 'PESERTA_ONE' && single) {
    p1 = str_(single.penguji_i);
    p2 = str_(single.penguji_ii);
    p3 = str_(single.penguji_iii);
  } else {
    p1 = str_(ev.penguji_i) || '..................................................';
    p2 = str_(ev.penguji_ii) || '..................................................';
    p3 = str_(ev.penguji_iii) || '..................................................';
  }
  body.appendParagraph('1.   ' + p1 + '.........................  ........................').setFontFamily(TNR).setFontSize(11);
  body.appendParagraph('').setFontFamily(TNR);
  body.appendParagraph('2.   ' + p2 + '.........................  .......................').setFontFamily(TNR).setFontSize(11);
  body.appendParagraph('').setFontFamily(TNR);
  body.appendParagraph('3.   ' + p3 + '.........................  .......................').setFontFamily(TNR).setFontSize(11);

  doc.saveAndClose();

  // Move the Google Doc next to the exported .docx inside the event folder.
  const root = DriveApp.getFolderById(getProp_(CFG.DRIVE_ROOT_FOLDER_ID));
  let evFolder = root.getFoldersByName(evId).hasNext()
    ? root.getFoldersByName(evId).next()
    : root.createFolder(evId);
  let outFolder = evFolder.getFoldersByName('exports').hasNext()
    ? evFolder.getFoldersByName('exports').next()
    : evFolder.createFolder('exports');

  const docFile = DriveApp.getFileById(doc.getId());
  outFolder.addFile(docFile);
  root.removeFile(docFile);

  // Built-in DriveApp export: Google Doc → .docx (no Advanced Drive service needed).
  const blob = docFile.getAs(DOCX_MIME);
  const docxFile = outFolder.createFile(blob.setName(title + '.docx'));

  return { file_id: docxFile.getId(), file_url: docxFile.getUrl(), title: title, doc_url: docFile.getUrl() };
}

function addCenteredHeader_(body, text) {
  body
    .appendParagraph(text)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontFamily(TNR)
    .setFontSize(12)
    .editAsText()
    .setBold(true);
}

function embedSignatureImage_(cell, driveFileId) {
  if (!driveFileId) return;
  try {
    const file = DriveApp.getFileById(driveFileId);
    cell.clear();
    const img = cell.appendImage(file.getBlob());
    img.setWidth(SIG_W).setHeight(SIG_H);
  } catch (ignored) {}
}
