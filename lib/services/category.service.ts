import { supabase } from "../supabase/client";

export async function getCategories() {
  return supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function createCategory(payload: { name: string }) {
  return supabase
    .from("categories")
    .insert([payload]);
}

export async function updateCategory(id: string, payload: { name: string }) {
  return supabase
    .from("categories")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function deleteCategory(id: string) {
  return supabase
    .from("categories")
    .delete()
    .eq("id", id);
}
