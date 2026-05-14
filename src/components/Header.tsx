"use client";
import PillToggle from "./PillToggle";
import ModelControls from "./ModelControls";
import { useAssistantStore } from "@/store/useAssistantStore";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
    const router = useRouter();

    const mode = useAssistantStore(s => s.settings.mode);
    const setMode = useAssistantStore(s => s.setMode);

    const canUsePlayground = useAuthStore(s => s.canUsePlayground());
    const sessionToken = useAuthStore(s => s.sessionToken);
    const user = useAuthStore(s => s.user);
    const doLogout = useAuthStore(s => s.logout);

    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);

        // Intenta invalidar token en el backend (si existe endpoint /auth/logout)
        try {
            const base = process.env.NEXT_PUBLIC_VITALINK_BASE;
            if (base && sessionToken) {
                await fetch(`${base}/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${sessionToken}`,
                    },
                }).catch(() => {});
            }
        } catch {
            // Ignoramos errores de red: igual cerramos sesión local
        } finally {
            doLogout();        // Limpia Zustand (usuario, token, flag auth)
            setLoggingOut(false);
            router.replace("/login");
        }
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-4">
                {/* Branding */}
                <div className="flex items-center gap-3 min-w-0">
                    <Image src="/vita.png" alt="Vita" width={28} height={28} className="rounded-full" />
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold">Vitalink</span>
                        <span className="text-slate-400">|</span>
                        <span className="font-semibold text-vitalink-primary">Asistente IA</span>
                        <span className="ml-2 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-rose-500/10 text-rose-600 border-rose-500/20">
              Prediagnóstico
            </span>
                    </div>
                </div>

                <div className="flex-1" />

                {/* Toggle de modo (solo si puede usar Playground) */}
                <div className="hidden md:block">
                    {canUsePlayground ? (
                        <PillToggle value={mode} onChange={setMode} />
                    ) : (
                        <span className="text-sm text-slate-600">Vista Usuario</span>
                    )}
                </div>

                {/* Controles de modelo (solo si está en Playground y tiene permiso) */}
                {mode === "playground" && canUsePlayground && (
                    <div className="hidden lg:block ml-4">
                        <ModelControls />
                    </div>
                )}

                {/* Usuario + Cerrar sesión */}
                <div className="ml-2 flex items-center gap-2">
                    {user && (
                        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 bg-white text-sm text-slate-700">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="truncate max-w-[180px]">
                {user.name} {user.lastName}
              </span>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className={`px-3 h-9 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm ${
                            loggingOut ? "opacity-60 pointer-events-none" : ""
                        }`}
                        title="Cerrar sesión"
                    >
                        {loggingOut ? "Saliendo…" : "Cerrar sesión"}
                    </button>
                </div>
            </div>

            {/* Controles compactos en móvil */}
            <div className="md:hidden px-4 pb-3 flex items-center gap-3">
                {canUsePlayground ? (
                    <PillToggle value={mode} onChange={setMode} />
                ) : (
                    <span className="text-sm text-slate-600">Vista Usuario</span>
                )}
                {mode === "playground" && canUsePlayground && <div className="ml-auto"><ModelControls /></div>}
            </div>
        </header>
    );
}
