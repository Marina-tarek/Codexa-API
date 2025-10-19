import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
    fs.readFileSync(new URL("./codexa-api-firebase-adminsdk-fbsvc-41abb3ba4c.json", import.meta.url))
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;