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
    default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN73NiiE0ElYaFozvm3bfD6O-THsF-5DoBI7yVYFKg8DxubwAGxX5nBkQ&s",
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