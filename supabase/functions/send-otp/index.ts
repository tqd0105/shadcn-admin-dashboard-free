import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const resend = new Resend(
  Deno.env.get("RESEND_API_KEY"),
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const { email } = await req.json();

  // Tạo client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Truy xuất tất cả tài khoản (hàm supabase)
  const {
    data: users,
  } = await supabase.auth.admin.listUsers();

  // Kiểm tra email đã tồn tại chưa
  const existed = users?.users.find(
    (user) => user.email === email,
  );

  // Nếu email đã tồn tại thì trả về lỗi
  if (existed) {
    return Response.json(
      {
        message: "Tài khoản đã tồn tại",
      },
      {
        status: 409,
        headers: corsHeaders,
      },
    );
  }

  // Tạo mã OTP gồm 6 số
  const otp = Math.floor(
    100000 +
      Math.random() * 900000,
  ).toString();

  // Lưu mã OTP vào bảng otp_verifications
  await supabase
    .from("otp_verifications")
    .insert({
      email,
      otp_code: otp,
      expires_at: new Date(
        Date.now() +
          5 * 60 * 1000,
      ),
    });

  // Gửi email
  await resend.emails.send({
    from: "Royal Solutions <onboarding@resend.dev>",
    to: email,
    subject: "OTP Verification",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#333;margin-bottom:10px;">Your OTP Code</h2>
        <p style="margin:0 0 10px;">Use the code below to verify your email address. The code will expire in 5 minutes.</p>
        <div style="font-size:32px;font-weight:bold;background:#f5f5f5;padding:10px 15px;border-radius:4px;text-align:center;letter-spacing:2px;">${otp}</div>
        <p style="margin-top:20px;color:#555;font-size:14px;">If you did not request this code, you can safely ignore this email.</p>
      </div>`,
  });

  return Response.json({
    success: true,
  }, {
    headers: corsHeaders,
  });
});
