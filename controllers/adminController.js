import Admin from "../models/adminModel.js";
import Instructor from "../models/instructorModel.js";
import Student from "../models/studentModel.js";
import Course from "../models/courseModel.js";
import Payment from "../models/paymentModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import admin from "../config/firebaseAdmin.js";
import CommunityPost from "../models/communityPostModel.js";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminUser = await Admin.findOne({ email });
    if (!adminUser) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: adminUser._id, role: "Admin" }, process.env.JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, admin: adminUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const instructors = await Instructor.countDocuments();
    const students = await Student.countDocuments();
    const courses = await Course.countDocuments();
    const payments = await Payment.find();

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    res.json({ instructors, students, courses, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select("name profileImage");
    const count = await Student.countDocuments();

    // Map profileImage to image to match requirements
    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.name,
      image: student.profileImage
    }));

    res.json({ count, students: formattedStudents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find().select("name profileImage");
    const count = await Instructor.countDocuments();

    // Map profileImage to image to match requirements
    const formattedInstructors = instructors.map(instructor => ({
      _id: instructor._id,
      name: instructor.name,
      image: instructor.profileImage
    }));

    res.json({ count, instructors: formattedInstructors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInstructorById = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id).select("-password");
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    res.json(instructor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all courses for admin
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name profileImage email")
      .sort({ createdAt: -1 });
    const count = await Course.countDocuments();

    res.json({ count, courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get course by ID for admin (with full details)
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name profileImage email bio links")
      .populate("enrolledStudents", "name profileImage email");

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Calculate total video duration if needed (optional)
    const totalVideos = course.videos.length;

    // Format response with complete details
    const courseDetails = {
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      category: course.category,
      level: course.level,
      status: course.status,
      prerequisites: course.prerequisites,

      // Instructor details
      instructor: course.instructor,

      // Cover image
      coverImage: course.coverImage,

      // Videos with full details
      videos: course.videos.map((video, index) => ({
        index: index + 1,
        title: video.title,
        url: video.url,
        public_id: video.public_id,
        _id: video._id
      })),

      // Statistics
      statistics: {
        totalVideos: totalVideos,
        enrolledStudentsCount: course.enrolledStudents.length,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      },

      // Enrolled students
      enrolledStudents: course.enrolledStudents,

      // Progress data
      progress: course.progress
    };

    res.json(courseDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete course by admin (with all content - videos, cover image)
export const deleteCourseByAdmin = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Delete all videos from Cloudinary
    for (const video of course.videos) {
      if (video.public_id) {
        try {
          await cloudinary.uploader.destroy(video.public_id, { resource_type: "video" });
          console.log(`✅ Deleted video: ${video.public_id}`);
        } catch (error) {
          console.error(`❌ Error deleting video ${video.public_id}:`, error);
        }
      }
    }

    // Delete cover image from Cloudinary
    if (course.coverImage && course.coverImage.public_id) {
      try {
        await cloudinary.uploader.destroy(course.coverImage.public_id, {
          resource_type: "image",
        });
        console.log(`✅ Deleted cover image: ${course.coverImage.public_id}`);
      } catch (error) {
        console.error(`❌ Error deleting cover image:`, error);
      }
    }

    await course.deleteOne();
    res.json({ message: "Course deleted successfully with all content" });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete student by admin (from MongoDB and Firebase)
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Delete from Firebase if they used Google or GitHub login
    if (student.googleId || student.githubId) {
      try {
        // Try to find user by email in Firebase
        const userRecord = await admin.auth().getUserByEmail(student.email);
        if (userRecord) {
          await admin.auth().deleteUser(userRecord.uid);
          console.log(`✅ Deleted student from Firebase: ${student.email}`);
        }
      } catch (firebaseError) {
        console.error(`⚠️ Firebase deletion warning for ${student.email}:`, firebaseError.message);
        // Continue with MongoDB deletion even if Firebase deletion fails
      }
    }

    // Delete from MongoDB
    await student.deleteOne();
    res.json({
      message: "Student deleted successfully from database and Firebase",
      deletedStudent: {
        id: student._id,
        name: student.name,
        email: student.email
      }
    });
  } catch (error) {
    console.error("❌ Error deleting student:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete instructor by admin (from MongoDB and Firebase) + all their courses
export const deleteInstructor = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.params.id);
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });

    // Find all courses by this instructor
    const instructorCourses = await Course.find({ instructor: instructor._id });
    console.log(`📚 Found ${instructorCourses.length} courses for instructor ${instructor.name}`);

    // Delete all courses with their content
    let deletedCoursesCount = 0;
    let deletedVideosCount = 0;
    let deletedImagesCount = 0;

    for (const course of instructorCourses) {
      console.log(`🗑️ Deleting course: ${course.title}`);

      // Delete all videos from Cloudinary
      for (const video of course.videos) {
        if (video.public_id) {
          try {
            await cloudinary.uploader.destroy(video.public_id, { resource_type: "video" });
            deletedVideosCount++;
            console.log(`  ✅ Deleted video: ${video.public_id}`);
          } catch (error) {
            console.error(`  ❌ Error deleting video ${video.public_id}:`, error.message);
          }
        }
      }

      // Delete cover image from Cloudinary
      if (course.coverImage && course.coverImage.public_id) {
        try {
          await cloudinary.uploader.destroy(course.coverImage.public_id, {
            resource_type: "image",
          });
          deletedImagesCount++;
          console.log(`  ✅ Deleted cover image: ${course.coverImage.public_id}`);
        } catch (error) {
          console.error(`  ❌ Error deleting cover image:`, error.message);
        }
      }

      // Delete course from MongoDB
      await course.deleteOne();
      deletedCoursesCount++;
      console.log(`  ✅ Course deleted from database`);
    }

    // Delete from Firebase if they used Google or GitHub login
    if (instructor.googleId || instructor.githubId) {
      try {
        // Try to find user by email in Firebase
        const userRecord = await admin.auth().getUserByEmail(instructor.email);
        if (userRecord) {
          await admin.auth().deleteUser(userRecord.uid);
          console.log(`✅ Deleted instructor from Firebase: ${instructor.email}`);
        }
      } catch (firebaseError) {
        console.error(`⚠️ Firebase deletion warning for ${instructor.email}:`, firebaseError.message);
        // Continue with MongoDB deletion even if Firebase deletion fails
      }
    }

    // Delete instructor from MongoDB
    await instructor.deleteOne();

    res.json({
      message: "Instructor and all their courses deleted successfully",
      deletedInstructor: {
        id: instructor._id,
        name: instructor.name,
        email: instructor.email
      },
      deletedContent: {
        courses: deletedCoursesCount,
        videos: deletedVideosCount,
        images: deletedImagesCount
      }
    });
  } catch (error) {
    console.error("❌ Error deleting instructor:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const latestPost = await CommunityPost.findOne()
      .populate("author", "name profileImage")
      .sort({ createdAt: -1 });

    const latestStudent = await Student.findOne()
      .select("name profileImage createdAt")
      .sort({ createdAt: -1 });

    const latestInstructor = await Instructor.findOne()
      .select("name profileImage createdAt")
      .sort({ createdAt: -1 });

    const latestCourse = await Course.findOne()
      .populate("instructor", "name")
      .sort({ createdAt: -1 });

    res.json({
      latestPost: latestPost
        ? {
          id: latestPost._id,
          authorName: latestPost.author?.name,
          authorImage: latestPost.author?.profileImage,
          type: latestPost.type,
          content: latestPost.content,
          createdAt: latestPost.createdAt,
        }
        : null,

      latestStudent: latestStudent
        ? {
          id: latestStudent._id,
          name: latestStudent.name,
          profileImage: latestStudent.profileImage,
          createdAt: latestStudent.createdAt,
        }
        : null,

      latestInstructor: latestInstructor
        ? {
          id: latestInstructor._id,
          name: latestInstructor.name,
          profileImage: latestInstructor.profileImage,
          createdAt: latestInstructor.createdAt,
        }
        : null,

      latestCourse: latestCourse
        ? {
          id: latestCourse._id,
          title: latestCourse.title,
          price: latestCourse.price,
          coverImage: latestCourse.coverImage?.url || null,
          instructorName: latestCourse.instructor?.name,
          createdAt: latestCourse.createdAt,
        }
        : null,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
