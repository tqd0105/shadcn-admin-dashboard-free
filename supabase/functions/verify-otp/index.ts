import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const {
    email,
    otp,
  } = await req.json();

  // Tạo connection đến Supabase
  const supabase = createClient(
    Deno.env.get(
      "SUPABASE_URL",
    )!,
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    )!,
  );

  // Lấy dữ liệu OTP từ bảng otp_verifications 
  const { data } = await supabase
    .from(
      "otp_verifications",
    )
    .select("*")
    .eq("email", email)
    .eq("otp_code", otp)
    .single();

  if (!data) {
    return Response.json(
      {
        message: "OTP không đúng",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  // Tạo temp_token để xác thực trong 1 khoảng thời gian ngắn
  const tempToken = crypto.randomUUID();

  // Cập nhật bảng otp_verifications với temp_token và trạng thái verified = true
  await supabase
    .from(
      "otp_verifications",
    )
    .update({
      verified: true,
      temp_token: tempToken,
    })
    .eq("id", data.id);

  // Trả về temp_token cho client
  return Response.json({
    temp_token: tempToken,
  }, {
    headers: corsHeaders,
  });
});
