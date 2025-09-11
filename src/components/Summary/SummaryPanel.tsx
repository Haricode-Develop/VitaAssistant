"use client";
import { useAssistantStore } from "@/store/useAssistantStore";
export default function SummaryPanel() {
    const lastJSON = useAssistantStore(s => s.lastAssistantJSON());
    if (!lastJSON) return <div className="p-4 text-sm text-slate-600">Aún no hay un resultado estructurado.</div>;
    const triage = lastJSON.triage as string | undefined;
    const color = triage === "urgente" ? "bg-rose-500" : triage === "programar_cita" ? "bg-amber-500" : "bg-emerald-500";
    const score = typeof lastJSON.risk_score === "number" ? Math.max(0, Math.min(1, lastJSON.risk_score)) : 0.3;
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2"><span className={`inline-block w-2 h-2 rounded-full ${color}`} /><span className="font-medium">Triage:</span><span className="capitalize">{triage}</span></div>
            <div>
                <div className="text-xs text-slate-600 mb-1">Riesgo</div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-2 bg-blue-600" style={{ width: `${score * 100}%` }} /></div>
                <div className="text-xs text-slate-500 mt-1">{Math.round(score * 100)}%</div>
            </div>
            {Array.isArray(lastJSON.possible_categories) && (
                <div>
                    <div className="text-xs text-slate-600 mb-1">Posibles categorías</div>
                    <div className="flex flex-wrap gap-2">
                        {lastJSON.possible_categories.map((c: string, i: number) => (<span key={i} className="px-2 py-0.5 rounded-full text-xs border bg-blue-600/10 text-blue-700 border-blue-600/20">{c}</span>))}
                    </div>
                </div>
            )}
            {Array.isArray(lastJSON.red_flags) && lastJSON.red_flags.length > 0 && (
                <div>
                    <div className="text-xs text-slate-600 mb-1">Señales de alarma</div>
                    <ul className="list-disc pl-5 text-sm text-rose-600">{lastJSON.red_flags.map((r: string, i: number) => (<li key={i}>{r}</li>))}</ul>
                </div>
            )}
            {Array.isArray(lastJSON.next_steps) && (
                <div>
                    <div className="text-xs text-slate-600 mb-1">Siguientes pasos</div>
                    <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">{lastJSON.next_steps.map((s: string, i: number) => (<li key={i}>{s}</li>))}</ol>
                </div>
            )}
            {typeof lastJSON.disclaimer === "string" && (<div className="text-xs text-slate-500 italic">{lastJSON.disclaimer}</div>)}
        </div>
    );
}
