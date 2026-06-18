"use client"

import { useEffect } from "react";
import { useAuth } from "../providers/auth-provider";
import { useRouter } from "next/navigation";

type RoleGuardProps = {
    allowedRoles: string[];
    children: React.ReactNode;
}


export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const router = useRouter()
    const { role, loading, setSessionExpired } = useAuth();

    const isAllowed = role !== null && allowedRoles.includes(role);

    useEffect(() => {
        if (loading) return;

        if (!isAllowed) {
            setSessionExpired(true);
        }
    }, [isAllowed, loading, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAllowed) {
        return <div className="text-xl font-bold">You do not have access.</div>;
    }

    return <>{children}</>;
}