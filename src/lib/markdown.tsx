export default function Markdown({ text }: { text: string }) {
    if (!text) return null;
    const parts = split(text);
    return (
        <div className="space-y-3">
            {parts.map((p, i) =>
                    p.type === "code" ? (
                        <pre key={i} className="overflow-auto text-[12px] leading-relaxed bg-slate-900 text-slate-100 rounded-xl p-3">
            <code>{p.content}</code>
          </pre>
                    ) : (
                        <div key={i} className="whitespace-pre-wrap">{p.content}</div>
                    )
            )}
        </div>
    );
}

function split(text: string): { type: "code" | "text"; content: string }[] {
    const regex = /```[a-zA-Z0-9]*\r?\n[\s\S]*?\r?\n```/g;
    const out: { type: "code" | "text"; content: string }[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text))) {
        if (m.index > last) out.push({ type: "text", content: text.slice(last, m.index) });
        out.push({ type: "code", content: m[0].replace(/^```[a-zA-Z0-9]*\r?\n/, "").replace(/\r?\n```$/, "") });
        last = regex.lastIndex;
    }
    if (last < text.length) out.push({ type: "text", content: text.slice(last) });
    return out;
}
