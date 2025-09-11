"use client";
export default function Modal({ open, onClose, title, children, primaryLabel = "Guardar", onPrimary }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; primaryLabel?: string; onPrimary?: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
                </div>
                <div className="p-5">{children}</div>
                <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button onClick={onClose} className="px-4 h-9 rounded-xl border border-slate-200">Cancelar</button>
                    <button onClick={onPrimary} className="px-4 h-9 rounded-xl bg-blue-600 text-white">{primaryLabel}</button>
                </div>
            </div>
        </div>
    );
}
