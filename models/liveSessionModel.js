import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
    {
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Instructor",
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            default: null, // null = public session
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },

        sessionType: {
            type: String,
            enum: ["private", "public"],
            required: true,
        },

        status: {
            type: String,
            enum: ["scheduled", "live", "ended"],
            default: "scheduled",
        },

        // 100ms Details
        roomId: {
            type: String,
            required: true,
            unique: true,
        },

        // Timing
        scheduledAt: {
            type: Date,
            required: true,
        },
        startedAt: {
            type: Date,
        },
        endedAt: {
            type: Date,
        },

        // Recording
        recordingUrl: {
            type: String,
        },
        recordingPublicId: {
            type: String,
        },
        saveOption: {
            type: String,
            enum: ["course", "profile", "none"],
            default: "none",
        },
        savedToCourse: {
            type: Boolean,
            default: false,
        },

        // Timing
        startedAt: {
            type: Date,
        },
        endedAt: {
            type: Date,
        },

        // Stats
        totalViewers: {
            type: Number,
            default: 0,
        },
        peakViewers: {
            type: Number,
            default: 0,
        },
        duration: {
            type: Number, // in minutes
            default: 0,
        },

        // Notification tracking
        notificationSent: {
            type: Boolean,
            default: false,
        },

        // ✅ Attendance Tracking
        attendees: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, refPath: "attendees.userType" },
                userType: { type: String, enum: ["Student", "Instructor"] },
                joinedAt: { type: Date, default: Date.now },
                leftAt: { type: Date },
                duration: { type: Number, default: 0 }, // minutes
            },
        ],

        // ✅ Persistent Polls
        polls: [
            {
                question: { type: String, required: true },
                options: [{ text: String, count: { type: Number, default: 0 } }],
                isActive: { type: Boolean, default: true },
                createdAt: { type: Date, default: Date.now },
                votes: [
                    {
                        user: { type: mongoose.Schema.Types.ObjectId },
                        optionIndex: { type: Number },
                    },
                ],
            },
        ],

        // ✅ Chat / Comments
        comments: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, required: true },
                userType: { type: String, enum: ["Student", "Instructor"], required: true },
                userName: { type: String, required: true },
                userImage: { type: String },
                text: { type: String, required: true },
                createdAt: { type: Date, default: Date.now },
                replies: [
                    {
                        user: { type: mongoose.Schema.Types.ObjectId, required: true },
                        userType: { type: String, enum: ["Student", "Instructor"], required: true },
                        userName: { type: String, required: true },
                        userImage: { type: String },
                        text: { type: String, required: true },
                        createdAt: { type: Date, default: Date.now },
                    }
                ]
            }
        ],
    },
    { timestamps: true }
);

// Index for faster queries
liveSessionSchema.index({ instructor: 1, status: 1 });
liveSessionSchema.index({ course: 1, status: 1 });
liveSessionSchema.index({ scheduledAt: 1 });

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
export default LiveSession;
