import { supabase } from "../supabase/client";

export async function getProduct() {
    return supabase
        .from("products")
        .select('*')
        .order("created_at", { ascending: false })
}

export async function createProduct(payload: { name: string; price: number; image_url?: string }) {
    return supabase
        .from("products")
        .insert([payload])
}

export async function updateProduct(
  id: string,
  payload: {
    name: string;
    price: number;
    image_url?: string;
  }
) {
  return supabase
    .from("products")
    .update(payload)
    .eq("id", id);
}

export async function deleteProduct(
  id: string
) {
  return supabase
    .from("products")
    .delete()
    .eq("id", id);
}