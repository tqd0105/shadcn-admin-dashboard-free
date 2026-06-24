import { supabase } from "../supabase/client";

export async function getAddresses() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function addAddress(addressData: { full_name: string; phone: string; street: string; city: string; is_default: boolean }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  // If new address is default, unset others
  if (addressData.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userData.user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      ...addressData,
      user_id: userData.user.id
    })
    .select()
    .single();

  return { data, error };
}

export async function updateAddress(id: string, addressData: { full_name: string; phone: string; street: string; city: string; is_default: boolean }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  if (addressData.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userData.user.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .update(addressData)
    .eq("id", id)
    .eq("user_id", userData.user.id) // Ensure security
    .select()
    .single();

  return { data, error };
}

export async function deleteAddress(id: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError || new Error("User not authenticated") };

  const { data, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .select()
    .single();

  return { data, error };
}
