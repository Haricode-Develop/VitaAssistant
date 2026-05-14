// src/lib/stats.ts
import { Conversation, Message } from "@/lib/types";

/** ---------- Utilidades de tiempo ---------- */
export function startOfToday(ts: number = Date.now()): number {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}
export function endOfToday(ts: number = Date.now()): number {
    const d = new Date(ts);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
}
export function isToday(ts: number): boolean {
    const t0 = startOfToday();
    const t1 = endOfToday();
    return ts >= t0 && ts <= t1;
}
export function formatMs(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) return "—";
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    if (m < 60) return `${m}m ${r}s`;
    const h = Math.floor(m / 60);
    const mr = m % 60;
    return `${h}h ${mr}m`;
}

/** ---------- Parseo de JSON clínico desde los mensajes ---------- */
export function extractJsonPayload(text: string): any | null {
    if (!text) return null;

    const fenced =
        /```json\s*([\s\S]*?)\s*```/i.exec(text) ||
        /```\s*([\s\S]*?)\s*```/i.exec(text);
    if (fenced) {
        try {
            return JSON.parse(fenced[1]);
        } catch {
            /* ignore */
        }
    }

    // Fallback: intento balanceado { ... } o [ ... ]
    const tryExtractBalanced = (src: string, opener: "{" | "[", closer: "}" | "]") => {
        const start = src.indexOf(opener);
        if (start === -1) return null;
        for (
            let end = src.lastIndexOf(closer);
            end > start;
            end = src.lastIndexOf(closer, end - 1)
        ) {
            const candidate = src.slice(start, end + 1).trim();
            try {
                return JSON.parse(candidate);
            } catch {}
        }
        return null;
    };

    return (
        tryExtractBalanced(text, "{", "}") ||
        tryExtractBalanced(text, "[", "]") ||
        null
    );
}

export type Triage =
    | "urgente"
    | "programar_cita"
    | "autocuidado"
    | "insuficiente";

export function normalizeTriage(t?: string): Triage {
    const raw = (t || "").toLowerCase().trim();
    const map: Record<string, Triage> = {
        urgente: "urgente",
        emergency: "urgente",
        programar_cita: "programar_cita",
        consulta: "programar_cita",
        cita: "programar_cita",
        autocuidado: "autocuidado",
        estable: "autocuidado",
        leve: "autocuidado",
        insuficiente: "insuficiente",
        unknown: "insuficiente",
    };
    return map[raw] || "autocuidado";
}

export type AssistantSnapshot = {
    triage: Triage;
    risk: number; // 0..1
    redFlags: string[];
    tokensOut?: number;
    at: number; // timestamp
};

export function getAssistantSnapshots(messages: Message[]): AssistantSnapshot[] {
    const out: AssistantSnapshot[] = [];
    for (const m of messages) {
        if (m.role !== "assistant" || !m.content) continue;
        const data = extractJsonPayload(m.content);
        if (!data) continue;
        let r = Number(data?.risk_score);
        if (!Number.isFinite(r)) r = 0;
        if (r < 0) r = 0;
        if (r > 1) r = 1;
        const triage = normalizeTriage(String(data?.triage || ""));
        const red = Array.isArray(data?.red_flags) ? data.red_flags.map(String) : [];
        out.push({
            triage,
            risk: r,
            redFlags: red,
            tokensOut: Number.isFinite(m.tokensOut) ? m.tokensOut : undefined,
            at: m.timestamp,
        });
    }
    return out;
}

export function lastAssistantSnapshot(messages: Message[]): AssistantSnapshot | null {
    const snaps = getAssistantSnapshots(messages);
    if (!snaps.length) return null;
    return snaps[snaps.length - 1];
}

export function median(values: number[]): number {
    if (!values.length) return NaN;
    const arr = [...values].sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

export type TodayStats = {
    casesToday: number;
    triageCounts: Record<Triage, number>;
    avgRisk: number | null;
    redFlagRate: number | null; // 0..1
    medianRespMs: number | null;
    tokensOutSum: number;
    topRedFlags: { label: string; count: number }[];
};

export type CurrentCaseStats = {
    hasData: boolean;
    triage?: Triage;
    risk?: number;
    redFlags?: string[];
    riskTrend?: number[]; // últimas 10 respuestas del asistente en el caso
    timeSinceLastAssistant?: number; // ms
    turns?: number; // mensajes usuario en el caso
};

export type LiveStats = {
    now: number;
    current: CurrentCaseStats;
    today: TodayStats;
};

export function computeStats(conversations: Conversation[], activeId: string | null, now: number = Date.now()): LiveStats {
    // ---------- Caso actual ----------
    const active = conversations.find(c => c.id === activeId) || null;
    let current: CurrentCaseStats = { hasData: false };

    if (active) {
        const snaps = getAssistantSnapshots(active.messages);
        const last = snaps[snaps.length - 1];
        const riskTrend = snaps.slice(-10).map(s => s.risk);
        const lastAssistantMsg = [...active.messages].reverse().find(m => m.role === "assistant");

        current = {
            hasData: !!last,
            triage: last?.triage,
            risk: last?.risk,
            redFlags: last?.redFlags || [],
            riskTrend,
            timeSinceLastAssistant: lastAssistantMsg ? now - lastAssistantMsg.timestamp : undefined,
            turns: active.messages.filter(m => m.role === "user").length,
        };
    }

    // ---------- Hoy ----------
    const t0 = startOfToday(now);
    const t1 = endOfToday(now);

    // Casos "de hoy" = conversaciones con última respuesta del asistente HOY
    const todaySnaps: AssistantSnapshot[] = [];
    const responseMs: number[] = [];
    let tokensOutSum = 0;

    const triageCounts: Record<Triage, number> = {
        urgente: 0,
        programar_cita: 0,
        autocuidado: 0,
        insuficiente: 0,
    };

    const redFlagBag = new Map<string, number>();

    for (const c of conversations) {
        const snaps = getAssistantSnapshots(c.messages).filter(s => s.at >= t0 && s.at <= t1);
        if (snaps.length) {
            const last = snaps[snaps.length - 1];
            triageCounts[last.triage] += 1;
            todaySnaps.push(...snaps);
            for (const s of snaps) tokensOutSum += s.tokensOut || 0;
            for (const rf of last.redFlags || []) {
                redFlagBag.set(rf, (redFlagBag.get(rf) || 0) + 1);
            }
        }

        // tiempos de respuesta (pares user -> siguiente assistant) si la respuesta es HOY
        const msgs = c.messages;
        for (let i = 0; i < msgs.length - 1; i++) {
            const a = msgs[i];
            const b = msgs[i + 1];
            if (a.role === "user" && b.role === "assistant" && b.timestamp >= t0 && b.timestamp <= t1) {
                responseMs.push(b.timestamp - a.timestamp);
            }
        }
    }

    const casesToday = Object.values(triageCounts).reduce((a, b) => a + b, 0);
    const avgRisk =
        todaySnaps.length ? todaySnaps.reduce((a, b) => a + b.risk, 0) / todaySnaps.length : null;
    const redFlagRate =
        casesToday
            ? todaySnaps.filter((s, idx, arr) => {
            // contamos por conversación-último? Para simplificar, contamos respuestas con red flags>0
            return (s.redFlags || []).length > 0;
        }).length / todaySnaps.length
            : null;

    const topRedFlags = [...redFlagBag.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => ({ label, count }));

    const today: TodayStats = {
        casesToday,
        triageCounts,
        avgRisk,
        redFlagRate,
        medianRespMs: responseMs.length ? median(responseMs) : null,
        tokensOutSum,
        topRedFlags,
    };

    return { now, current, today };
}
