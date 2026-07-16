export type MoodId = "happy" | "annoyed" | "calm" | "tired";

export type MoodRecord = {
  id: MoodId;
  note: string;
};

export const MOOD_STORAGE_KEY = "today-mood-v1";

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
    if (parsed.id && parsed.id in MOODS) {
      return {
        id: parsed.id as MoodId,
        note:
          typeof parsed.note === "string"
            ? parsed.note
            : MOODS[parsed.id as MoodId].description,
      };
    }
  } catch {
    return null;
  }

  return null;
}
