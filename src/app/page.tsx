"use client";
import Header from "@/components/Header";
import PatientsSidebar from "@/components/Sidebar/PatientsSidebar";
import Chat from "@/components/Chat/Chat";
import SummaryPanel from "@/components/Summary/SummaryPanel";
import { useAssistantStore } from "@/store/useAssistantStore";
import { useEffect } from "react";
export default function Page() {
    const seed = useAssistantStore(s => s.seedIfEmpty);
    useEffect(() => { seed(); }, [seed]);
    const mode = useAssistantStore(s => s.settings.mode);
    return (
        <div className="flex flex-col h-dvh">
            <Header />
            <div className="grid grid-cols-12 flex-1">
                <div className="col-span-3 border-r border-slate-200 bg-white"><PatientsSidebar /></div>
                <div className="col-span-6"><Chat mode={mode} /></div>
                <div className="col-span-3 border-l border-slate-200 bg-white"><SummaryPanel /></div>
            </div>
        </div>
    );
}
