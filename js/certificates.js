const ISC = (function () {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const MAX_FILE_BYTES = 700 * 1024; // Keep under Firestore's 1MB document limit

  /* ---------------- helpers ---------------- */

  function normalize(s) {
    return (s || "").trim().toLowerCase();
  }

  // Use Registration Number as the unique primary key document ID
  function makeCertId(registrationNo) {
    return normalize(registrationNo).replace(/[^a-z0-9-]/g, "_");
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

  function listCertificates() {
    return db.collection("certificates").orderBy("createdAt", "desc").get()
      .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function addCertificate(record, file) {
    if (!record.registrationNo) {
      throw new Error("Registration number is required.");
    }

    const id = makeCertId(record.registrationNo);
    const doc = {
      name: record.name,
      registrationNo: record.registrationNo,
      course: record.course,
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

    // Using .set() with the registration ID prevents duplicate registration numbers
    await db.collection("certificates").doc(id).set(doc);
    return { id, ...doc };
  }

  function deleteCertificate(id) {
    return db.collection("certificates").doc(id).delete();
  }

  async function findCertificate(registrationNo) {
    const id = makeCertId(registrationNo);
    const snap = await db.collection("certificates").doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }

  return {
    login, logout, onAuthChange, currentUser,
    listCertificates, addCertificate, deleteCertificate, findCertificate
  };
})();
