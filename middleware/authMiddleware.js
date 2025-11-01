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

// Generic protect for any role (Instructor | Student | Admin)
export const protectAny = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const role = decoded.role;
    if (role === "Instructor") {
      const user = await Instructor.findById(decoded.id);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      req.user = user; req.userType = "Instructor"; return next();
    }
    if (role === "Student") {
      const user = await Student.findById(decoded.id);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      req.user = user; req.userType = "Student"; return next();
    }
    if (role === "Admin") {
      const user = await Admin.findById(decoded.id);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      req.user = user; req.userType = "Admin"; return next();
    }
    return res.status(401).json({ message: "Invalid role" });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};