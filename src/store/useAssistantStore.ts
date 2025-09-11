import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Conversation, Message, Settings } from "@/lib/types";
const defaultSystemPrompt = `Eres un asistente clínico para prediagnóstico de Vitalink.
Devuelve siempre un bloque JSON con las claves: triage, risk_score, possible_categories, red_flags, next_steps, disclaimer.
Responde en español neutro.`;
type Store = {
    settings: Settings;
    conversations: Conversation[];
    activeId: string | null;
    setSettings: (p: Partial<Settings>) => void;
    setMode: (m: Settings["mode"]) => void;
    seedIfEmpty: () => void;
    activeConversation: () => Conversation | undefined;
    setActiveId: (id: string) => void;
    createConversation: () => void;
    renamePatient: (id: string, name: string) => void;
    deleteConversation: (id: string) => void;
    addMessage: (m: Message) => void;
    resetActive: () => void;
    setSystemPrompt: (prompt: string) => void;
    lastAssistantJSON: () => any | null;
};
export const useAssistantStore = create<Store>()(persist((set, get) => ({
    settings: { mode: "playground", model: "bedrock:claude-3.5-sonnet", temperature: 0.2, maxTokens: 1024 },
    conversations: [],
    activeId: null,
    setSettings: p => set(s => ({ settings: { ...s.settings, ...p } })),
    setMode: m => set(s => ({ settings: { ...s.settings, mode: m } })),
    seedIfEmpty: () => {
        const state = get();
        if (state.conversations.length === 0) {
            const id = crypto.randomUUID();
            const c: Conversation = { id, patientId: "PX-0001", patientName: "Paciente Demo", model: state.settings.model, systemPrompt: defaultSystemPrompt, messages: [{ id: crypto.randomUUID(), role: "assistant", content: "Hola, soy tu asistente de prediagnóstico. ¿Qué síntomas presenta el paciente?", timestamp: Date.now() }], createdAt: Date.now(), updatedAt: Date.now() };
            set({ conversations: [c], activeId: id });
        }
    },
    activeConversation: () => get().conversations.find(c => c.id === get().activeId),
    setActiveId: id => set({ activeId: id }),
    createConversation: () => set(s => {
        const id = crypto.randomUUID();
        const c: Conversation = { id, patientId: `PX-${Math.floor(Math.random() * 9000 + 1000)}`, patientName: "Nuevo Paciente", model: s.settings.model, systemPrompt: defaultSystemPrompt, messages: [{ id: crypto.randomUUID(), role: "assistant", content: "Iniciando nuevo caso. ¿Qué síntomas presenta el paciente?", timestamp: Date.now() }], createdAt: Date.now(), updatedAt: Date.now() };
        return { conversations: [c, ...s.conversations], activeId: id };
    }),
    renamePatient: (id, name) => set(s => ({ conversations: s.conversations.map(c => c.id === id ? { ...c, patientName: name, updatedAt: Date.now() } : c) })),
    deleteConversation: id => set(s => {
        const list = s.conversations.filter(c => c.id !== id);
        const next = s.activeId === id && list.length ? list[0].id : s.activeId === id ? null : s.activeId;
        return { conversations: list, activeId: next };
    }),
    addMessage: m => set(s => ({ conversations: s.conversations.map(c => c.id === s.activeId ? { ...c, messages: [...c.messages, m], updatedAt: Date.now() } : c) })),
    resetActive: () => set(s => ({ conversations: s.conversations.map(c => c.id === s.activeId ? { ...c, messages: [c.messages[0]], updatedAt: Date.now() } : c) })),
    setSystemPrompt: prompt => set(s => ({ conversations: s.conversations.map(c => c.id === s.activeId ? { ...c, systemPrompt: prompt, updatedAt: Date.now() } : c) })),
    lastAssistantJSON: () => {
        const c = get().conversations.find(x => x.id === get().activeId);
        if (!c) return null;
        const last = [...c.messages].reverse().find(m => m.role === "assistant");
        if (!last) return null;
        const match = last.content.match(/```json\n([\s\S]*?)\n```/);
        if (!match) return null;
        try { return JSON.parse(match[1]); } catch { return null; }
    }
}), { name: "vlk_assistant_store", storage: createJSONStorage(() => localStorage) }));
