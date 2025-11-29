import express from "express";
import {
    loginAdmin,
    getDashboardStats,
    getAllStudents,
    getStudentById,
    getAllInstructors,
    getInstructorById,
    getAllCourses,
    getCourseById,
    deleteCourseByAdmin,
    deleteStudent,
    deleteInstructor,
    getRecentActivity

} from "../controllers/adminController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth
router.post("/login", loginAdmin);

// Dashboard
router.get("/stats", protectAdmin, getDashboardStats);

// Student routes
router.get("/students", protectAdmin, getAllStudents);
router.get("/students/:id", protectAdmin, getStudentById);
router.delete("/students/:id", protectAdmin, deleteStudent);

// Instructor routes
router.get("/instructors", protectAdmin, getAllInstructors);
router.get("/instructors/:id", protectAdmin, getInstructorById);
router.delete("/instructors/:id", protectAdmin, deleteInstructor);

// Course routes
router.get("/courses", protectAdmin, getAllCourses);
router.get("/courses/:id", protectAdmin, getCourseById);
router.delete("/courses/:id", protectAdmin, deleteCourseByAdmin);

// post routes
router.get("/activity", protectAdmin, getRecentActivity);


export default router;