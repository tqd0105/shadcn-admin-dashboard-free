import { supabase } from "../supabase/client";

export async function getProduct(
  search?: string,
  page: number = 1,
  pageSize: number = 10
) {
  let query = supabase
    .from("products")
    .select("*, categories(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;
  
  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return {
    data,
    error,
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

export async function createProduct(payload: { name: string; price: number; image_url?: string; category_id?: string | null }) {
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
    category_id?: string | null;
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