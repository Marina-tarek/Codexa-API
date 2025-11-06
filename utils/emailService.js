import nodemailer from "nodemailer";

// إنشاء transporter للإيميل
const createTransporter = () => {
  // إذا كان هناك SMTP مخصص
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // استخدام خدمة معروفة (Gmail, Outlook, etc.)
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// إرسال كود إعادة تعيين كلمة المرور
// 
// ملاحظة مهمة: HTML هنا ليس للفرونت اند!
// HTML هنا هو محتوى الإيميل نفسه الذي سيظهر في صندوق الوارد
// عندما يفتح المستخدم الإيميل في Gmail/Outlook، سيرى هذا HTML منسقاً
// 
// بديل: يمكنك استخدام نص عادي بدلاً من HTML:
// text: `كود إعادة تعيين كلمة المرور: ${resetCode}`
//
export const sendResetCodeEmail = async (email, resetCode, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "كود إعادة تعيين كلمة المرور - Reset Password Code",
      // HTML هنا هو محتوى الإيميل - سيظهر منسقاً في Gmail/Outlook
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">مرحباً ${userName},</p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">لقد طلبت إعادة تعيين كلمة المرور الخاصة بك. استخدم الكود التالي:</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 8px; margin: 0;">${resetCode}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">هذا الكود صالح لمدة 10 دقائق فقط.</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا الإيميل.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>Reset Password Code</p>
              <p>Hello ${userName},</p>
              <p>You requested to reset your password. Use the following code:</p>
              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #4CAF50; font-size: 32px; letter-spacing: 6px; margin: 0;">${resetCode}</h2>
              </div>
              <p>This code is valid for 10 minutes only.</p>
              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send email: " + error.message);
  }
};

