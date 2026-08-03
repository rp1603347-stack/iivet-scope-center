
const WEB_APP_URL = 'PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE';

const ISC = (function () {

  async function findCertificate(enrollmentNo, dob) {
    if (!WEB_APP_URL || WEB_APP_URL.indexOf('PASTE_') === 0) {
      throw new Error('Certificate lookup isn\'t configured yet — see CERTIFICATE-SETUP.md.');
    }

    const url = WEB_APP_URL
      + '?enroll=' + encodeURIComponent((enrollmentNo || '').trim())
      + '&dob=' + encodeURIComponent((dob || '').trim());

    let res;
    try {
      res = await fetch(url);
    } catch (err) {
      throw new Error('Could not reach the verification service. Please check your connection and try again.');
    }

    if (!res.ok) {
      throw new Error('Verification service returned an error (' + res.status + ').');
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.found ? data.record : null;
  }

  return { findCertificate };
})();
