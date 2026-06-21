"use client";

import { getProfile } from "@/lib/services/profile.service";
import { getRole } from "@/lib/services/role.service";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isSessionValid } from "@/lib/supabase/client";

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
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setRole(null);
        router.push("/");
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
        };
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
                // Removed router.push("/login") to allow guests to view public pages.
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchProfileAndRole, router]);

    // Periodic check for session expiration (in case Supabase does not emit SIGNED_OUT)
    useEffect(() => {
        const check = async () => {
            const valid = await isSessionValid();
            if (!valid) {
                logout();
            }
        };
        const interval = setInterval(check, 300000); // every 5 minutes
        return () => clearInterval(interval);
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, profile, role, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
