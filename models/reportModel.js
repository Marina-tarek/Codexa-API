import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityPost", required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, refPath: "reporterType", required: true },
    reporterType: { type: String, enum: ["Student", "Instructor", "Admin"], required: true },
    reason: { type: String, required: true },
    details: { type: String, default: "" },
    status: { type: String, enum: ["open", "under_review", "resolved", "dismissed"], default: "open" },
    actionTaken: { type: String, default: null },
    notes: { type: String, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;


