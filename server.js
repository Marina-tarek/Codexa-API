// // // server.js
// // import express from "express";
// // import http from "http";
// // import { Server } from "socket.io";
// // import dotenv from "dotenv";
// // import cors from "cors";
// // import connectDB from "./config/db.js";

// // dotenv.config();
// // connectDB();

// // import instructorRoutes from "./routes/instructorRoutes.js";
// // import studentRoutes from "./routes/studentRoutes.js";
// // import courseRoutes from "./routes/courseRoutes.js";
// // import qaRoutes from "./routes/qaRoutes.js";
// // import communityRoutes from "./routes/communityRoutes.js";
// // import purchaseRoutes from "./routes/purchaseRoutes.js";
// // import notificationRoutes from "./routes/notificationRoutes.js";
// // import followRoutes from "./routes/followRoutes.js";
// // import adminRoutes from "./routes/adminRoutes.js";
// // import recommendationRoutes from "./routes/recommendationRoutes.js";

// // const app = express();
// // app.use(cors());
// // app.use(express.json());
// // app.use("/uploads", express.static("uploads"));

// // app.use("/api/instructors", instructorRoutes);
// // app.use("/api/students", studentRoutes);
// // app.use("/api/courses", courseRoutes);
// // app.use("/api/qa", qaRoutes);
// // app.use("/api/community", communityRoutes);
// // app.use("/api/purchase", purchaseRoutes);
// // app.use("/api/notifications", notificationRoutes);
// // app.use("/api/follow", followRoutes);
// // app.use("/api/admin", adminRoutes);
// // app.use("/api/recommendations", recommendationRoutes);

// // const server = http.createServer(app);
// // const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET", "POST"] } });

// // io.on("connection", (socket) => {
// //   console.log("Socket connected", socket.id);
// //   socket.on("join", ({ userId }) => {
// //     if (userId) {
// //       socket.join(userId);
// //       console.log(`Socket ${socket.id} joined room ${userId}`);
// //     }
// //   });
// //   socket.on("disconnect", () => {
// //     console.log("Socket disconnected", socket.id);
// //   });
// // });

// // app.set("io", io);

// // const PORT = process.env.PORT || 5000;
// // server.listen(PORT, () => console.log(`Server running on port ${process.env.PORT}`));

// import express from "express";
// import http from "http";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv from "dotenv";
// import { Server } from "socket.io";

// import instructorRoutes from "./routes/instructorRoutes.js";
// import studentRoutes from "./routes/studentRoutes.js";
// import courseRoutes from "./routes/courseRoutes.js";
// import communityRoutes from "./routes/communityRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";

// dotenv.config();
// const app = express();
// const server = http.createServer(app);

// // Real-time notifications
// const io = new Server(server, { cors: { origin: "*" } });
// app.set("io", io);

// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static("uploads"));

// // Routes
// app.use("/api/instructors", instructorRoutes);
// app.use("/api/students", studentRoutes);
// app.use("/api/courses", courseRoutes);
// app.use("/api/community", communityRoutes);
// app.use("/api/admin", adminRoutes);

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("✅ MongoDB Atlas connected successfully"))
//   .catch((err) => console.log("❌ MongoDB connection error:", err.message));

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

import express from "express";
import dotenv from "dotenv";
dotenv.config();
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);
import cors from "cors";
import connectDB  from "./config/db.js";
import http from "http";
import { Server } from "socket.io";

// Routes imports
import instructorRoutes from "./routes/instructorRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import qaRoutes from "./routes/qaRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";


console.log("ENV TEST:", process.env.CLOUDINARY_CLOUD_NAME);
import cloudinary from "./utils/cloudinary.js";

// اختبار الاتصال بـ Cloudinary
try {
  console.log("🔍 Testing Cloudinary connection...");
  console.log("Cloud Name from .env:", process.env.CLOUDINARY_CLOUD_NAME);

  cloudinary.api.ping()
    .then(() => console.log("✅ Cloudinary connected successfully!"))
    .catch(err => console.error("❌ Cloudinary connection failed:", err.message));
} catch (error) {
  console.error("❌ Error loading Cloudinary:", error.message);
}

// ====
connectDB();




const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.set("io", io);

app.use("/api/instructors", instructorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/questions", qaRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`server running on port ${PORT}`));