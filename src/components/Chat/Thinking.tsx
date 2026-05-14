import Image from "next/image";

export default function Thinking() {
    return (
        <div className="flex items-start gap-3">
            {/* Avatar Vita también en “pensando” */}
            <div className="shrink-0 w-8 h-8 rounded-full bg-vitalink-primary/10 border border-slate-200 overflow-hidden flex items-center justify-center">
                <Image src="/vita.png" alt="Vita" width={32} height={32} className="object-cover" />
            </div>

            <div className="w-[92%] sm:w-[85%] md:w-[80%] rounded-2xl px-4 py-3 shadow-soft border text-sm bg-white text-slate-800 border-slate-200 rounded-bl-sm">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
          <span className="inline-block w-2 h-2 rounded-full bg-slate-300 animate-pulse [animation-delay:120ms]" />
          <span className="inline-block w-2 h-2 rounded-full bg-slate-300 animate-pulse [animation-delay:240ms]" />
        </span>
            </div>
        </div>
    );
}
