// // config/cloudinary.js
// import { v2 as cloudinary } from "cloudinary";
// import dotenv from "dotenv";
// dotenv.config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });
// // test connection
// (async () => {
//   try {
//     console.log("🔍 Testing Cloudinary connection...");
//     console.log("Cloud Name from .env:", process.env.CLOUDINARY_CLOUD_NAME);
//     const result = await cloudinary.api.ping();
//     console.log("✅ Cloudinary connected successfully:", result.status);
//   } catch (err) {
//     console.error("❌ Cloudinary connection failed:", err.message);
//   }
// })();
// export default cloudinary;
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ✅ Debug info — just to confirm .env is being read
console.log("🔍 CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("🔍 API_KEY:", process.env.CLOUDINARY_API_KEY?.slice(0, 6) + "**");
console.log("🔍 API_SECRET:", process.env.CLOUDINARY_API_SECRET?.slice(0, 4) + "**");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  try {
    console.log("🧪 Testing Cloudinary API ping...");
    const res = await cloudinary.api.ping();
    console.log("✅ Cloudinary connected successfully:", res.status);
  } catch (err) {
    console.error("❌ Cloudinary connection failed:");
    console.error(err);
  }
})();

export default cloudinary;