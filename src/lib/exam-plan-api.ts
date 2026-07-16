import { apiRequest } from "@/lib/api-client";

export type ExamPlanPhase = {
  title: string;
  startDate: string;
  endDate: string;
  status: "待开始" | "进行中" | "已完成";
  tasks: string[];
};

export type ExamPlan = {
  id: number;
  userId: number;
  subject: string;
  examDate: string;
  remainingDays: number;
  progressPercent: number;
  createdAt: string;
  phases: ExamPlanPhase[];
};

export const LATEST_EXAM_PLAN_KEY = "latest-exam-plan-id-v1";

export function createExamPlan(input: {
  subject: string;
  examDate: string;
}) {
  return apiRequest<ExamPlan>("/api/exam-plans", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getExamPlan(id: number) {
  return apiRequest<ExamPlan>(`/api/exam-plans/${id}`);
}

export function getLatestExamPlan() {
  return apiRequest<ExamPlan>("/api/exam-plans/latest");
}
