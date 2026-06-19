/**
 * Services for registration flow.
 * All calls go to NestJS backend (NEXT_PUBLIC_OTP_API_URL).
 */

const getOtpApiUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_OTP_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_OTP_API_URL is missing in .env.local");
  }
  return url.replace(/\/$/, ""); // remove trailing slash
};

/**
 * Bước 1: Gửi OTP đến email
 * Backend: POST /api/auth/register/send-otp
 * - Kiểm tra email tồn tại → 409
 * - Tạo OTP 6 số server-side, lưu DB, gửi email qua Nodemailer
 */
export async function sendOtp(email: string): Promise<Response> {
  return fetch(`${getOtpApiUrl()}/api/auth/register/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

/**
 * Bước 2: Xác thực OTP → nhận temp_token
 * Backend: POST /api/auth/register/verify-otp
 * - Kiểm tra OTP đúng & chưa hết hạn
 * - Trả về { temp_token }
 */
export async function verifyOtp(
  email: string,
  otp: string,
): Promise<Response | { temp_token: string }> {
  const resp = await fetch(`${getOtpApiUrl()}/api/auth/register/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!resp.ok) return resp;
  return resp.json() as Promise<{ temp_token: string }>;
}

/**
 * Bước 3: Hoàn tất đăng ký (đặt mật khẩu)
 * Backend: POST /api/auth/register/complete
 * - Xác thực temp_token
 * - Tạo user trong Supabase Auth
 * - Trả về { success: true }
 */
export async function register(
  name: string,
  email: string,
  password: string,
  tempToken: string,
): Promise<Response | { success: boolean }> {
  const resp = await fetch(`${getOtpApiUrl()}/api/auth/register/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      temp_token: tempToken,
    }),
  });
  if (!resp.ok) return resp;
  return resp.json() as Promise<{ success: boolean }>;
}
