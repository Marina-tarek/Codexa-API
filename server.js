
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import cloudinary from "./utils/cloudinary.js";
import morgan from "morgan";

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
import reviewRoutes from "./routes/reviewRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import adminCommunityRoutes from "./routes/adminCommunityRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
dotenv.config();

const app = express();


// ✅ 2) إعدادات CORS الرسمية
const allowedOrigins = [
  "https://codexa-nine.vercel.app",
  "http://localhost:5000",
  "http://localhost:3000"
];


// ✅ إعدادات CORS صحيحة تمامًا
const corsOptions = {
  origin: function (origin, callback) {
    // if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
    // } else {
    //   callback(new Error("Not allowed by CORS"));
    // }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(morgan("dev"));

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
    app.use("/api/reviews", reviewRoutes);
    app.use("/api/todos", todoRoutes);
    app.use("/api/admin/community", adminCommunityRoutes);
    app.use("/api/analytics", analyticsRoutes);
    app.use("/api/favourites", favouriteRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/ai", aiRoutes)
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



