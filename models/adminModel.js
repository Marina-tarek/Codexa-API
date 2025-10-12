import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: "/uploads/admin-avatar.png",
  },
  role: {
    type: String,
    default: "Admin",
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

// تشفير الباسورد قبل الحفظ
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;