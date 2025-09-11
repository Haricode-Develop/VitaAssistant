"use client";
type Mode = "playground" | "usuario";
export default function PillToggle({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
    return (
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
            {["playground", "usuario"].map(v => (
                <button key={v} onClick={() => onChange(v as Mode)} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${value === v ? "bg-white shadow border border-slate-200" : "text-slate-600"}`}>{v === "playground" ? "Playground" : "Vista Usuario"}</button>
            ))}
        </div>
    );
}
