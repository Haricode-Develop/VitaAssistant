"use client";
import { useAssistantStore } from "@/store/useAssistantStore";
import ChatBubble from "./ChatBubble";
import Thinking from "./Thinking";
import { useEffect, useRef, useState } from "react";
import { callPrediagnosis } from "@/lib/api";
export default function Chat({ mode }: { mode: "playground" | "usuario" }) {
    const active = useAssistantStore(s => s.activeConversation());
    const addMessage = useAssistantStore(s => s.addMessage);
    const settings = useAssistantStore(s => s.settings);
    const resetActive = useAssistantStore(s => s.resetActive);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, [active?.messages]);
    if (!active) return null;
    const send = async () => {
        if (!input.trim() || sending) return;
        const user = { id: crypto.randomUUID(), role: "user" as const, content: input.trim(), timestamp: Date.now(), model: settings.model };
        addMessage(user);
        setInput("");
        setSending(true);
        const history = active.messages.concat(user).slice(-16).map(m => ({ role: m.role, content: m.content }));
        const res = await callPrediagnosis({ model: settings.model, temperature: settings.temperature, maxTokens: settings.maxTokens, systemPrompt: active.systemPrompt, messages: [{ role: "assistant", content: active.systemPrompt }, ...history] });
        if ("error" in res) addMessage({ id: crypto.randomUUID(), role: "assistant", content: `⚠️ Error: ${res.error}`, timestamp: Date.now(), model: settings.model });
        else addMessage({ id: crypto.randomUUID(), role: "assistant", content: res.content, timestamp: Date.now(), model: settings.model, tokensOut: res.tokensOut });
        setSending(false);
    };
    return (
        <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-3">
                <h2 className="font-semibold text-slate-900">{active.patientName}</h2>
                <span className="text-slate-400">•</span>
                <span className="text-sm text-slate-600">{mode === "playground" ? active.model : "Asistente de Prediagnóstico"}</span>
                <div className="flex-1" />
                <button onClick={resetActive} className="px-3 h-9 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Limpiar</button>
            </div>
            <div ref={ref} className="flex-1 overflow-y-auto p-6 space-y-3 bg-vitalink-bg">
                {active.messages.map(m => (<ChatBubble key={m.id} role={m.role} content={m.content} timestamp={m.timestamp} />))}
                {sending && <Thinking />}
            </div>
            <div className="border-t border-slate-200 bg-white p-4">
                <div className="rounded-2xl border border-slate-200 bg-white focus-within:border-blue-400">
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Síntomas, duración, antecedentes, signos vitales…" className="w-full min-h-[84px] max-h-64 resize-y rounded-2xl p-4 outline-none" />
                    <div className="p-3 flex items-center justify-between">
                        <div className="text-xs text-slate-500">Enter para enviar · Shift+Enter para nueva línea</div>
                        <div className="flex items-center gap-2">
                            <button onClick={send} disabled={sending} className={`px-4 h-10 rounded-xl text-white ${sending ? "opacity-50" : ""} bg-vitalink-primary`}>{sending ? "Enviando…" : "Enviar"}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
