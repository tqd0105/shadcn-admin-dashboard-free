import { createClient } from "jsr:@supabase/supabase-js@2";

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
    password,
    temp_token,
  } = await req.json();

  const supabase =
    createClient(
      Deno.env.get(
        "SUPABASE_URL"
      )!,
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )!
    );

  const { data } =
    await supabase
      .from(
        "otp_verifications"
      )
      .select("*")
      .eq("email", email)
      .eq(
        "temp_token",
        temp_token
      )
      .single();

  if (!data?.verified) {
    return Response.json(
      {
        message:
          "OTP chưa xác thực",
      },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  const regex =
    /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (
    !regex.test(password)
  ) {
    return Response.json(
      {
        message:
          "Password không hợp lệ",
      },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  const {
    error
  } =
    await supabase.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true,
      }
    );

  if (error) {
    return Response.json(
      {
        message:
          error.message,
      },
      {
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  const signInResult =
    await supabase.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

  return Response.json(
    signInResult.data,
    {
      headers: corsHeaders,
    }
  );
});