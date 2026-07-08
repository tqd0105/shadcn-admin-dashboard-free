import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

function getTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
}

/**
 * Chuyển đổi HTML sang plain text sạch, bảo toàn cấu trúc đọc được.
 * Giúp Gmail nhận diện email multipart/alternative hợp lệ (giảm Spam Score).
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/td>/gi, "\t")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&copy;/gi, "©")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\t{2,}/g, "\t")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn("⚠️ [Email Service] GMAIL_USER hoặc GMAIL_APP_PASSWORD chưa được cấu hình.");
    return { success: false, error: "Missing Gmail credentials" };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "Could not create transporter" };
  }

  try {
    const text = htmlToPlainText(html);

    const info = await transporter.sendMail({
      // Dùng tên tài khoản Gmail thật thay vì brand name mạo danh
      // Google sẽ không gắn cờ "mạo danh" khi tên người gửi trùng chủ sở hữu
      from: gmailUser,
      to,
      subject,
      text,
      html,
      // KHÔNG thêm X-Priority, Importance, X-MSMail-Priority
      // Các header này là trigger spam #1 trên SpamAssassin
      headers: {
        "List-Unsubscribe": `<mailto:${gmailUser}?subject=unsubscribe>`,
      },
    });

    console.log("✅ [Email Service] Đã gửi email thành công đến:", to, "| MessageID:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ [Email Service] Lỗi khi gửi email:", error);
    const errStr = typeof error === "string" 
      ? error 
      : (error?.message || error?.code || error?.response || error?.toString() || "Lỗi gửi email không xác định");
    return { success: false, error: errStr };
  }
}
