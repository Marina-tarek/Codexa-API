import mongoose from "mongoose";

const favouriteCourseSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Student",
			required: true,
		},
		course: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Course",
			required: true,
		},
	},
	{ timestamps: true }
);

favouriteCourseSchema.index({ student: 1, course: 1 }, { unique: true });

const FavouriteCourse = mongoose.model("FavouriteCourse", favouriteCourseSchema);
export default FavouriteCourse;


