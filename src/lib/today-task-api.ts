import { apiRequest } from "@/lib/api-client";

export type RecommendedTask = {
  id: string;
  title: string;
  estimatedMinutes: number;
};

export type TodayTask = {
  id: number;
  title: string;
  estimatedMinutes: number;
  source: "AI" | "CUSTOM";
  completed: boolean;
  completedAt: string | null;
};

export type TodayTaskDashboard = {
  date: string;
  totalCheckInDays: number;
  todayStudyMinutes: number;
  outperformPercent: number;
  recommendations: RecommendedTask[];
  pendingTasks: TodayTask[];
  completedTasks: TodayTask[];
};

export function getTodayTaskDashboard() {
  return apiRequest<TodayTaskDashboard>("/api/today-tasks");
}

export function createTodayTask(input: {
  title: string;
  estimatedMinutes: number;
  source: "AI" | "CUSTOM";
}) {
  return apiRequest<TodayTaskDashboard>("/api/today-tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function setTodayTaskCompleted(
  taskId: number,
  input: { completed: boolean },
) {
  return apiRequest<TodayTaskDashboard>(
    `/api/today-tasks/${taskId}/completion`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteTodayTask(taskId: number) {
  return apiRequest<TodayTaskDashboard>(`/api/today-tasks/${taskId}`, {
    method: "DELETE",
  });
}
