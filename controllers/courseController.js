// import Course from "../models/courseModel.js";
// import Instructor from "../models/instructorModel.js";
// import Student from "../models/studentModel.js";
// import cloudinary from "../utils/cloudinary.js";

// // إنشاء كورس جديد (يُستخدم بالفعل من داخل instructorController)
// export const createCourse = async (req, res) => {
//   try {
//     const { title, description, price, category } = req.body;
//     let videoUrl = null;

//     if (req.file) {
//       const uploadRes = await cloudinary.uploader.upload(req.file.path, { resource_type: "video" });
//       videoUrl = uploadRes.secure_url;
//     }

//     const newCourse = await Course.create({
//       instructor: req.user._id,
//       title,
//       description,
//       price,
//       category,
//       videoUrl
//     });

//     res.json(newCourse);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // عرض كل الكورسات
// export const getAllCourses = async (req, res) => {
//   try {
//     const courses = await Course.find().populate("instructor", "name profileImage");
//     res.json(courses);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // عرض تفاصيل كورس محدد
// export const getCourseById = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id)
//       .populate("instructor", "name profileImage")
//       .populate("students", "name profileImage");
//     if (!course) return res.status(404).json({ message: "Course not found" });
//     res.json(course);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // حذف كورس (Admin فقط)
// export const deleteCourse = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id);
//     if (!course) return res.status(404).json({ message: "Course not found" });
//     await course.deleteOne();
//     res.json({ message: "Course deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
///======
import Course from "../models/courseModel.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";

// 🆕 إنشاء كورس جديد مع أكثر من فيديو
export const createCourse = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const instructorId = req.user._id;

    const uploadedVideos = [];

    // رفع الفيديوهات
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: "video",
          folder: "courses_videos",
        });

        uploadedVideos.push({
          title: file.originalname,
          url: result.secure_url,
          public_id: result.public_id,
        });

        fs.unlinkSync(file.path);
      }
    }

    const course = await Course.create({
      instructor: instructorId,
      title,
      description,
      price,
      category,
      videos: uploadedVideos,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🆕 إضافة فيديوهات جديدة لكورس موجود
export const addVideosToCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newVideos = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "video",
        folder: "courses_videos",
      });

      newVideos.push({
        title: file.originalname,
        url: result.secure_url,
        public_id: result.public_id,
      });

      fs.unlinkSync(file.path);
    }

    course.videos.push(...newVideos);
    await course.save();

    res.json({ message: "Videos added successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🆕 حذف فيديو واحد من كورس
export const deleteVideoFromCourse = async (req, res) => {
  try {
    const { courseId, videoId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const video = course.videos.id(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    // حذف من Cloudinary
    await cloudinary.uploader.destroy(video.public_id, { resource_type: "video" });

    // حذف من المصفوفة
    course.videos = course.videos.filter(v => v._id.toString() !== videoId);
    await course.save();

    res.json({ message: "Video deleted successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🆕 حذف كورس بالكامل من MongoDB + Cloudinary
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    for (const video of course.videos) {
      if (video.public_id) {
        await cloudinary.uploader.destroy(video.public_id, { resource_type: "video" });
      }
    }

    await course.deleteOne();
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email") // نعرض بيانات المدرب الأساسية
      .sort({ createdAt: -1 }); // الأحدث أولاً
    res.status(200).json(courses);
  } catch (error) {
    console.error("❌ Error fetching courses:", error);
    res.status(500).json({ message: "Error fetching courses" });
  }
};
// // عرض تفاصيل كورس محدد
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name profileImage");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//تحديث بيانات كورس
// export const updateCourse = async (req, res) => {
//   try {
//     const { title, description, price } = req.body;

//     const updatedCourse = await Course.findOneAndUpdate(
//       { _id: req.params.id, instructor: req.user._id }, // تأكيد إن اللي بيحدث هو صاحب الكورس
//       { $set: { title, description, price } },
//       { new: true } // يرجّع النسخة الجديدة بعد التحديث
//     );

//     if (!updatedCourse) {
//       return res.status(404).json({ message: "Course not found or not authorized" });
//     }

//     res.json({ message: "✅ Course updated successfully", course: updatedCourse });
//   } catch (error) {
//     console.error("❌ Error updating course:", error);
//     res.status(500).json({ message: error.message });
//   }
//   console.log("Old course:", course);
// console.log("New data:", { title, description, price });
// };

// 🆕 تحديث بيانات كورس
export const updateCourse = async (req, res) => {
  try {
    const { title, description, price, category } = req.body; // ✅ أضفنا category

    // نجيب الكورس الأول
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // تأكيد إن المستخدم هو صاحب الكورس
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    // نطبع القيم القديمة والجديدة
    console.log("Old course:", course);
    console.log("New data:", { title, description, price, category });

    // ✅ نحدث الحقول فقط لو فعلاً وصلت قيم جديدة
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = price;
    if (category !== undefined) course.category = category;

    await course.save();

    res.json({ message: "✅ Course updated successfully", course });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    res.status(500).json({ message: error.message });
  }
};