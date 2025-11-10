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

// 🆕 إنشاء كورس جديد مع أكثر من فيديو + cover image
export const createCourse = async (req, res) => {
  try {
    const { title, description, price, category, level, status, prerequisites } = req.body;
    const instructorId = req.user._id;

    // التحقق من الحقول المطلوبة
    if (!title || !description || !category) {
      return res.status(400).json({ 
        message: "Title, description, and category are required" 
      });
    }

    // التحقق من صحة level و status
    const validLevels = ["beginner", "intermediate", "advanced"];
    const validStatuses = ["private", "public"];
    
    const courseLevel = (level && validLevels.includes(level.toLowerCase())) 
      ? level.toLowerCase() 
      : "beginner";
    
    const courseStatus = (status && validStatuses.includes(status.toLowerCase())) 
      ? status.toLowerCase() 
      : "public";

    const uploadedVideos = [];
    let coverImageData = { url: null, public_id: null };

    // رفع Cover Image (صورة واحدة)
    if (req.files && req.files.coverImage) {
      const coverFile = Array.isArray(req.files.coverImage) 
        ? req.files.coverImage[0] 
        : req.files.coverImage;
      
      const coverResult = await cloudinary.uploader.upload(coverFile.path, {
        resource_type: "image",
        folder: "courses_covers",
      });

      coverImageData = {
        url: coverResult.secure_url,
        public_id: coverResult.public_id,
      };

      // حذف الملف المؤقت
      if (fs.existsSync(coverFile.path)) {
        fs.unlinkSync(coverFile.path);
      }
    }

    // رفع الفيديوهات
    if (req.files && req.files.videos) {
      const videoFiles = Array.isArray(req.files.videos) 
        ? req.files.videos 
        : [req.files.videos];

      for (const file of videoFiles) {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: "video",
          folder: "courses_videos",
        });

        uploadedVideos.push({
          title: file.originalname,
          url: result.secure_url,
          public_id: result.public_id,
        });

        // حذف الملف المؤقت
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    const course = await Course.create({
      instructor: instructorId,
      title,
      description,
      price: price || 0,
      category,
      level: courseLevel,
      status: courseStatus,
      prerequisites: prerequisites || "",
      coverImage: coverImageData,
      videos: uploadedVideos,
    });

    res.status(201).json(course);
  } catch (error) {
    console.error("❌ Error creating course:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🆕 إضافة فيديوهات جديدة لكورس موجود
export const addVideosToCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // التحقق من أن المدرب هو صاحب الكورس
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to add videos to this course" });
    }

    // التحقق من وجود ملفات
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No videos provided" });
    }

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

    // التحقق من أن المدرب هو صاحب الكورس
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this video" });
    }

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

// 🆕 حذف كورس بالكامل من MongoDB + Cloudinary (بما فيها cover image)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // التحقق من أن المدرب هو صاحب الكورس
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this course" });
    }

    // حذف الفيديوهات من Cloudinary
    for (const video of course.videos) {
      if (video.public_id) {
        try {
          await cloudinary.uploader.destroy(video.public_id, { resource_type: "video" });
        } catch (error) {
          console.error("Error deleting video:", error);
        }
      }
    }

    // حذف Cover Image من Cloudinary
    if (course.coverImage && course.coverImage.public_id) {
      try {
        await cloudinary.uploader.destroy(course.coverImage.public_id, {
          resource_type: "image",
        });
      } catch (error) {
        console.error("Error deleting cover image:", error);
      }
    }

    await course.deleteOne();
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    // عرض الكورسات العامة فقط (public)
    // const courses = await Course.find({ status: "public" })
    //   .populate("instructor", "name email profileImage") // نعرض بيانات المدرب الأساسية
    //   .sort({ createdAt: -1 }); // الأحدث أولاً
    const courses = await Course.find().populate("instructor", "name email profileImage");

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

// 🆕 تحديث بيانات كورس مع دعم cover image والحقول الجديدة
export const updateCourse = async (req, res) => {
  try {
    const { title, description, price, category, level, status, prerequisites } = req.body;

    // التحقق من صحة level و status
    const validLevels = ["beginner", "intermediate", "advanced"];
    const validStatuses = ["private", "public"];

    // نجيب الكورس الأول
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // تأكيد إن المستخدم هو صاحب الكورس
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    // تحديث Cover Image إذا تم رفع صورة جديدة
    if (req.files && req.files.coverImage) {
      // حذف الصورة القديمة من Cloudinary إذا كانت موجودة
      if (course.coverImage && course.coverImage.public_id) {
        try {
          await cloudinary.uploader.destroy(course.coverImage.public_id, {
            resource_type: "image",
          });
        } catch (error) {
          console.error("Error deleting old cover image:", error);
        }
      }

      // رفع الصورة الجديدة
      const coverFile = Array.isArray(req.files.coverImage)
        ? req.files.coverImage[0]
        : req.files.coverImage;

      const coverResult = await cloudinary.uploader.upload(coverFile.path, {
        resource_type: "image",
        folder: "courses_covers",
      });

      course.coverImage = {
        url: coverResult.secure_url,
        public_id: coverResult.public_id,
      };

      // حذف الملف المؤقت
      if (fs.existsSync(coverFile.path)) {
        fs.unlinkSync(coverFile.path);
      }
    }

    // ✅ نحدث الحقول فقط لو فعلاً وصلت قيم جديدة
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = price;
    if (category !== undefined) course.category = category;
    
    // التحقق من صحة level قبل التحديث
    if (level !== undefined) {
      if (validLevels.includes(level.toLowerCase())) {
        course.level = level.toLowerCase();
      } else {
        return res.status(400).json({ 
          message: `Invalid level. Must be one of: ${validLevels.join(", ")}` 
        });
      }
    }
    
    // التحقق من صحة status قبل التحديث
    if (status !== undefined) {
      if (validStatuses.includes(status.toLowerCase())) {
        course.status = status.toLowerCase();
      } else {
        return res.status(400).json({ 
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
        });
      }
    }
    
    if (prerequisites !== undefined) course.prerequisites = prerequisites;

    await course.save();

    res.json({ message: "✅ Course updated successfully", course });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    res.status(500).json({ message: error.message });
  }
};
// 🆕 عرض كل الكورسات العامة الخاصة بمدرب معين (للطلاب)
export const getCoursesByInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // عرض الكورسات العامة فقط (public) للمدرب المحدد
    const courses = await Course.find({
      instructor: instructorId,
      status: "public",
    })
      .populate("instructor", "name profileImage")
      .sort({ createdAt: -1 });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: "No courses found for this instructor" });
    }

    res.json(courses);
  } catch (error) {
    console.error("❌ Error fetching instructor courses:", error);
    res.status(500).json({ message: "Server error" });
  }
};
