import { supabase } from "../supabase/client";

export async function getCart() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      product_id,
      variant_id,
      products (
        id,
        name,
        price,
        discount_percent,
        image_url,
        slug
      ),
      product_variants (
        id,
        name,
        price_modifier,
        stock_quantity
      )
    `)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function addToCart(productId: string, quantity: number = 1, variantId?: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const userId = userData.user.id;

  // Check if item already exists in cart with same product and variant
  let query = supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId);
    
  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data: existingItems } = await query;

  if (existingItems && existingItems.length > 0) {
    // If it exists, update quantity
    const item = existingItems[0];
    return supabase
      .from("cart_items")
      .update({ quantity: item.quantity + quantity })
      .eq("id", item.id)
      .select()
      .single();
  } else {
    // If new, insert
    const payload: any = {
      user_id: userId,
      product_id: productId,
      quantity,
    };
    if (variantId) payload.variant_id = variantId;

    return supabase
      .from("cart_items")
      .insert(payload)
      .select()
      .single();
  }
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  if (quantity <= 0) {
    return removeFromCart(itemId);
  }

  return supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("user_id", userData.user.id) // Security check
    .select()
    .single();
}

export async function removeFromCart(itemId: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  return supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userData.user.id); // Security check
}
