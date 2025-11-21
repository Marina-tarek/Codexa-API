import express from "express";
import { generateCertificate, getMyCertificates, getStudentCertificates, viewCertificate, verifyCertificate } from "../controllers/certificateController.js";
import { protectStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate/:courseId", protectStudent, generateCertificate);
router.get("/mine", protectStudent, getMyCertificates);
router.get("/student/:studentId", getStudentCertificates);
router.get("/view/:certificateId", viewCertificate);
router.get("/verify/:certificateId", verifyCertificate);

export default router;



