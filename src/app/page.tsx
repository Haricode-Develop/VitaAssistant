// src/app/page.tsx
"use client";

import Header from "@/components/Header";
import PatientsSidebar from "@/components/Sidebar/PatientsSidebar";
import Chat from "@/components/Chat/Chat";
import SummaryPanel from "@/components/Summary/SummaryPanel";
import { useAssistantStore } from "@/store/useAssistantStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import LiveStatsFab from "@/components/Stats/LiveStatsFab";

export default function Page() {
    const seed = useAssistantStore((s) => s.seedIfEmpty);
    const mode = useAssistantStore((s) => s.settings.mode);
    const setMode = useAssistantStore((s) => s.setMode);

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const setAuth = useAuthStore((s) => s.setAuth);
    const canUsePlayground = useAuthStore((s) => s.canUsePlayground());

    const [booted, setBooted] = useState(false);

    useEffect(() => { seed(); }, [seed]);

    // Fuerza sesión DEMO siempre (con id_usuario y arrays tipados)
    useEffect(() => {
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
            const token = localStorage.getItem("vl_session");
            const rawUser = localStorage.getItem("vl_user");

            if (!token) {
                localStorage.setItem("vl_session", "demo-token");
                localStorage.setItem("vl_user", JSON.stringify(demoUser));
                setAuth({ isAuthenticated: true, sessionToken: "demo-token", user: demoUser as any });
            } else if (!isAuthenticated) {
                // Si existe user guardado pero le falta id_usuario, sobreescribe con demoUser
                let u: any = rawUser ? JSON.parse(rawUser) : null;
                if (!u || typeof u.id_usuario !== "number") {
                    u = demoUser;
                    localStorage.setItem("vl_user", JSON.stringify(u));
                }
                setAuth({ isAuthenticated: true, sessionToken: token, user: u as any });
            }
        } catch {
            // si algo falla, igualmente levanta demo
            setAuth({ isAuthenticated: true, sessionToken: "demo-token", user: demoUser as any });
        } finally {
            setBooted(true);
        }
    }, [isAuthenticated, setAuth]);

    useEffect(() => {
        if (isAuthenticated && !canUsePlayground && mode !== "usuario") {
            setMode("usuario");
        }
    }, [isAuthenticated, canUsePlayground, mode, setMode]);

    if (!booted) return null;

    return (
        <div className="flex flex-col h-dvh">
            <Header />
            <main className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
                <aside className="hidden md:block md:col-span-3 border-r border-slate-200 bg-white min-h-0">
                    <PatientsSidebar />
                </aside>
                <section className="col-span-1 md:col-span-6 min-h-0">
                    <Chat mode={mode} />
                </section>
                <aside className="hidden md:block md:col-span-3 border-l border-slate-200 bg-white min-h-0">
                    <SummaryPanel />
                </aside>
            </main>
            <LiveStatsFab />
        </div>
    );
}
