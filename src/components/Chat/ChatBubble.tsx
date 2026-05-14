import Image from "next/image";
import Markdown from "@/lib/markdown";

type Mode = "playground" | "usuario";

/* ------- helpers existentes (JSON + normalizaciones) ------- */
function extractJsonAndSummary(text: string): { data: any | null; summary: string } {
    const fenced = /```json\s*([\s\S]*?)\s*```/i.exec(text) || /```\s*([\s\S]*?)\s*```/i.exec(text);
    if (fenced) {
        let data: any = null;
        try { data = JSON.parse(fenced[1]); } catch { data = null; }
        let summary = text.replace(fenced[0], "").trim();
        summary = summary.replace(/^Resumen:\s*/i, "").trim();
        return { data, summary };
    }

    const tryExtractBalanced = (src: string, opener: "{" | "[", closer: "}" | "]") => {
        const start = src.indexOf(opener);
        if (start === -1) return null;
        for (let end = src.lastIndexOf(closer); end > start; end = src.lastIndexOf(closer, end - 1)) {
            const candidate = src.slice(start, end + 1).trim();
            try {
                const parsed = JSON.parse(candidate);
                let summary = (src.slice(0, start) + src.slice(end + 1)).trim();
                summary = summary.replace(/^Resumen:\s*/i, "").trim();
                return { data: parsed, summary };
            } catch {}
        }
        return null;
    };
    const obj = tryExtractBalanced(text, "{", "}");
    if (obj) return obj;
    const arr = tryExtractBalanced(text, "[", "]");
    if (arr) return arr;
    return { data: null, summary: text.trim() };
}

function normalizeTriage(t?: string) {
    const raw = (t || "").toLowerCase().trim();
    const map: Record<string, string> = {
        urgente: "urgente", emergency: "urgente",
        programar_cita: "programar_cita", consulta: "programar_cita", cita: "programar_cita",
        autocuidado: "autocuidado", estable: "autocuidado", leve: "autocuidado",
        insuficiente: "insuficiente", unknown: "insuficiente",
    };
    return (map[raw] as "urgente" | "programar_cita" | "autocuidado" | "insuficiente") || "autocuidado";
}

function triageStyles(t: "urgente" | "programar_cita" | "autocuidado" | "insuficiente") {
    if (t === "urgente") return { chip: "bg-rose-600/10 text-rose-700 border-rose-600/20", dot: "bg-rose-500" };
    if (t === "programar_cita") return { chip: "bg-amber-500/10 text-amber-700 border-amber-500/20", dot: "bg-amber-500" };
    if (t === "insuficiente") return { chip: "bg-slate-500/10 text-slate-700 border-slate-500/20", dot: "bg-slate-400" };
    return { chip: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", dot: "bg-emerald-500" };
}

type DiffItem = { label: string; p: number };
function buildDifferential(data: any): DiffItem[] {
    const raw = data?.differential;
    const norm = (x: any): DiffItem | null => {
        if (!x) return null;
        const label = String(x.label ?? x.name ?? x.diagnosis ?? "").trim();
        let p = Number(x.prob ?? x.probability ?? x.percent ?? x.p ?? NaN);
        if (!label) return null;
        if (Number.isFinite(p)) {
            if (p > 1) p = p / 100;
            if (p < 0) p = 0;
            if (p > 1) p = 1;
            return { label, p };
        }
        return null;
    };

    let list: DiffItem[] = [];
    if (Array.isArray(raw)) list = raw.map(norm).filter(Boolean) as DiffItem[];
    if (!list.length && Array.isArray(data?.possible_categories)) {
        const cats = data.possible_categories.slice(0, 6).map((c: any) => String(c));
        const fallback = [0.45, 0.25, 0.15, 0.08, 0.05, 0.02];
        list = cats.map((label: string, i: number) => ({ label, p: fallback[i] ?? 0.02 }));
    }
    const sum = list.reduce((a, b) => a + b.p, 0) || 1;
    list = list.map(x => ({ ...x, p: Math.max(0, Math.min(1, x.p / sum)) }));
    list.sort((a, b) => b.p - a.p);
    return list;
}

function RiskPill({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1">
      <span className="h-2 w-20 bg-slate-200 rounded-full overflow-hidden">
        <span className="block h-2 bg-blue-600" style={{ width: `${pct}%` }} />
      </span>
            <span className="text-xs text-slate-700 tabular-nums">{pct}%</span>
        </div>
    );
}

function DiffRow({ item, rank, maxRank }: { item: DiffItem; rank: number; maxRank: number }) {
    const opacity = 1 - rank / (maxRank * 1.25);
    const pct = Math.round(item.p * 100);
    return (
        <div className="mb-1.5">
            <div className="flex items-center justify-between text-xs text-slate-700 mb-0.5">
                <span className="truncate">{item.label}</span>
                <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: `${pct}%`, opacity }} />
            </div>
        </div>
    );
}

/* ======================================================== */

export default function ChatBubble({
                                       mode, role, content, timestamp,
                                   }: { mode: Mode; role: "assistant" | "user"; content: string; timestamp: number; }) {
    const isUser = role === "user";

    /* ===== Usuario (derecha) ===== */
    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="w-[92%] sm:w-[85%] md:w-[80%] rounded-2xl px-4 py-3 shadow-soft border text-sm leading-relaxed whitespace-pre-wrap bg-blue-600 text-white border-blue-700 rounded-br-sm">
                    <Markdown text={content} />
                    <div className="text-[11px] mt-2 text-blue-100">{new Date(timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        );
    }

    /* Avatar Vita para TODAS las respuestas del asistente */
    const VitaAvatar = (
        <div className="shrink-0 w-8 h-8 rounded-full bg-vitalink-primary/10 border border-slate-200 overflow-hidden flex items-center justify-center">
            <Image src="/vita.png" alt="Vita" width={32} height={32} className="object-cover" />
        </div>
    );

    /* ===== Playground: muestra Markdown completo (con avatar) ===== */
    if (mode === "playground") {
        return (
            <div className="flex items-start gap-3">
                {VitaAvatar}
                <div className="w-[92%] sm:w-[85%] md:w-[80%] rounded-2xl px-4 py-3 shadow-soft border text-sm bg-white text-slate-800 border-slate-200 rounded-bl-sm">
                    <Markdown text={content} />
                    <div className="text-[11px] mt-2 text-slate-500">{new Date(timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        );
    }

    /* ===== Vista Usuario (conversión a UI) ===== */
    const { data, summary } = extractJsonAndSummary(content);

    if (!data) {
        return (
            <div className="flex items-start gap-3">
                {VitaAvatar}
                <div className="w-[92%] sm:w-[85%] md:w-[80%] rounded-2xl px-4 py-3 shadow-soft border text-sm bg-white text-slate-800 border-slate-200 rounded-bl-sm">
                    <Markdown text={summary || content} />
                    <div className="text-[11px] mt-2 text-slate-500">{new Date(timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        );
    }

    const triage = normalizeTriage(data.triage);
    const s = triageStyles(triage);
    let score = Number(data.risk_score);
    if (!Number.isFinite(score)) score = 0.3;
    if (score < 0) score = 0;
    if (score > 1) score = 1;

    const differential = buildDifferential(data);

    return (
        <div className="flex items-start gap-3">
            {VitaAvatar}
            <div className="w-[92%] sm:w-[85%] md:w-[80%] rounded-2xl px-4 py-3 shadow-soft border text-sm bg-white text-slate-800 border-slate-200 rounded-bl-sm">
                {/* encabezado: triage + riesgo */}
                <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs border capitalize ${s.chip}`}>
              {triage.replace("_", " ")}
            </span>
                        <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
                    </div>
                    <RiskPill score={score} />
                </div>

                {/* Diagnóstico diferencial */}
                {!!differential.length && (
                    <div className="mb-3">
                        <div className="text-xs text-slate-600 mb-1">Diagnóstico diferencial</div>
                        <div>{differential.map((d, i) => (
                            <DiffRow key={`${d.label}-${i}`} item={d} rank={i} maxRank={Math.max(1, differential.length - 1)} />
                        ))}</div>
                    </div>
                )}

                {/* Categorías relacionadas */}
                {Array.isArray(data.possible_categories) && data.possible_categories.length > 0 && (
                    <div className="mb-2">
                        <div className="text-xs text-slate-600 mb-1">Categorías relacionadas</div>
                        <div className="flex flex-wrap gap-2">
                            {data.possible_categories.map((c: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-full text-xs border bg-blue-600/10 text-blue-700 border-blue-600/20">
                  {c}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Red flags */}
                {Array.isArray(data.red_flags) && data.red_flags.length > 0 && (
                    <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 p-2">
                        <div className="text-xs font-medium text-rose-700 mb-1">Señales de alarma</div>
                        <ul className="list-disc pl-5 text-sm text-rose-700">
                            {data.red_flags.map((r: string, i: number) => (<li key={i}>{r}</li>))}
                        </ul>
                    </div>
                )}

                {/* Siguientes pasos */}
                {Array.isArray(data.next_steps) && data.next_steps.length > 0 && (
                    <div className="mb-2">
                        <div className="text-xs text-slate-600 mb-1">Siguientes pasos</div>
                        <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                            {data.next_steps.map((s: string, i: number) => (<li key={i}>{s}</li>))}
                        </ol>
                    </div>
                )}

                {/* Resumen explicativo */}
                {summary && <div className="text-sm text-slate-800 mt-2"><Markdown text={summary} /></div>}

                {/* Disclaimer */}
                {typeof data.disclaimer === "string" && (
                    <div className="text-xs text-slate-500 italic mt-2">{data.disclaimer}</div>
                )}

                <div className="text-[11px] mt-2 text-slate-500">{new Date(timestamp).toLocaleTimeString()}</div>
            </div>
        </div>
    );
}
