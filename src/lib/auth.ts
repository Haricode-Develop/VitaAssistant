// src/lib/auth.ts
export type LoginResult =
    | { ok: true; data: any }
    | { ok: false; error: string };

export async function loginVitalink(email: string, password: string): Promise<LoginResult> {
    const base = process.env.NEXT_PUBLIC_VITALINK_BASE;
    if (!base) return { ok: false, error: "NEXT_PUBLIC_VITALINK_BASE no está configurado." };

    try {
        const res = await fetch(`${base}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Si tu BE usa cookies, añade credentials: "include"
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.success) {
            return { ok: false, error: data?.error || `Error ${res.status}` };
        }

        return { ok: true, data };
    } catch (e: any) {
        return { ok: false, error: String(e?.message || e) };
    }
}
