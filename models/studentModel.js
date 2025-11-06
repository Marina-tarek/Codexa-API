import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // password can be null for social users; email-provider users will have a password
    password: {
      type: String,
      default: null,
    },

    profileImage: {
      type: String,
      default: "/uploads/default-avatar.png",
    },

    role: {
      type: String,
      default: "Student",
    },

    authProvider: {
      type: String,
      enum: ["email", "google", "github"],
      default: "email",
    },

    // optional provider-specific IDs (handy for linking)
    googleId: {
      type: String,
      default: null,
    },
    githubId: {
      type: String,
      default: null,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordCode: {
      type: String,
      default: null,
    },

    resetPasswordCodeExpires: {
      type: Date,
      default: null,
    },

    notes: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        content: String,
      },
    ],

    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    progress: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        percent: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Hash password only if it was set/modified
studentSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    if (!this.password) return next(); // don't hash null/empty
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare plain text password with hashed password
studentSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;