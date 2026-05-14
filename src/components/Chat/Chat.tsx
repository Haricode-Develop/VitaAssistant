// src/components/Chat/Chat.tsx
"use client";
import { useAssistantStore } from "@/store/useAssistantStore";
import ChatBubble from "./ChatBubble";
import Thinking from "./Thinking";
import { useEffect, useRef, useState } from "react";
import { callPrediagnosis } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function Chat({ mode }: { mode: "playground" | "usuario" }) {
    const active = useAssistantStore(s => s.activeConversation());
    const addMessage = useAssistantStore(s => s.addMessage);
    const settings = useAssistantStore(s => s.settings);
    const resetActive = useAssistantStore(s => s.resetActive);
    const canUsePlayground = useAuthStore(s => s.canUsePlayground());

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
    }, [active?.messages]);

    if (!active) return null;

    const effectiveModel = canUsePlayground ? settings.model : "openai:gpt-4.1";

    const send = async () => {
        if (!input.trim() || sending) return;
        const user = {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: input.trim(),
            timestamp: Date.now(),
            model: effectiveModel,
        };
        addMessage(user);
        setInput("");
        setSending(true);

        const history = active.messages.concat(user).slice(-16).map(m => ({ role: m.role, content: m.content }));

        const res = await callPrediagnosis({
            model: effectiveModel,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
            systemPrompt: active.systemPrompt,
            messages: history,
        });

        if ("error" in res) {
            addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content: `⚠️ Error: ${res.error}`,
                timestamp: Date.now(),
                model: effectiveModel,
            });
        } else {
            addMessage({
                id: crypto.randomUUID(),
                role: "assistant",
                content: res.content,
                timestamp: Date.now(),
                model: effectiveModel,
                tokensOut: res.tokensOut,
            });
        }
        setSending(false);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Encabezado del panel del chat */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
                <h2 className="font-semibold text-slate-900 truncate">{active.patientName}</h2>
                <span className="text-slate-400">•</span>
                <span className="text-sm text-slate-600 truncate">
          {mode === "playground" && canUsePlayground ? active.model : "Asistente de Prediagnóstico (GPT-4.1)"}
        </span>
                <div className="flex-1" />
                <button onClick={resetActive} className="px-3 h-9 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">
                    Limpiar
                </button>
            </div>

            {/* Mensajes */}
            <div ref={ref} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 bg-vitalink-bg panel-scroll">
                {active.messages.map(m => (
                    <ChatBubble key={m.id} mode={mode} role={m.role} content={m.content} timestamp={m.timestamp} />
                ))}
                {sending && <Thinking />}
            </div>

            {/* Input sticky */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white p-3 sm:p-4">
                <div className="rounded-2xl border border-slate-200 bg-white focus-within:border-blue-400">
          <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Síntomas, duración, antecedentes, signos vitales…"
              className="w-full min-h-[84px] max-h-64 resize-y rounded-2xl p-4 outline-none"
          />
                    <div className="p-3 flex items-center justify-between">
                        <div className="text-xs text-slate-500">Enter para enviar · Shift+Enter para nueva línea</div>
                        <div className="flex items-center gap-2">
                            <button onClick={send} disabled={sending} className={`px-4 h-10 rounded-xl text-white ${sending ? "opacity-50" : ""} bg-vitalink-primary`}>
                                {sending ? "Enviando…" : "Enviar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
