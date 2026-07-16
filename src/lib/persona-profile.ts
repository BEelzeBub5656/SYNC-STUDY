import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiRequest } from "@/lib/api-client";
import { getAuthSession } from "@/lib/auth-session";

export type PersonaAnswers = string[][];

const PERSONA_PROFILE_KEY = "persona-profile-v1";

export async function savePersonaAnswers(answers: PersonaAnswers) {
  const session = await getAuthSession();
  if (session) {
    await apiRequest<{ answers: PersonaAnswers }>("/api/persona", {
      method: "PUT",
      body: JSON.stringify({ answers }),
    });
  }
  await AsyncStorage.setItem(
    PERSONA_PROFILE_KEY,
    JSON.stringify({ answers, updatedAt: new Date().toISOString() }),
  );
}

export async function loadPersonaAnswers(): Promise<PersonaAnswers> {
  const session = await getAuthSession();
  if (session) {
    try {
      const response = await apiRequest<{ answers: PersonaAnswers }>("/api/persona");
      if (response.answers.length > 0) {
        await AsyncStorage.setItem(
          PERSONA_PROFILE_KEY,
          JSON.stringify({ answers: response.answers, updatedAt: new Date().toISOString() }),
        );
        return response.answers;
      }
    } catch {
      // 网络不可用时继续读取本地缓存。
    }
  }

  const stored = await AsyncStorage.getItem(PERSONA_PROFILE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored) as { answers?: unknown };
    if (!Array.isArray(parsed.answers)) return [];
    return parsed.answers.filter(Array.isArray) as PersonaAnswers;
  } catch {
    return [];
  }
}

export function derivePersonaTraits(answers: PersonaAnswers) {
  const primaryAnswers = answers.map((answer) => answer[0]).filter(Boolean);
  const remainingAnswers = answers.flat().filter((answer) => !primaryAnswers.includes(answer));
  return [...new Set([...primaryAnswers, ...remainingAnswers])].slice(0, 6);
}
