import admin from "../config/firebaseAdmin.js";

export const verifyFirebaseToken = async (token) => {
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded; // contains uid, email, name, provider info
    } catch (error) {
        console.error("Firebase token verification failed:", error.message);
        return null;
    }
};
