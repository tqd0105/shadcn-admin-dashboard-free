import { supabase } from "../supabase/client";

export async function getWishlist() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const { data, error } = await supabase
    .from("wishlists")
    .select(`
      id,
      product_id,
      created_at,
      products (
        id,
        name,
        price,
        discount_percent,
        image_url,
        slug
      )
    `)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function toggleWishlist(productId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  // Check if exists
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("product_id", productId)
    .single();

  if (existing) {
    // Remove
    const { data, error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", existing.id)
      .select();
    return { data, action: "removed", error };
  } else {
    // Add
    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: userData.user.id,
        product_id: productId
      })
      .select();
    return { data, action: "added", error };
  }
}

export async function removeFromWishlist(id: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const { data, error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .select();

  return { data, error };
}
