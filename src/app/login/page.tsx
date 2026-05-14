// src/app/login/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);

    useEffect(() => {
        // Sesión DEMO consistente con tipos esperados
        const demoUser = {
            id_usuario: 0,
            name: "Demo",
            lastName: "User",
            email: "demo@vitalink.es",
            roles: [] as any[],
            instituciones: [] as any[],
            sedes: [] as any[],
        };
        try {
            localStorage.setItem("vl_session", "demo-token");
            localStorage.setItem("vl_user", JSON.stringify(demoUser));
        } catch {}
        setAuth({ isAuthenticated: true, sessionToken: "demo-token", user: demoUser as any });
        router.replace("/");
    }, [router, setAuth]);

    return (
        <div className="min-h-dvh grid place-items-center bg-slate-50 p-6">
            <div className="w-full max-w-md text-center bg-white rounded-2xl shadow border border-slate-200 p-6">
                <h1 className="text-xl font-semibold text-slate-900">Entrando…</h1>
                <p className="text-sm text-slate-600">Redirigiendo al asistente.</p>
            </div>
        </div>
    );
}
