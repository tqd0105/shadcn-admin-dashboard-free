"use server"

import { supabaseAdmin } from "../supabase/admin";

export async function getUsers(search = "", page = 1, pageSize = 10, roleFilter?: string) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
        .from("profiles")
        .select(`
            *,
            role:roles${roleFilter ? "!inner" : ""} (
                id,
                name
            )
        `, { count: "exact" });

    if (roleFilter) {
        query = query.eq("role.name", roleFilter);
    }

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching users:", error);
        return { data: [], error, totalPages: 0 };
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return { data, totalPages, count };
}

export async function createUser(payload: any) {
    const { full_name, email, password, role_id, is_locked = false } = payload;
    
    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
    });

    if (authError) {
        return { error: authError };
    }

    const userId = authData.user.id;

    // 2. The trigger handle_new_user might have created a profile with 'user' role.
    // We update it to the correct role_id and full_name.
    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name, role_id, is_locked })
        .eq("id", userId);
        
    if (profileError) {
        // Fallback: upsert
        const { error: upsertError } = await supabaseAdmin
            .from("profiles")
            .upsert({ id: userId, email, full_name, role_id, is_locked });
        if (upsertError) return { error: upsertError };
    }

    return { data: authData.user };
}

export async function updateUser(id: string, payload: any) {
    const { full_name, role_id, is_locked } = payload;
    
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (is_locked !== undefined) updateData.is_locked = is_locked;

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    return { data, error };
}

export async function deleteUser(id: string) {
    // Manually delete profile first to avoid FK issues if any (except for products which might block this)
    await supabaseAdmin.from("profiles").delete().eq("id", id);
    
    // Delete from auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    return { error };
}
