// // middleware/authMiddleware.js
// import jwt from "jsonwebtoken";
// import Instructor from "../models/instructorModel.js";
// import Student from "../models/studentModel.js";

// export const protect = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization?.startsWith("Bearer")) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       // decoded: { id, role }
//       if (decoded.role === "Instructor") {
//         const user = await Instructor.findById(decoded.id).select("-password");
//         if (!user || !user.isActive) return res.status(401).json({ message: "Not authorized" });
//         req.user = user;
//         req.userType = "Instructor";
//       } else {
//         const user = await Student.findById(decoded.id).select("-password");
//         if (!user || !user.isActive) return res.status(401).json({ message: "Not authorized" });
//         req.user = user;
//         req.userType = "Student";
//       }
//       next();
//     } catch (err) {
//       return res.status(401).json({ message: "Token failed" });
//     }
//   } else {
//     return res.status(401).json({ message: "No token provided" });
//   }
// };

// export const protectAdmin = (req, res, next) => {
//   if (!req.user) return res.status(401).json({ message: "Not authorized" });
//   if (req.userType === "Instructor" && req.user.isAdmin) return next();
//   return res.status(403).json({ message: "Admin access only" });
// };

import jwt from "jsonwebtoken";
import Instructor from "../models/instructorModel.js";
import Student from "../models/studentModel.js";
import Admin from "../models/adminModel.js";

export const protectInstructor = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Instructor.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    req.userType = "Instructor";
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const protectStudent = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Student.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    req.userType = "Student";
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Admin.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    req.userType = "Admin";
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};