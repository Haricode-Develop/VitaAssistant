export type Role = "assistant" | "user";
export type Message = { id: string; role: Role; content: string; timestamp: number; model?: string; tokensIn?: number; tokensOut?: number };
export type Conversation = { id: string; patientId: string; patientName: string; messages: Message[]; model: string; systemPrompt: string; createdAt: number; updatedAt: number };
export type Settings = { mode: "playground" | "usuario"; model: string; temperature: number; maxTokens: number };
