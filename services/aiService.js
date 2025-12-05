import groq from "../utils/groqClient.js";

// MODELS
import Course from "../models/courseModel.js";
import CommunityPost from "../models/communityPostModel.js";
import Instructor from "../models/instructorModel.js";
import Student from "../models/studentModel.js";
import Admin from "../models/adminModel.js";

export const personalizedAI = async (message, user, isFirst) => {
    const role = user.role;

    // -------------------------
    // 1️⃣ PLATFORM DATA
    // -------------------------
    const courses = await Course.find({}, "title category").lean();
    const communityCount = await CommunityPost.countDocuments();

    // -------------------------
    // 2️⃣ ROLE-SPECIFIC DATA
    // -------------------------
    let name = "";
    let roleInfo = "";

    // STUDENT
    if (role === "Student") {
        const student = await Student.findById(user._id)
            .populate("enrolledCourses")
            .lean();

        name = student?.name || "Student";

        const enrolledCourses = student?.enrolledCourses || [];

        roleInfo = `
ROLE: Student  
Enrolled Courses:
${enrolledCourses.length
                ? enrolledCourses.map(c => `• ${c.title}`).join("\n")
                : "• You are not enrolled in any courses yet."}
`;
    }

    // INSTRUCTOR
    if (role === "Instructor") {
        const instructor = await Instructor.findById(user._id).lean();
        name = instructor?.name || "Instructor";

        const instructorCourses = await Course.find(
            { instructor: user._id },
            "title category"
        ).lean();

        roleInfo = `
ROLE: Instructor  
Your Courses:
${instructorCourses.length
                ? instructorCourses.map(c => `• ${c.title} (${c.category})`).join("\n")
                : "• You haven’t created any courses yet."}
`;
    }

    // ADMIN
    if (role === "Admin") {
        const admin = await Admin.findById(user._id).lean();
        name = admin?.name || "Admin";

        roleInfo = `
ROLE: Admin  
You manage: users, courses, payments, community, and analytics.
`;
    }

    // -------------------------
    // 3️⃣ 🔥 OPTIMIZED SYSTEM PROMPT
    // -------------------------
    const systemContext = `
You are **Codexa AI**, the official assistant of the Codexa learning platform.
Your purpose is to help the user understand and navigate the platform.

=====================
🎯 CORE BEHAVIOR RULES
=====================

🎯 GREETING RULE
=====================
- If this is the FIRST USER MESSAGE (${isFirst}), greet the user:
  "Hi ${name}! Welcome to Codexa — here's what you can do."
- If NOT the first message, NEVER greet again.
- Never say welcome again after the first message.
- Never repeat the same intro twice.
- Keep a natural, conversational tone.

2. Your tone MUST be:
   • Friendly  
   • Helpful  
   • Natural  
   • Never robotic  
   • Never repetitive  

3. NEVER say things like:
   - "Not much happening on the platform"
   - "I'm used to chatting"
   - "I forget sometimes"
   - Or any invented personal feelings

4. Topics you CAN talk about:
   ⭐ Courses
   ⭐ Lessons
   ⭐ Progress
   ⭐ Student abilities
   ⭐ Instructor tools
   ⭐ Admin dashboards
   ⭐ Community features

5. If user asks about anything outside Codexa:
   👉 Redirect nicely (do NOT refuse):
   “I can help you with Codexa features like courses, community, or your role. What would you like to explore?”

6. When asked “what can I do here?”  
   → Give a SHORT role-based menu.

7. NEVER repeat the same intro in every message.

=====================
👤 USER INFO
=====================
Name: ${name}
${roleInfo}

=====================
📚 PLATFORM INFO
=====================
Courses (${courses.length}):
${courses.map(c => `• ${c.title} (${c.category})`).join("\n")}

Community Posts: ${communityCount}

=====================
🎯 RESPONSE STYLE
=====================
- Short and clear sentences.
- Only show platform data when relevant.
- Ask clarifying questions if user is vague.
- Make the conversation feel human.
`;

    // -------------------------
    // 4️⃣ CALL GROQ
    // -------------------------
    const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            { role: "system", content: systemContext },
            { role: "user", content: message }
        ]
    });

    return completion.choices[0].message.content;
};

export default personalizedAI;
