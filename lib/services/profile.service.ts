import { supabase } from "../supabase/client";

export async function getProfile(userId: string) {
    if (!userId) throw new Error("User ID is required");

    return supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
}

export async function updateProfile(userId: string, data: { full_name: string; phone: string }) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      phone: data.phone,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)
    .select()
    .single();

  return { data: profile, error };
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: password
  });

  return { data, error };
}