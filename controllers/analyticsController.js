import Course from "../models/courseModel.js";
import Payment from "../models/paymentModel.js";
import ToDo from "../models/todoModel.js";
import Instructor from "../models/instructorModel.js";
import Student from "../models/studentModel.js";
import Report from "../models/reportModel.js";

// GET /api/analytics/instructor
export const getInstructorAnalytics = async (req, res) => {
	try {
		const instructorId = req.user._id;

		const [totalCourses, publicCourses, privateCourses] = await Promise.all([
			Course.countDocuments({ instructor: instructorId }),
			Course.countDocuments({ instructor: instructorId, status: "public" }),
			Course.countDocuments({ instructor: instructorId, status: "private" }),
		]);

		const [todoDone, todoPending] = await Promise.all([
			ToDo.countDocuments({ owner: instructorId, ownerType: "Instructor", isDone: true }),
			ToDo.countDocuments({ owner: instructorId, ownerType: "Instructor", isDone: false }),
		]);

		const coursesWithStudents = await Course.find(
			{ instructor: instructorId },
			{ enrolledStudents: 1 }
		).lean();
		const uniqueStudentIds = new Set();
		for (const c of coursesWithStudents) {
			(c.enrolledStudents || []).forEach((sid) => uniqueStudentIds.add(String(sid)));
		}
		const totalStudents = uniqueStudentIds.size;

		const revenueAgg = await Payment.aggregate([
			{ $match: { instructor: instructorId, paymentStatus: "completed" } },
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]);
		const totalRevenue = revenueAgg[0]?.total || 0;

		return res.json({
			totalCourses,
			publicCourses,
			privateCourses,
			todoDone,
			todoPending,
			totalStudents,
			totalRevenue,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// GET /api/analytics/student
export const getStudentAnalytics = async (req, res) => {
	try {
		const studentId = req.user._id;

		const enrolledCourses = await Course.countDocuments({ enrolledStudents: studentId });
		const completedCourses = await Course.countDocuments({
			progress: { $elemMatch: { student: studentId, percentage: 100 } },
		});
		const inProgressCourses = Math.max(0, enrolledCourses - completedCourses);

		const [todoDone, todoPending] = await Promise.all([
			ToDo.countDocuments({ owner: studentId, ownerType: "Student", isDone: true }),
			ToDo.countDocuments({ owner: studentId, ownerType: "Student", isDone: false }),
		]);

		const paidAgg = await Payment.aggregate([
			{ $match: { student: studentId, paymentStatus: "completed" } },
			{ $group: { _id: null, total: { $sum: "$amount" } } },
		]);
		const totalPaid = paidAgg[0]?.total || 0;

		return res.json({
			enrolledCourses,
			completedCourses,
			inProgressCourses,
			todoDone,
			todoPending,
			totalPaid,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// GET /api/analytics/admin
export const getAdminAnalytics = async (req, res) => {
	try {
		const adminId = req.user._id;

		const [totalInstructors, totalStudents, adminTodoDone, adminTodoPending, totalReports] =
			await Promise.all([
				Instructor.countDocuments({}),
				Student.countDocuments({}),
				ToDo.countDocuments({ owner: adminId, ownerType: "Admin", isDone: true }),
				ToDo.countDocuments({ owner: adminId, ownerType: "Admin", isDone: false }),
				Report.countDocuments({}),
			]);

		return res.json({
			totalInstructors,
			totalStudents,
			adminTodoDone,
			adminTodoPending,
			totalReports,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};


