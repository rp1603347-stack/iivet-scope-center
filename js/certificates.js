// IIVET SCROP FRANCE — Certificate store + admin auth
// Backed by Firebase Authentication + Firestore, so GitHub Pages only ever
// ships static files: no password, no certificate data, and no database
// lives in this repo. Requires js/firebase-config.js to be loaded first.
//
// Admin accounts are NOT self-service on purpose — create the one admin
// user yourself in Firebase Console → Authentication → Users → Add user.
// That keeps "who can log in" something only you control, not something
// baked into the public JS.

const ISC = (function () {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const MAX_FILE_BYTES = 700 * 1024; // stay comfortably under Firestore's 1MB doc limit

  /* ---------------- helpers ---------------- */

  function normalize(s) {
    return (s || "").trim().toLowerCase();
  }

  // Deterministic composite key: knowing the exact enrollment number AND
  // DOB is required to reconstruct this ID, which is what makes the
  // "allow get: if true; allow list: if false;" Firestore rule safe.
  function makeCertId(enrollmentNo, dob) {
    return normalize(enrollmentNo).replace(/[^a-z0-9-]/g, "_") + "__" + dob;
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ---------------- admin auth ---------------- */

  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password)
      .then(() => ({ ok: true }))
      .catch(err => ({ ok: false, error: mapAuthError(err) }));
  }

  function logout() {
    return auth.signOut();
  }

  function onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  }

  function currentUser() {
    return auth.currentUser;
  }

  function mapAuthError(err) {
    switch (err.code) {
      case "auth/invalid-email":
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait a few minutes and try again.";
      default:
        return "Could not sign in (" + err.code + ").";
    }
  }

  /* ---------------- certificate records ---------------- */

  // Admin dashboard listing — requires an authenticated admin session;
  // enforced server-side by Firestore rules, not just hidden in the UI.
  function listCertificates() {
    return db.collection("certificates").orderBy("createdAt", "desc").get()
      .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function addCertificate(record, file) {
    const id = makeCertId(record.enrollmentNo, record.dob);
    const doc = {
      name: record.name,
      enrollmentNo: record.enrollmentNo,
      dob: record.dob,
      course: record.course,
      issueDate: record.issueDate,
      grade: record.grade || "",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: (currentUser() && currentUser().email) || "admin"
    };

    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error("File is too large — please keep it under 700 KB.");
      }
      doc.fileData = await fileToDataURL(file);
      doc.fileType = file.type;
      doc.fileName = file.name;
    }

    await db.collection("certificates").doc(id).set(doc);
    return { id, ...doc };
  }

  function deleteCertificate(id) {
    return db.collection("certificates").doc(id).delete();
  }

  // Public lookup used by verify.html — reads exactly one document by its
  // composite ID, which only resolves if both values are correct.
  async function findCertificate(enrollmentNo, dob) {
    const id = makeCertId(enrollmentNo, dob);
    const snap = await db.collection("certificates").doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }

  return {
    login, logout, onAuthChange, currentUser,
    listCertificates, addCertificate, deleteCertificate, findCertificate
  };
})();
