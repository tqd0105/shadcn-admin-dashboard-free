import { supabase } from "../supabase/client";

export async function getProfile(userId: string) {
    if (!userId) throw new Error("User ID is required");

    return supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
}