import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const instructorSchema = new mongoose.Schema(
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

    // password can be null for social users
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
      default: "Instructor",
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    authProvider: {
      type: String,
      enum: ["email", "google", "github"],
      default: "email",
    },

    // optional provider-specific IDs (handy for linking accounts)
    googleId: {
      type: String,
      default: null,
    },
    githubId: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      default: "",
    },

    links: [
      {
        label: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash password only if it was set/modified
instructorSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    if (!this.password) return next(); // skip null
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare plain text password with hashed password
instructorSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const Instructor =
  mongoose.models.Instructor || mongoose.model("Instructor", instructorSchema);
export default Instructor;
