import Markdown from "@/lib/markdown";
export default function ChatBubble({ role, content, timestamp }: { role: "assistant" | "user"; content: string; timestamp: number }) {
    const isUser = role === "user";
    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-soft border text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "bg-blue-600 text-white border-blue-700 rounded-br-sm" : "bg-white text-slate-800 border-slate-200 rounded-bl-sm"}`}>
                <Markdown text={content} />
                <div className={`text-[11px] mt-2 ${isUser ? "text-blue-100" : "text-slate-500"}`}>{new Date(timestamp).toLocaleTimeString()}</div>
            </div>
        </div>
    );
}
