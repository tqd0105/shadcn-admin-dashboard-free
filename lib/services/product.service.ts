import { supabase } from "../supabase/client";

export async function getProduct(
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  options?: {
    category_id?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }
) {
  let query = supabase
    .from("products")
    .select("*, categories(name)", { count: "exact" });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  
  if (options?.category_id) {
    query = query.eq("category_id", options.category_id);
  }
  
  if (options?.brand) {
    query = query.ilike("brand", `%${options.brand}%`);
  }
  
  if (options?.minPrice !== undefined) {
    query = query.gte("price", options.minPrice);
  }
  
  if (options?.maxPrice !== undefined) {
    query = query.lte("price", options.maxPrice);
  }

  // Sorting
  if (options?.sort === 'price_asc') {
    query = query.order("price", { ascending: true });
  } else if (options?.sort === 'price_desc') {
    query = query.order("price", { ascending: false });
  } else {
    // default: newest
    query = query.order("created_at", { ascending: false });
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

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("slug", slug)
    .single();

  return { data, error };
}

export async function getFlashSaleProducts(limit: number = 4) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .gt("discount_percent", 0)
    .order("discount_percent", { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function getNewArrivals(limit: number = 8) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function createProduct(payload: { 
  name: string; 
  price: number; 
  image_url?: string; 
  category_id?: string | null;
  discount_percent?: number;
  stock_quantity?: number;
  description_html?: string;
  brand?: string;
}) {
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
    discount_percent?: number;
    stock_quantity?: number;
    description_html?: string;
    brand?: string;
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