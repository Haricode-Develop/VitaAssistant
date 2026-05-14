// src/components/ModelControls.tsx
"use client";
import { useAssistantStore } from "@/store/useAssistantStore";
import Modal from "./Modal";
import { useAuthStore } from "@/store/useAuthStore";
import { useState } from "react";

export default function ModelControls() {
    const settings = useAssistantStore(s => s.settings);
    const setSettings = useAssistantStore(s => s.setSettings);
    const systemPrompt = useAssistantStore(s => s.activeConversation()?.systemPrompt || "");
    const setSystemPrompt = useAssistantStore(s => s.setSystemPrompt);
    const resetActive = useAssistantStore(s => s.resetActive);
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(systemPrompt);

    const canUsePlayground = useAuthStore(s => s.canUsePlayground());

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <select
                value={settings.model}
                onChange={e => setSettings({ model: e.target.value })}
                className="h-9 rounded-xl border border-slate-200 px-3 text-sm max-w-[260px]"
                disabled={!canUsePlayground}
                title={!canUsePlayground ? "Solo disponible para usuarios con acceso a Playground" : undefined}
            >
                <optgroup label="OpenAI">
                    <option value="openai:gpt-4.1">GPT-4.1</option>
                    <option value="openai:gpt-4.1-mini">GPT-4.1 mini</option>
                </optgroup>
                <optgroup label="Bedrock (AWS)">
                    <option value="bedrock:claude-3.5-sonnet" disabled>Claude 3.5 Sonnet — Próximamente</option>
                    <option value="bedrock:claude-3.5-haiku" disabled>Claude 3.5 Haiku — Próximamente</option>
                    <option value="bedrock:llama-3.1-70b" disabled>Llama 3.1 70B — Próximamente</option>
                </optgroup>
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-16 sm:w-20">Temp</span>
                <input
                    type="range" min={0} max={1} step={0.1}
                    value={settings.temperature}
                    onChange={e => setSettings({ temperature: Number(e.target.value) })}
                    className="w-32 sm:w-40 accent-blue-600"
                    disabled={!canUsePlayground}
                />
                <span className="w-10 text-right tabular-nums">{settings.temperature}</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-24 sm:w-28">Max tokens</span>
                <input
                    type="number"
                    value={settings.maxTokens}
                    onChange={e => setSettings({ maxTokens: Math.max(64, Number(e.target.value || 0)) })}
                    className="h-9 w-24 border border-slate-200 rounded-xl px-3"
                    disabled={!canUsePlayground}
                />
            </label>

            <button
                onClick={() => { setDraft(systemPrompt); setOpen(true); }}
                className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border shadow-sm bg-white hover:bg-slate-50 border-slate-200 text-slate-700 text-sm"
                disabled={!canUsePlayground}
                title={!canUsePlayground ? "Solo disponible para usuarios con acceso a Playground" : undefined}
            >
                🛠️ Prompt
            </button>

            <button
                onClick={resetActive}
                className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border shadow-sm bg-white hover:bg-slate-50 border-slate-200 text-slate-700 text-sm"
            >
                ↻ Reiniciar
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title="Prompt del sistema" onPrimary={() => { setSystemPrompt(draft); setOpen(false); }}>
                <textarea value={draft} onChange={e => setDraft(e.target.value)} className="w-full h-64 border border-slate-200 rounded-xl p-3" />
                <p className="text-xs text-slate-500 mt-2">Se usa al inicio de cada conversación.</p>
            </Modal>
        </div>
    );
}
