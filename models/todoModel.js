import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "ownerType" },
    ownerType: { type: String, enum: ["Student", "Instructor", "Admin"], required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    linkUrl: { type: String, default: null },
    imageUrl: { type: String, default: null },
    audioUrl: { type: String, default: null },
    isDone: { type: Boolean, default: false },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const ToDo = mongoose.model("ToDo", todoSchema);
export default ToDo;



