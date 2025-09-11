"use client";
import Badge from "@/components/Badge";
import { useAssistantStore } from "@/store/useAssistantStore";
import { useState } from "react";
export default function PatientsSidebar() {
    const { conversations, activeId, setActiveId, createConversation, renamePatient, deleteConversation } = useAssistantStore();
    const [q, setQ] = useState("");
    const list = conversations.filter(c => c.patientName.toLowerCase().includes(q.toLowerCase()) || c.patientId.toLowerCase().includes(q.toLowerCase()));
    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold">Pacientes</h3>
                <button className="px-3 h-9 rounded-xl text-white bg-vitalink-primary" onClick={createConversation}>+ Nuevo</button>
            </div>
            <div className="px-3 pb-3"><input placeholder="Buscar" value={q} onChange={e => setQ(e.target.value)} className="w-full h-9 px-3 border border-slate-200 rounded-xl" /></div>
            <ul className="px-2 space-y-2 pb-4 overflow-auto">
                {list.map(c => (
                    <li key={c.id} className={`rounded-xl border ${c.id === activeId ? "border-blue-600/40 bg-blue-50" : "border-slate-200 bg-white"}`}>
                        <button className="w-full text-left px-3 py-2" onClick={() => setActiveId(c.id)}>
                            <div className="flex items-center justify-between">
                                <div className="font-medium text-slate-900 truncate">{c.patientName}</div>
                                <Badge color={c.id === activeId ? "primary" : "gray"}>{c.patientId}</Badge>
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">{new Date(c.updatedAt).toLocaleString()}</div>
                        </button>
                        <div className="flex items-center gap-2 px-3 pb-2">
                            <button className="text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50" onClick={() => { const name = prompt("Nuevo nombre", c.patientName); if (name) renamePatient(c.id, name); }}>Renombrar</button>
                            <button className="text-xs px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => deleteConversation(c.id)}>Eliminar</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
