import AsyncStorage from "@react-native-async-storage/async-storage";

import { getAuthSession } from "@/lib/auth-session";

export type MoodId = "happy" | "annoyed" | "calm" | "tired";

export type MoodRecord = {
  id: MoodId;
  note: string;
  advice: string;
  date: string | null;
};

type MoodCachePayload = MoodRecord & {
  cacheOwner: string;
};

export type MoodCacheScope = {
  owner: string;
  date: string;
  storageKey: string;
};

const LEGACY_MOOD_STORAGE_KEY = "today-mood-v1";
const LEGACY_SCOPED_MOOD_STORAGE_KEY_PREFIX = "today-mood-v2";
const MOOD_STORAGE_KEY_PREFIX = "today-mood-v3";

export const MOODS: Record<
  MoodId,
  {
    title: string;
    english: string;
    background: string;
    accent: string;
    dot: string;
    description: string;
  }
> = {
  happy: {
    title: "开心",
    english: "Feeling Happy",
    background: "#FFE7CD",
    accent: "#FF961F",
    dot: "#FFB85B",
    description: "保持这份快乐，让它像涟漪一样传递给更多人吧~",
  },
  annoyed: {
    title: "烦恼",
    english: "Feeling Annoyance",
    background: "#FFC5C6",
    accent: "#EC6B73",
    dot: "#EF8D95",
    description: "烦恼像云朵，看着很大却终会飘散。深呼吸，我们一步步拆解它！",
  },
  calm: {
    title: "平静",
    english: "Feeling Calm",
    background: "#EDE2FF",
    accent: "#BF70E6",
    dot: "#BEA4F5",
    description: "没关系的，我在这里陪你慢慢等乌云过去。",
  },
  tired: {
    title: "疲惫",
    english: "Feeling tired",
    background: "#D7EDFF",
    accent: "#5687E2",
    dot: "#A9CAF7",
    description: "辛苦的你像充电中的手机，需要暂停才能满格复活",
  },
};

export const MOOD_IDS: MoodId[] = ["happy", "annoyed", "calm", "tired"];

export function isMoodId(value: unknown): value is MoodId {
  return typeof value === "string" && MOOD_IDS.includes(value as MoodId);
}

export function createDefaultMoodRecord(id: MoodId): MoodRecord {
  return {
    id,
    note: MOODS[id].description,
    advice: MOODS[id].description,
    date: null,
  };
}

export function toLocalMoodDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getMoodCacheScope(): Promise<MoodCacheScope> {
  let session = null;
  try {
    session = await getAuthSession();
  } catch {
    // Auth storage being unavailable must not make mood screens crash.
  }
  const owner = session ? `user:${session.userId}` : "guest";
  const date = toLocalMoodDateKey();
  return {
    owner,
    date,
    storageKey: `${MOOD_STORAGE_KEY_PREFIX}:${owner}:${date}`,
  };
}

export function isSameMoodCacheScope(
  left: MoodCacheScope,
  right: MoodCacheScope,
): boolean {
  return left.owner === right.owner && left.date === right.date;
}

function getStoredCacheOwner(value: string): string | null {
  try {
    const parsed = JSON.parse(value) as Partial<MoodCachePayload>;
    return typeof parsed.cacheOwner === "string" ? parsed.cacheOwner : null;
  } catch {
    return null;
  }
}

export async function saveMoodCache(
  record: MoodRecord,
  providedScope?: MoodCacheScope,
): Promise<void> {
  const scope = providedScope ?? (await getMoodCacheScope());
  if (record.date !== scope.date) {
    throw new Error("心情记录不是设备本地的今日数据");
  }
  const payload: MoodCachePayload = {
    ...record,
    cacheOwner: scope.owner,
  };
  await AsyncStorage.setItem(scope.storageKey, JSON.stringify(payload));
}

export async function loadMoodCache(
  providedScope?: MoodCacheScope,
): Promise<MoodRecord | null> {
  const scope = providedScope ?? (await getMoodCacheScope());
  const scopedValue = await AsyncStorage.getItem(scope.storageKey);
  if (scopedValue) {
    const scopedMood = parseStoredMood(scopedValue);
    if (
      getStoredCacheOwner(scopedValue) === scope.owner &&
      scopedMood?.date === scope.date
    ) {
      return scopedMood;
    }
    await AsyncStorage.removeItem(scope.storageKey);
  }

  const legacyKeys = [
    `${LEGACY_SCOPED_MOOD_STORAGE_KEY_PREFIX}:${scope.owner}`,
    LEGACY_MOOD_STORAGE_KEY,
  ];
  for (const legacyKey of legacyKeys) {
    const legacyValue = await AsyncStorage.getItem(legacyKey);
    if (!legacyValue) {
      continue;
    }

    // Legacy values are migrated only when both their explicit owner and date
    // match this device's current local-day scope. Missing dates are unsafe:
    // they must never be presented as today's mood.
    const legacyMood = parseStoredMood(legacyValue);
    if (
      getStoredCacheOwner(legacyValue) === scope.owner &&
      legacyMood?.date === scope.date
    ) {
      await saveMoodCache(legacyMood, scope);
      await AsyncStorage.removeItem(legacyKey);
      return legacyMood;
    }
    await AsyncStorage.removeItem(legacyKey);
  }

  return null;
}

export function inferMoodFromText(text: string): MoodId {
  const normalized = text.trim().toLowerCase();

  if (/累|困|疲|没力|乏|熬夜|sleep|tired/.test(normalized)) {
    return "tired";
  }

  if (/烦|气|焦虑|压力|难过|崩|糟|生气|annoy|angry|sad/.test(normalized)) {
    return "annoyed";
  }

  if (/开心|快乐|高兴|幸福|兴奋|很好|棒|happy|great/.test(normalized)) {
    return "happy";
  }

  return "calm";
}

export function parseStoredMood(value: string | null): MoodRecord | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<MoodRecord>;
    if (isMoodId(parsed.id)) {
      return {
        id: parsed.id,
        note:
          typeof parsed.note === "string"
            ? parsed.note
            : MOODS[parsed.id].description,
        advice:
          typeof parsed.advice === "string" && parsed.advice.trim()
            ? parsed.advice
            : MOODS[parsed.id].description,
        date: typeof parsed.date === "string" ? parsed.date : null,
      };
    }
  } catch {
    return null;
  }

  return null;
}
