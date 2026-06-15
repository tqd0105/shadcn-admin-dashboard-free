"use client";

import { getProfile } from "@/lib/services/profile.service";
import { getRole } from "@/lib/services/role.service";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
    user: User | null;
    profile: any;
    role: string | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true)

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setRole(null);
        router.push("/login");
    }, [router]);

    const fetchProfileAndRole = useCallback(async (userId: string) => {
        const { data, error } = await getProfile(userId);
        if (error) {
            console.error(error);
            return;
        }
        setProfile(data);
        if (data?.role_id) {
            const { data: role } = await getRole(data.role_id);
            if (role) setRole(role.name);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                await fetchProfileAndRole(user.id);
            }
            setLoading(false);
        }
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
                await fetchProfileAndRole(currentUser.id);
            }

            if (event === "SIGNED_OUT") {
                setProfile(null);
                setRole(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        }
    }, [fetchProfileAndRole])

    return (
        <AuthContext.Provider value={{ user, profile, role, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
