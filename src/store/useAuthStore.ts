// src/store/useAuthStore.ts
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type VitalinkRole = { id: number; name: string };
export type VitalinkUser = {
    id_usuario: number;
    name: string;
    lastName: string;
    email?: string;
    roles: VitalinkRole[];
    instituciones?: any[];
    sedes?: any[];
};

type AuthState = {
    isAuthenticated: boolean;
    sessionToken: string | null;
    user: VitalinkUser | null;

    // Permisos derivados
    canUsePlayground: () => boolean; // rol 4
    isTipo2: () => boolean;          // rol 2

    // acciones
    setAuth: (payload: {
        sessionToken: string | null;
        user: VitalinkUser | null;
        isAuthenticated: boolean;
    }) => void;
    logout: () => void;
};

const storage = typeof window !== "undefined" ? createJSONStorage(() => localStorage) : undefined;

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            sessionToken: null,
            user: null,

            canUsePlayground: () => {
                const u = get().user;
                return !!u?.roles?.some(r => r.id === 4);
            },
            isTipo2: () => {
                const u = get().user;
                return !!u?.roles?.some(r => r.id === 2);
            },

            setAuth: ({ sessionToken, user, isAuthenticated }) =>
                set({ sessionToken, user, isAuthenticated }),

            logout: () => set({ sessionToken: null, user: null, isAuthenticated: false }),
        }),
        { name: "vlk_auth_store", storage }
    )
);
