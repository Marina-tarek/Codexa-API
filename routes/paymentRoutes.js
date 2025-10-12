// // server.js
// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import dotenv from "dotenv";
// import cors from "cors";
// import connectDB from "./config/db.js";

// dotenv.config();
// connectDB();

// import instructorRoutes from "./routes/instructorRoutes.js";
// import studentRoutes from "./routes/studentRoutes.js";
// import courseRoutes from "./routes/courseRoutes.js";
// import qaRoutes from "./routes/qaRoutes.js";
// import communityRoutes from "./routes/communityRoutes.js";
// import purchaseRoutes from "./routes/purchaseRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";
// import followRoutes from "./routes/followRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import recommendationRoutes from "./routes/recommendationRoutes.js";

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use("/uploads", express.static("uploads"));

// app.use("/api/instructors", instructorRoutes);
// app.use("/api/students", studentRoutes);
// app.use("/api/courses", courseRoutes);
// app.use("/api/qa", qaRoutes);
// app.use("/api/community", communityRoutes);
// app.use("/api/purchase", purchaseRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/follow", followRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/recommendations", recommendationRoutes);

// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET", "POST"] } });

// io.on("connection", (socket) => {
//   console.log("Socket connected", socket.id);
//   socket.on("join", ({ userId }) => {
//     if (userId) {
//       socket.join(userId);
//       console.log(Socket ${socket.id} joined room ${userId});
//     }
//   });
//   socket.on("disconnect", () => {
//     console.log("Socket disconnected", socket.id);
//   });
// });

// app.set("io", io);

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(Server running on port ${PORT}));
import express from "express";
import { buyCourse } from "../controllers/paymentController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/buy", protectStudent, buyCourse);

export default router;