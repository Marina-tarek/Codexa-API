import Certificate from "../models/certificateModel.js";
import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import cloudinary from "../utils/cloudinary.js";
import stream from "stream";

// Helper: check if student completed course (>=100%)
const hasCompletedCourse = (studentDoc, courseId) => {
  const p = (studentDoc.progress || []).find((x) => x.course?.toString() === courseId.toString());
  return p && (p.percent || 0) >= 100;
};

// POST /api/certificates/generate/:courseId  (Student only)
export const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const student = await Student.findById(req.user._id);
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!hasCompletedCourse(student, courseId)) {
      return res.status(400).json({ message: "Course not completed" });
    }

    // if exists, return it
    let existing = await Certificate.findOne({ student: req.user._id, course: courseId });
    if (existing) return res.json(existing);

    const certificateId = crypto.randomBytes(8).toString("hex");

    // Generate QR (data URL) that points to verification endpoint
    const verifyUrl = `${process.env.PUBLIC_BASE_URL || "http://localhost:5000"}/api/certificates/verify/${certificateId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });

    // Prepare PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Create a passthrough stream to upload directly to Cloudinary
    const passthrough = new stream.PassThrough();
    const uploadPromise = new Promise((resolve, reject) => {
      const cldStream = cloudinary.uploader.upload_stream(
        { folder: "certificates", resource_type: "raw", public_id: `certificate_${certificateId}`, format: "pdf" },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
      passthrough.pipe(cldStream);
    });

    // Draw watermark
    doc.fontSize(60).fillColor("#d4af37").opacity(0.15).rotate(45, { origin: [300, 400] }).text("CERTIFIED", 100, 200, { align: "center" });
    doc.rotate(-45).opacity(1).fillColor("#000000");

    // Header
    doc.fontSize(24).text((process.env.SITE_NAME || "Your Academy"), { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(18).text("Certificate of Completion", { align: "center" });
    doc.moveDown(1.5);

    // Body
    doc.fontSize(14).text(`This certifies that`, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(22).text(`${student.name}`, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(14).text(`has successfully completed the course`, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(18).text(`${course.title}`, { align: "center" });
    doc.moveDown(0.5);
    const issued = new Date().toLocaleDateString();
    doc.fontSize(12).text(`Issued on: ${issued}`, { align: "center" });
    doc.moveDown(1.2);

    // QR image
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(qrBase64, "base64");
    const qrX = 230; // center-ish
    doc.image(qrBuffer, qrX, doc.y, { width: 150, align: "center" });
    doc.moveDown(2.2);
    doc.fontSize(10).fillColor("#666").text(`Verify: ${verifyUrl}`, { align: "center" });

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).fillColor("#999").text(`Certificate ID: ${certificateId}`, { align: "center" });

    // Finalize
    doc.end();
    doc.pipe(passthrough);

    const uploadResult = await uploadPromise;

    // Optionally upload QR as well (data URI supported)
    const qrUpload = await cloudinary.uploader.upload(qrDataUrl, { folder: "certificates/qr" });

    const cert = await Certificate.create({
      certificateId,
      student: req.user._id,
      course: courseId,
      pdfUrl: uploadResult.secure_url,
      qrUrl: qrUpload.secure_url,
    });

    res.status(201).json(cert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/certificates/mine  (Student)
export const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ student: req.user._id }).populate("course", "title");
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/certificates/student/:studentId  (public)
export const getStudentCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ student: req.params.studentId }).populate("course", "title");
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/certificates/view/:certificateId  (public)
export const viewCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).populate("student", "name").populate("course", "title");
    if (!cert) return res.status(404).json({ message: "Not found" });
    res.json(cert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/certificates/verify/:certificateId  (QR target)
export const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) return res.json({ valid: false });
    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


