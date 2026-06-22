import { supabase } from "../supabase/client";
import { getCart } from "./cart.service";

export interface CheckoutData {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  paymentMethod: string;
}

export async function placeOrder(checkoutData: CheckoutData) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const userId = userData.user.id;

  // 1. Get current cart items
  const { data: cartItems, error: cartError } = await getCart();
  if (cartError || !cartItems || cartItems.length === 0) {
    return { data: null, error: new Error("Cart is empty or could not be loaded") };
  }

  // Calculate total amount
  let totalAmount = 0;
  for (const item of cartItems as any[]) {
    const basePrice = Number(item.products?.price || 0);
    const discount = Number(item.products?.discount_percent || 0);
    const modifier = Number(item.product_variants?.price_modifier || 0);
    const discountedBase = basePrice - (basePrice * discount / 100);
    const finalPrice = discountedBase + modifier;
    totalAmount += finalPrice * item.quantity;
  }

  // 2. Create or find Address
  // For simplicity, we just insert a new address record. Alternatively, you could check if it matches an existing one.
  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      full_name: checkoutData.fullName,
      phone: checkoutData.phone,
      street: checkoutData.street,
      city: checkoutData.city,
      is_default: false // Optional
    })
    .select()
    .single();

  if (addressError) return { data: null, error: addressError };

  // 3. Create Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_amount: totalAmount,
      shipping_address_id: address.id,
      payment_method: checkoutData.paymentMethod,
    })
    .select()
    .single();

  if (orderError) return { data: null, error: orderError };

  // 4. Move Cart Items to Order Items
  const orderItemsPayload = (cartItems as any[]).map(item => {
    const basePrice = Number(item.products?.price || 0);
    const discount = Number(item.products?.discount_percent || 0);
    const modifier = Number(item.product_variants?.price_modifier || 0);
    const finalPrice = basePrice - (basePrice * discount / 100) + modifier;

    const payload: any = {
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: finalPrice,
    };
    if (item.variant_id) payload.variant_id = item.variant_id;
    return payload;
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) {
    // If this fails, the order is created but empty. In a real system we'd use a postgres function with transactions.
    return { data: null, error: itemsError };
  }

  // 5. Clear the Cart
  await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  return { data: order, error: null };
}
