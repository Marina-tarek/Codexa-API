// // models/Instructor.js
// import mongoose from "mongoose";
// import bcrypt from "bcryptjs";

// const instructorSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   profileImage: { type: String, default: "/uploads/default-avatar.png" },
//   isAdmin: { type: Boolean, default: false },
//   isActive: { type: Boolean, default: true },
// }, { timestamps: true });

// instructorSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// instructorSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// export default mongoose.model("Instructor", instructorSchema);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const instructorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profileImage: { type: String, default: "/uploads/default-avatar.png" },
  role: { type: String, default: "Instructor" },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

instructorSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const Instructor = mongoose.model("Instructor", instructorSchema);
export default Instructor;