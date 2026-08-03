/**
 * IIVET Scope Center — Certificate Verification backend
 *
 * This file is NOT run by the website directly. Copy/paste its contents
 * into the Apps Script editor bound to your Google Sheet:
 *   Google Sheet → Extensions → Apps Script → paste this in → Save
 *   Deploy → New deployment → type: Web app
 *     Execute as: Me
 *     Who has access: Anyone
 *   Copy the resulting /exec URL into js/certificates.js (WEB_APP_URL).
 *
 * The Sheet itself stays PRIVATE — only this script (running as you)
 * can read it. The web app only ever returns ONE matched row, never
 * the full sheet — there is no "list all certificates" endpoint.
 */

const SHEET_NAME = 'Certificates'; // must match your sheet tab name

function doGet(e) {
  try {
    const enrollmentNo = (e.parameter.enroll || '').trim().toUpperCase();
    const dob = (e.parameter.dob || '').trim(); // expected format YYYY-MM-DD

    if (!enrollmentNo || !dob) {
      return jsonResponse({ error: 'Missing enroll or dob parameter' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ error: 'Sheet tab "' + SHEET_NAME + '" not found' });
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const col = name => headers.indexOf(name);

    const idxEnroll = col('EnrollmentNo');
    const idxDob = col('DOB');
    const idxName = col('Name');
    const idxCourse = col('Course');
    const idxIssue = col('IssueDate');
    const idxGrade = col('Grade');
    const idxImg = col('CertImageURL');

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowEnroll = String(row[idxEnroll]).trim().toUpperCase();
      const rowDob = formatDate(row[idxDob]);

      if (rowEnroll === enrollmentNo && rowDob === dob) {
        return jsonResponse({
          found: true,
          record: {
            enrollmentNo: row[idxEnroll],
            name: row[idxName],
            course: row[idxCourse],
            dob: rowDob,
            issueDate: formatDate(row[idxIssue]),
            grade: row[idxGrade],
            fileData: idxImg > -1 ? row[idxImg] : ''
          }
        });
      }
    }

    return jsonResponse({ found: false });
  } catch (err) {
    return jsonResponse({ error: 'Server error', details: String(err) });
  }
}

function formatDate(value) {
  if (!value) return '';
  const d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d)) return String(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function jsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
