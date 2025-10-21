// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import http from "http";
// import { Server } from "socket.io";
// import connectDB from "./config/db.js";
// import cloudinary from "./utils/cloudinary.js";

// // Routes imports
// import instructorRoutes from "./routes/instructorRoutes.js";
// import studentRoutes from "./routes/studentRoutes.js";
// import courseRoutes from "./routes/courseRoutes.js";
// import qaRoutes from "./routes/qaRoutes.js";
// import communityRoutes from "./routes/communityRoutes.js";
// import paymentRoutes from "./routes/paymentRoutes.js";
// import followRoutes from "./routes/followRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";

// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// app.use(cors());
// app.use(express.json());
// app.set("io", io);

// // ✅ اتصال MongoDB أولاً
// const startServer = async () => {
//   try {
//     console.log("🧠 Connecting to MongoDB Atlas...");
//     await connectDB();
//     console.log("✅ MongoDB connected successfully");

//     // ✅ اختبار Cloudinary (اختياري)
//     try {
//       await cloudinary.api.ping();
//       console.log("✅ Cloudinary connected successfully");
//     } catch (error) {
//       console.error("⚠️ Cloudinary connection failed:", error.message);
//     }

//     // ✅ بعد الاتصال بنجاح نفعّل الـ routes
//     app.use("/api/instructors", instructorRoutes);
//     app.use("/api/students", studentRoutes);
//     app.use("/api/courses", courseRoutes);
//     app.use("/api/questions", qaRoutes);
//     app.use("/api/community", communityRoutes);
//     app.use("/api/payments", paymentRoutes);
//     app.use("/api/follows", followRoutes);
//     app.use("/api/notifications", notificationRoutes);
//     app.use("/api/admin", adminRoutes);

//     io.on("connection", (socket) => {
//       console.log("🟢 User connected:", socket.id);
//       socket.on("disconnect", () => console.log("🔴 User disconnected:", socket.id));
//     });

//     const PORT = process.env.PORT || 5000;
//     server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//   } catch (err) {
//     console.error("❌ Failed to start server:", err.message);
//   }
// };

// startServer();
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import cloudinary from "./utils/cloudinary.js";

// ✅ Routes imports
import instructorRoutes from "./routes/instructorRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import qaRoutes from "./routes/qaRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

// ✅ 1) إضافة الهيدرز يدويًا كتحصين إضافي ضد مشاكل Railway
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ✅ 2) إعدادات CORS الرسمية
const allowedOrigins = [
  "https://codexa-nine.vercel.app/", // 🔹 غيّريها إلى رابط الواجهة الأمامية الفعلي بعد النشر
  "http://localhost:5000",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// ✅ 3) إعداد Socket.IO مع نفس إعدادات CORS
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });
app.set("io", io);

// ✅ 4) تشغيل السيرفر بعد التأكد من اتصال MongoDB و Cloudinary
const startServer = async () => {
  try {
    console.log("🧠 Connecting to MongoDB Atlas...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // ✅ اختبار Cloudinary (اختياري)
    try {
      await cloudinary.api.ping();
      console.log("✅ Cloudinary connected successfully");
    } catch (error) {
      console.error("⚠️ Cloudinary connection failed:", error.message);
    }

    // ✅ تفعيل الـ routes بعد نجاح الاتصال
    app.use("/api/instructors", instructorRoutes);
    app.use("/api/students", studentRoutes);
    app.use("/api/courses", courseRoutes);
    app.use("/api/questions", qaRoutes);
    app.use("/api/community", communityRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/follows", followRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/admin", adminRoutes);

    // ✅ إعداد Socket.IO
    io.on("connection", (socket) => {
      console.log("🟢 User connected:", socket.id);
      socket.on("disconnect", () =>
        console.log("🔴 User disconnected:", socket.id)
      );
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
  }
};

startServer();
