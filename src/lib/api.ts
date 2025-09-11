import { Role } from "./types";
const DEMO = String(process.env.NEXT_PUBLIC_DEMO_MODE) === "true";
export async function callPrediagnosis(params: { model: string; temperature: number; maxTokens: number; systemPrompt: string; messages: { role: Role; content: string }[] }): Promise<{ content: string; tokensOut?: number } | { error: string }> {
    if (DEMO) {
        const lastUser = params.messages.filter(m => m.role === "user").pop();
        const txt = lastUser?.content ?? "";
        const redFlag = /(rigidez|meningitis|dificultad para respirar|pecho|convuls)/i.test(txt);
        const urgent = /(sangrado|peorando|desmayo|inconsciente|dolor intenso|fiebre alta)/i.test(txt);
        const triage = redFlag || urgent ? "urgente" : /fiebre|tos|dolor/i.test(txt) ? "programar_cita" : "autocuidado";
        const payload = { triage, risk_score: redFlag || urgent ? 0.88 : triage === "programar_cita" ? 0.55 : 0.18, possible_categories: redFlag ? ["neurológico", "infeccioso"] : ["respiratorio", "general"], red_flags: redFlag ? ["Síntoma de alarma detectado"] : [], next_steps: triage === "urgente" ? ["Acudir a urgencias de inmediato", "Evitar automedicación"] : triage === "programar_cita" ? ["Agendar cita en <48h>", "Reposo e hidratación"] : ["Reposo", "Líquidos", "Paracetamol si no hay contraindicaciones"], disclaimer: "No es un diagnóstico médico; consulte a un profesional." };
        const content = "```json\n" + JSON.stringify(payload, null, 2) + "\n```";
        await new Promise(r => setTimeout(r, 600));
        return { content, tokensOut: 256 };
    }
    try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "/api";
        const resp = await fetch(`${base}/prediagnosis`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
        if (!resp.ok) throw new Error(await resp.text());
        return await resp.json();
    } catch (e: any) {
        return { error: String(e.message || e) };
    }
}
