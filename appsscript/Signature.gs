// Signature.gs — server-side validation of the canvas PNG (FR-F) and Drive write (FR-G).
// Client canvas re-encode already strips metadata (canvas toDataURL output carries no EXIF);
// server still enforces PNG magic bytes + size limits and computes SHA-256 (FR-J).

function parseSignatureB64_(input) {
  let s = str_(input);
  if (!s) return { error: 'signature_missing' };
  const m = s.match(/^data:image\/png;base64,(.+)$/);
  if (m) s = m[1];
  if (/^data:/i.test(s)) return { error: 'signature_not_png' };
  let bytes;
  try {
    bytes = Utilities.base64Decode(s);
  } catch (e) {
    return { error: 'signature_not_base64' };
  }
  if (!bytes || bytes.length < CFG.MIN_SIGNATURE_BYTES) return { error: 'signature_too_small' };
  if (bytes.length > CFG.MAX_SIGNATURE_BYTES) return { error: 'signature_too_large' };
  const pngMagic = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < pngMagic.length; i++) {
    if (bytes[i] !== pngMagic[i]) return { error: 'signature_not_png' };
  }
  return { bytes: bytes, sha256: sha256Hex_(bytes) };
}

function eventDriveFolder_(ev) {
  const root = DriveApp.getFolderById(getProp_(CFG.DRIVE_ROOT_FOLDER_ID));
  const evId = str_(ev.event_id);
  const it = root.getFoldersByName(evId);
  return it.hasNext() ? it.next() : root.createFolder(evId);
}

// Writes the signature under a pseudonymous name: <receipt>.png (no NIM/name in the path).
function storeSignature_(ev, receiptId, type, bytes, sha256) {
  const folder = eventDriveFolder_(ev);
  const file = folder.createFile(Utilities.newBlob(bytes, 'image/png', receiptId + '.png'));
  file.setDescription(
    'event=' + str_(ev.event_id) + ';type=' + type + ';sha256=' + sha256 + ';schema=1'
  );
  return { file_id: file.getId(), url: file.getUrl() };
}
