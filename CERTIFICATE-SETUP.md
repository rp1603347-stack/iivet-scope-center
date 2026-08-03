# Certificate verification — setup (Google Sheets, no backend hosting)

There is no admin dashboard on this site. To issue a certificate you add a
row directly in a Google Sheet. `verify.html` looks up a single row through
a small Google Apps Script "web app" that sits in front of the Sheet, so the
Sheet itself never has to be shared or made public.

```
Browser (verify.html) → fetch() → Apps Script web app → reads private Sheet → returns ONE matching row
```

## 1. Create the Google Sheet
1. Create a new Google Sheet. Rename the first tab to **Certificates**
   (must match `SHEET_NAME` in `google-apps-script/Code.gs`).
2. Add this header row exactly:

   | EnrollmentNo | DOB | Name | Course | IssueDate | Grade | CertImageURL |
   |---|---|---|---|---|---|---|

   - `DOB` and `IssueDate` — use real Date cells (Format → Number → Date) or
     `YYYY-MM-DD` text, either works.
   - `CertImageURL` — optional. See step 4 for how to fill this in.
3. Add one row per student/certificate.
4. Sharing → make sure it's **Restricted** (only you). Do **not** share it
   with "Anyone with the link" — the Sheet is meant to stay private.

## 2. Add the Apps Script backend
1. In the Sheet: **Extensions → Apps Script**.
2. Delete the placeholder code and paste in the contents of
   `google-apps-script/Code.gs` from this repo.
3. Click **Save**, then **Deploy → New deployment**.
4. Type: **Web app**. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the permissions Google asks for (it's your
   own script, accessing your own Sheet), then copy the **Web app URL**
   (ends in `/exec`).

## 3. Connect the site
1. Open `js/certificates.js`.
2. Replace `PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE` with the `/exec` URL from
   step 2.5.
3. Commit and push (or re-upload) — `verify.html` will now look certificates
   up from your Sheet.

## Adding a certificate image
Upload the certificate (JPG/PNG/PDF) to Google Drive, right-click → **Share**
→ set it to "Anyone with the link can view", then paste that file's direct
link into the `CertImageURL` column for that row. The Sheet itself stays
private even though that one image file is link-shared — each certificate
image is shared individually, not the whole spreadsheet.

## Notes on the security model
- The Sheet is never shared — only the Apps Script (running under your own
  Google identity) can read it.
- The Apps Script URL only ever returns **one exact-match row** for a given
  enrollment number + DOB pair — there's no endpoint that lists or dumps the
  full sheet, so a visitor can only ever pull up their own certificate.
- The `/exec` URL is visible in browser network requests, so treat it like a
  lightly-protected public endpoint, not a secret. If you want to make casual
  scraping/guessing harder, two easy upgrades:
  1. Add a third fixed query parameter (a random token) that `doGet` checks
     before doing any lookup.
  2. Add basic rate-limiting using Apps Script's `CacheService`.
  Neither is included by default to keep the setup simple — ask if you'd
  like either added.
- Apps Script web apps on a free Google account have a daily execution quota
  (in the tens of thousands of requests/day), which is far more than a
  franchise study centre's verification traffic will ever need.
