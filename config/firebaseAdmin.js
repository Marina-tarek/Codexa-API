import admin from "firebase-admin";

if (!admin.apps.length) {
    // Load credentials from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
    admin.initializeApp({
        credential: admin.credential.cert({
            ...serviceAccount,
            private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
        }),
    });
    console.log("✅ Firebase Admin initialized successfully.");
}

export default admin;