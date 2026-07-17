import { apiRequest } from "@/lib/api-client";

export type LearningGoalTerm = "SHORT" | "LONG";

export type LearningGoal = {
  id: number;
  term: LearningGoalTerm;
  title: string;
  detail: string;
  targetDate: string | null;
  progressPercent: number;
  actions: string[];
  updatedAt: string;
};

export type LearningGoals = {
  shortTerm: LearningGoal | null;
  longTerm: LearningGoal | null;
};

export type UpdateLearningGoalInput = {
  title: string;
  detail: string;
  targetDate?: string | null;
  progressPercent?: number;
  actions?: string[];
};

export function getLearningGoals() {
  return apiRequest<LearningGoals>("/api/learning-goals");
}

export function updateLearningGoal(
  term: LearningGoalTerm,
  input: UpdateLearningGoalInput,
) {
  return apiRequest<LearningGoal>(`/api/learning-goals/${term}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
