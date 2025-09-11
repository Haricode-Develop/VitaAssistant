"use client";
import PillToggle from "./PillToggle";
import ModelControls from "./ModelControls";
import { useAssistantStore } from "@/store/useAssistantStore";
export default function Header() {
    const mode = useAssistantStore(s => s.settings.mode);
    const setMode = useAssistantStore(s => s.setMode);
    return (
        <div className="border-b border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2 mr-2">
                    <div className="w-3 h-3 rounded-full bg-vitalink-primary" />
                    <span className="font-semibold">Vitalink</span>
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-vitalink-primary">Asistente IA</span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-rose-500/10 text-rose-600 border-rose-500/20">Prediagnóstico</span>
                </div>
                <div className="flex-1" />
                <PillToggle value={mode} onChange={setMode} />
                {mode === "playground" && <div className="ml-4"><ModelControls /></div>}
            </div>
        </div>
    );
}
