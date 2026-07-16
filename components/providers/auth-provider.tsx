"use client";

import { getProfile, updateProfile } from "@/lib/services/profile.service";
import { getRole } from "@/lib/services/role.service";
import { syncGuestCartToSupabase } from "@/lib/services/cart.service";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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
    const fetchProfileAndRole = useCallback(async (userObj: User) => {
        const { data, error } = await getProfile(userObj.id);
        if (error) {
            console.error(error);
            return;
        }
        
        let currentProfile = data;
        const meta = userObj.user_metadata;
        if (meta && currentProfile) {
            const googleName = meta.full_name || meta.name;
            const googleAvatar = meta.avatar_url || meta.picture;
            const emailPrefix = currentProfile.email?.split('@')[0];
            
            const needsNameUpdate = googleName && (!currentProfile.full_name || currentProfile.full_name === emailPrefix);
            const needsAvatarUpdate = googleAvatar && !currentProfile.avatar_url;

            if (needsNameUpdate || needsAvatarUpdate) {
                const { data: updated } = await updateProfile(userObj.id, {
                    full_name: needsNameUpdate ? googleName : currentProfile.full_name,
                    avatar_url: needsAvatarUpdate ? googleAvatar : currentProfile.avatar_url,
                });
                if (updated) currentProfile = updated;
            }
        }

        setProfile(currentProfile);
        if (currentProfile?.role_id) {
            const { data: role } = await getRole(currentProfile.role_id);
            if (role) setRole(role.name);
        }
    }, []);

    const lastUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(prev => (prev?.id === user?.id ? prev : user));
            if (user) {
                lastUserIdRef.current = user.id;
                await fetchProfileAndRole(user);
                await syncGuestCartToSupabase();
            }
            setLoading(false);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(prev => (prev?.id === currentUser?.id ? prev : currentUser));

            if (currentUser && currentUser.id !== lastUserIdRef.current) {
                lastUserIdRef.current = currentUser.id;
                await fetchProfileAndRole(currentUser);
                const { mergedCount } = await syncGuestCartToSupabase();
                if (mergedCount > 0) {
                    window.dispatchEvent(new Event("cart-updated"));
                }
                if (typeof window !== "undefined" && window.location.pathname === "/cart") {
                    router.push("/checkout");
                }
            }

            if (event === "SIGNED_OUT") {
                lastUserIdRef.current = null;
                setProfile(null);
                setRole(null);
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
