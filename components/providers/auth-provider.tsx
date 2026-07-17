"use client";

import { getProfile, updateProfile } from "@/lib/services/profile.service";
import { getRole } from "@/lib/services/role.service";
import { syncGuestCartToSupabase } from "@/lib/services/cart.service";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { isSessionValid } from "@/lib/supabase/client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IconLock } from "@tabler/icons-react";
import Image from "next/image";

type AuthContextType = {
    user: User | null;
    profile: any;
    role: string | null;
    loading: boolean;
    logout: () => Promise<void>;
    showLockedAlert: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    logout: async () => {},
    showLockedAlert: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [lockedAlertOpen, setLockedAlertOpen] = useState(false);

    const showLockedAlert = useCallback(() => {
        setLockedAlertOpen(true);
    }, []);

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
        if (currentProfile?.is_locked) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setRole(null);
            setLockedAlertOpen(true);
            return;
        }

        const meta = userObj.user_metadata;

        // Only update profile from Google metadata if key fields are truly missing
        // (not on every reload — only when avatar_url is absent from DB)
        if (meta && currentProfile) {
            const googleName = meta.full_name || meta.name;
            const googleAvatar = meta.avatar_url || meta.picture;
            // Strict check: only update if DB fields are null/empty, not just equal to email prefix
            const needsNameUpdate = googleName && !currentProfile.full_name;
            const needsAvatarUpdate = googleAvatar && !currentProfile.avatar_url;

            if (needsNameUpdate || needsAvatarUpdate) {
                const { data: updated } = await updateProfile(userObj.id, {
                    full_name: needsNameUpdate ? googleName : currentProfile.full_name,
                    avatar_url: needsAvatarUpdate ? googleAvatar : currentProfile.avatar_url,
                });
                if (updated) currentProfile = updated;
            }
        }

        // Run getRole in parallel with setProfile (no sequential dependency)
        const rolePromise = currentProfile?.role_id
            ? getRole(currentProfile.role_id)
            : Promise.resolve({ data: null });

        setProfile(currentProfile);

        const { data: roleData } = await rolePromise;
        if (roleData) setRole(roleData.name);
    }, []);

    const lastUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(prev => (prev?.id === user?.id ? prev : user));
            if (user) {
                lastUserIdRef.current = user.id;
                // Run profile fetch and guest cart sync in parallel — no dependency between them
                await Promise.all([
                    fetchProfileAndRole(user),
                    syncGuestCartToSupabase(),
                ]);
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
        <AuthContext.Provider value={{ user, profile, role, loading, logout, showLockedAlert }}>
            {children}
            <AlertDialog open={lockedAlertOpen} onOpenChange={setLockedAlertOpen}>
                <AlertDialogContent className="sm:max-w-md z-[9999]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                            <div className="p-2 rounded-full bg-red-500/10 shrink-0">
                                <Image src="/icons/lock.png" alt="lock" width={24} height={24} />
                            </div>
                            <AlertDialogTitle className="text-xl font-bold">
                                Tài khoản của bạn đã bị khóa
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="space-y-3  text-foreground/90 text-sm">
                            <p>
                                Hệ thống phát hiện tài khoản của bạn hiện đang bị <strong>tạm khóa</strong> do vi phạm điều khoản dịch vụ hoặc yêu cầu bảo mật từ ban quản trị.
                            </p>
                            <div className="bg-red-50 dark:bg-red-950/40 p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 leading-relaxed">
                                <strong>Vui lòng liên hệ bộ phận chăm sóc khách hàng:</strong>
                                <ul className="  list-disc list-inside opacity-90">
                                    <li>Email: <strong>support@luxecommerce.vn</strong></li>
                                    <li>Hotline: <strong>1900 6868</strong> (8:00 - 22:00 hàng ngày)</li>
                                </ul>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                            onClick={() => {
                                setLockedAlertOpen(false);
                                router.push("/");
                            }}
                        >
                            Đã hiểu và quay về Trang chủ
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
