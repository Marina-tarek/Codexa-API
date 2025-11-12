import FavouriteCourse from "../models/favouriteCourseModel.js";
import Course from "../models/courseModel.js";

// POST /api/favourites/toggle { courseId }
export const toggleFavourite = async (req, res) => {
	try {
		const { courseId } = req.body;
		if (!courseId) {
			return res.status(400).json({ message: "courseId is required" });
		}

		const existing = await FavouriteCourse.findOne({
			student: req.user._id,
			course: courseId,
		});
		if (existing) {
			await existing.deleteOne();
			return res.json({ status: "removed" });
		}

		const courseExists = await Course.exists({ _id: courseId });
		if (!courseExists) {
			return res.status(404).json({ message: "Course not found" });
		}

		const created = await FavouriteCourse.create({
			student: req.user._id,
			course: courseId,
		});

		return res.status(201).json({ status: "added", favourite: created });
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({ message: "Course already in favourites" });
		}
		return res.status(500).json({ message: error.message });
	}
};

// GET /api/favourites?page=1&limit=10
export const getMyFavourites = async (req, res) => {
	try {
		const page = Math.max(Number(req.query.page) || 1, 1);
		const limit = Math.max(Number(req.query.limit) || 10, 1);
		const skip = (page - 1) * limit;

		const [favourites, total] = await Promise.all([
			FavouriteCourse.find({ student: req.user._id })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("course", "title price coverImage url videos level status"),
			FavouriteCourse.countDocuments({ student: req.user._id }),
		]);

		return res.json({
			total,
			page,
			pageSize: favourites.length,
			items: favourites,
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};


