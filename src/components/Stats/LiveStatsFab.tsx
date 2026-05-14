// src/components/Stats/LiveStatsFab.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useAssistantStore } from "@/store/useAssistantStore";
import {
    computeStats,
    formatMs,
    Triage,
} from "@/lib/stats";
import Image from "next/image";

function triageBadgeColor(t?: Triage) {
    if (!t) return "bg-slate-500/10 text-slate-700 border-slate-500/20";
    if (t === "urgente") return "bg-rose-600/10 text-rose-700 border-rose-600/20";
    if (t === "programar_cita") return "bg-amber-500/10 text-amber-700 border-amber-500/20";
    if (t === "insuficiente") return "bg-slate-500/10 text-slate-700 border-slate-500/20";
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
}

function RiskSparkline({ values }: { values: number[] }) {
    if (!values?.length) return <div className="text-xs text-slate-500">Sin datos</div>;
    const max = Math.max(1, ...values);
    return (
        <div className="flex items-end gap-1 h-10">
            {values.map((v, i) => {
                const h = Math.max(2, Math.round((v / max) * 36));
                return (
                    <div
                        key={i}
                        className="w-2 bg-gradient-to-t from-blue-600 to-indigo-600 rounded-sm"
                        style={{ height: `${h}px`, opacity: 0.8 - i * 0.04 }}
                        title={`${Math.round(v * 100)}%`}
                    />
                );
            })}
        </div>
    );
}

export default function LiveStatsFab() {
    const conversations = useAssistantStore(s => s.conversations);
    const activeId = useAssistantStore(s => s.activeId);

    // tick para refrescar "hace X min" automáticamente
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 30000); // cada 30s
        return () => clearInterval(id);
    }, []);

    const stats = useMemo(() => computeStats(conversations, activeId), [conversations, activeId, tick]);
    const urgent = stats.current.triage === "urgente" || (stats.current.redFlags?.length || 0) > 0;

    const [open, setOpen] = useState(false);

    return (
        <>
            {/* FAB */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-4 right-4 z-50 rounded-full shadow-soft border border-slate-200 bg-white px-3 py-2 pl-2 flex items-center gap-2"
                aria-label="Estadísticas en vivo"
            >
        <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-vitalink-primary/10 border border-slate-200 overflow-hidden">
          <Image src="/vita.png" alt="Vita" width={32} height={32} />
            {urgent && (
                <span className="absolute inset-0 rounded-full ring-2 ring-rose-400/60 animate-ping pointer-events-none" />
            )}
        </span>
                <div className="hidden sm:block text-left">
                    <div className="text-[11px] text-slate-500 leading-none">Caso actual</div>
                    <div className="text-xs font-medium text-slate-900">
                        {stats.current.triage
                            ? stats.current.triage.replace("_", " ")
                            : "Sin evaluación"}
                    </div>
                </div>
            </button>

            {/* Panel */}
            {open && (
                <div
                    className="fixed bottom-20 right-4 left-4 md:left-auto md:w-[420px] z-50 card"
                    role="dialog"
                    aria-label="Panel de estadísticas"
                >
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">Estadísticas en vivo</h3>
                        <button
                            className="text-slate-500 hover:text-slate-700"
                            onClick={() => setOpen(false)}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto panel-scroll">
                        {/* Caso actual */}
                        <section>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-slate-900">Caso actual</h4>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs border capitalize ${triageBadgeColor(
                                        stats.current.triage
                                    )}`}
                                >
                  {stats.current.triage
                      ? stats.current.triage.replace("_", " ")
                      : "sin datos"}
                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Riesgo actual</div>
                                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-2 bg-blue-600"
                                            style={{ width: `${Math.round((stats.current.risk || 0) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        {Math.round((stats.current.risk || 0) * 100)}%
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Red flags</div>
                                    <div className="mt-2 text-lg font-semibold text-slate-900">
                                        {stats.current.redFlags?.length ?? 0}
                                    </div>
                                    {stats.current.redFlags && stats.current.redFlags.length > 0 && (
                                        <ul className="mt-1 text-xs text-rose-700 list-disc pl-4 max-h-16 overflow-y-auto">
                                            {stats.current.redFlags.slice(0, 4).map((r, i) => (
                                                <li key={i}>{r}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white col-span-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-slate-500">Tendencia de riesgo</div>
                                        <div className="text-[11px] text-slate-500">
                                            Últimas {stats.current.riskTrend?.length || 0} resp.
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <RiskSparkline values={stats.current.riskTrend || []} />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Tiempo desde última respuesta</div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">
                                        {formatMs(stats.current.timeSinceLastAssistant ?? NaN)}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Turnos en el caso</div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">
                                        {stats.current.turns ?? 0}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Hoy */}
                        <section>
                            <h4 className="text-sm font-medium text-slate-900 mb-2">Hoy</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Pacientes atendidos</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-900">
                                        {stats.today.casesToday}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Riesgo promedio</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-900">
                                        {stats.today.avgRisk !== null
                                            ? `${Math.round(stats.today.avgRisk * 100)}%`
                                            : "—"}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">% con red flags</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-900">
                                        {stats.today.redFlagRate !== null
                                            ? `${Math.round(stats.today.redFlagRate * 100)}%`
                                            : "—"}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Mediana respuesta</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-900">
                                        {formatMs(stats.today.medianRespMs ?? NaN)}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white col-span-2">
                                    <div className="text-xs text-slate-500 mb-1">Distribución de triage</div>
                                    <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs border bg-rose-600/10 text-rose-700 border-rose-600/20">
                      Urgente: {stats.today.triageCounts.urgente}
                    </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs border bg-amber-500/10 text-amber-700 border-amber-500/20">
                      Cita: {stats.today.triageCounts.programar_cita}
                    </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs border bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                      Autocuidado: {stats.today.triageCounts.autocuidado}
                    </span>
                                        <span className="px-2 py-0.5 rounded-full text-xs border bg-slate-500/10 text-slate-700 border-slate-500/20">
                      Insuficiente: {stats.today.triageCounts.insuficiente}
                    </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Tokens out (hoy)</div>
                                    <div className="mt-1 text-lg font-semibold text-slate-900">
                                        {stats.today.tokensOutSum}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                                    <div className="text-xs text-slate-500">Top red flags (hoy)</div>
                                    {stats.today.topRedFlags.length ? (
                                        <ul className="mt-1 text-xs text-slate-800 space-y-1 max-h-16 overflow-y-auto">
                                            {stats.today.topRedFlags.map((x, i) => (
                                                <li key={i} className="flex items-center justify-between">
                                                    <span className="truncate">{x.label}</span>
                                                    <span className="ml-2 text-slate-500">×{x.count}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="mt-1 text-xs text-slate-500">Sin incidencias</div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </>
    );
}
