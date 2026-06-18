/**
 * File: services/authService.ts (hoặc tên file tương ứng của bạn)
 */

const getSupabaseFunctionUrl = (functionName: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing in .env file");
  }
  return `${baseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`;
};

/** 
 * Tạo headers mặc định bắt buộc cho Supabase Edge Functions
 */
const getHeaders = () => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env file");
  }

  return {
    "Content-Type": "application/json",
    "apikey": anonKey,
    "Authorization": `Bearer ${anonKey}`, // Header quan trọng nhất để sửa lỗi 401
  };
};

/** Gửi OTP tới email */
export async function sendOtp(email: string) {
  return fetch(getSupabaseFunctionUrl("send-otp"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
}

/**
 * Xác thực OTP và nhận temp_token.
 */
export async function verifyOtp(email: string, otp: string) {
  const resp = await fetch(getSupabaseFunctionUrl("verify-otp"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, otp }),
  });

  if (!resp.ok) {
    // Trả về response gốc để UI hiển thị lỗi (ví dụ: OTP không đúng)
    return resp;
  }

  // Thành công → trả về JSON { temp_token: "..." }
  return resp.json();
}

/**
 * Đăng ký tài khoản sau khi OTP đã được xác thực.
 */
export async function register(
  name: string,
  email: string,
  password: string,
  tempToken: string
) {
  const resp = await fetch(getSupabaseFunctionUrl("register"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      email,
      password,
      temp_token: tempToken,
    }),
  });

  if (!resp.ok) {
    return resp;
  }

  return resp.json();
}