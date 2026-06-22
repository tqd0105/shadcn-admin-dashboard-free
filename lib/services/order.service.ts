import { supabase } from "../supabase/client";

export async function getOrders(
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  options?: {
    status?: string;
    sort?: string;
  }
) {
  let query = supabase
    .from("orders")
    .select("*, profiles(full_name, email), addresses(street, city, phone)", { count: "exact" });

  // Currently, search by order ID or user name is tricky with standard PostgREST without a text search on joined tables,
  // but we can filter by exact ID if it looks like a UUID.
  if (search) {
    // If it's a UUID format, search by ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(search)) {
      query = query.eq("id", search);
    }
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  // Sorting
  if (options?.sort === 'amount_asc') {
    query = query.order("total_amount", { ascending: true });
  } else if (options?.sort === 'amount_desc') {
    query = query.order("total_amount", { ascending: false });
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

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles(full_name, email),
      addresses(full_name, phone, street, city),
      coupons(code, discount_percent),
      order_items(
        id,
        quantity,
        price,
        products(id, name, image_url),
        product_variants(id, name, sku)
      )
    `)
    .eq("id", id)
    .single();

  return { data, error };
}

export async function updateOrderStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function getMyOrders() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        id,
        quantity,
        price,
        products(name, image_url),
        product_variants(name)
      )
    `)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return { data, error };
}
