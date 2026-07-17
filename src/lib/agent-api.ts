import { apiRequest } from "@/lib/api-client";

export type AgentChatResponse = {
  status: "completed";
  threadId: string;
  message: string;
};

export async function sendAgentMessage(input: {
  message: string;
  threadId?: string | null;
}) {
  const response = await apiRequest<unknown>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      message: input.message,
      threadId: input.threadId || null,
    }),
  });

  if (
    !response ||
    typeof response !== "object" ||
    (response as Partial<AgentChatResponse>).status !== "completed" ||
    typeof (response as Partial<AgentChatResponse>).threadId !== "string" ||
    !(response as Partial<AgentChatResponse>).threadId?.trim() ||
    typeof (response as Partial<AgentChatResponse>).message !== "string" ||
    !(response as Partial<AgentChatResponse>).message?.trim()
  ) {
    throw new Error("AI 服务返回的数据格式不正确，请稍后重试。");
  }

  return response as AgentChatResponse;
}
