import { supabase } from "../supabase/client";

export async function getOrders(
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  options?: {
    status?: string;
    sort?: string;
    date?: string;
  }
) {
  let query = supabase
    .from("orders")
    .select("*, profiles(full_name, email, phone), addresses(full_name, street, city, phone)", { count: "exact" });

  if (search && search.trim()) {
    const cleanSearch = search.trim().toLowerCase();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`);
    const matchedUserIds = new Set(profiles?.map((p) => p.id) || []);

    let allOrdersQuery = supabase.from("orders").select("id, user_id");
    if (options?.status && options.status !== "all") {
      allOrdersQuery = allOrdersQuery.eq("status", options.status);
    }
    const { data: allIds } = await allOrdersQuery;

    const matchedOrderIds = (allIds || [])
      .filter((o) => o.id.toLowerCase().includes(cleanSearch) || matchedUserIds.has(o.user_id))
      .map((o) => o.id);

    if (matchedOrderIds.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 1 };
    }

    query = query.in("id", matchedOrderIds);
  }

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  // Date Filtering
  if (options?.date && options.date !== "all") {
    const now = new Date();
    if (options.date === "today") {
      const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      query = query.gte("created_at", todayStart);
    } else if (options.date === "7days") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", sevenDaysAgo);
    } else if (options.date === "30days") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", thirtyDaysAgo);
    }
  }

  // Sorting
  if (options?.sort === "amount_asc") {
    query = query.order("total_amount", { ascending: true });
  } else if (options?.sort === "amount_desc") {
    query = query.order("total_amount", { ascending: false });
  } else if (options?.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
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
      profiles(full_name, email, phone),
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
    .eq("id", id);

  if (!error) {
    try {
      if (typeof window !== "undefined" && window.BroadcastChannel) {
        new BroadcastChannel("admin_orders_channel").postMessage({ type: "ORDER_UPDATED", id, status });
      }
      const channel = supabase.channel("global-admin-orders-notifier");
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 500);
        channel.subscribe(async (st) => {
          if (st === "SUBSCRIBED") {
            await channel.send({
              type: "broadcast",
              event: "ORDER_UPDATED",
              payload: { id, status }
            });
            clearTimeout(timer);
            resolve();
          }
        });
      });
    } catch (err) {}
  }

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

export async function deleteOrderAdmin(id: string) {
  await supabase.from("order_items").delete().eq("order_id", id);
  const { error } = await supabase.from("orders").delete().eq("id", id);
  return { error };
}

