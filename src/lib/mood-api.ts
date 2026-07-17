import { apiRequest } from "@/lib/api-client";
import {
  isMoodId,
  type MoodId,
  type MoodRecord,
} from "@/lib/mood";

export type MoodAdviceRequest = {
  moodId: MoodId;
  description: string;
};

export type MoodAdviceResponse = {
  date: string;
  moodId: MoodId;
  description: string;
  advice: string;
};

function parseMoodAdviceResponse(value: unknown): MoodAdviceResponse {
  if (!value || typeof value !== "object") {
    throw new Error("心情建议返回格式不正确");
  }

  const response = value as Record<string, unknown>;
  if (
    typeof response.date !== "string" ||
    !isMoodId(response.moodId) ||
    typeof response.description !== "string" ||
    typeof response.advice !== "string" ||
    !response.advice.trim()
  ) {
    throw new Error("心情建议返回内容不完整");
  }

  return {
    date: response.date,
    moodId: response.moodId,
    description: response.description,
    advice: response.advice.trim(),
  };
}

export async function createMoodAdvice(
  input: MoodAdviceRequest,
): Promise<MoodAdviceResponse> {
  const response = await apiRequest<unknown>("/api/ai/mood-advice", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseMoodAdviceResponse(response);
}

export async function getTodayMood(): Promise<MoodAdviceResponse> {
  const response = await apiRequest<unknown>("/api/moods/today");
  return parseMoodAdviceResponse(response);
}

export function toMoodRecord(response: MoodAdviceResponse): MoodRecord {
  return {
    id: response.moodId,
    note: response.description,
    advice: response.advice,
    date: response.date,
  };
}
