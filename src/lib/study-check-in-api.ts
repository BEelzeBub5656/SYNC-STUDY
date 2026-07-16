import { apiRequest } from "@/lib/api-client";

export type StudyCheckInSummary = {
  userId: number;
  checkInDate: string;
  newlyCheckedIn: boolean;
  pointsEarned: number;
  continuousDays: number;
  totalDays: number;
  month: string;
  checkedDates: string[];
};

export function checkInToday() {
  return apiRequest<StudyCheckInSummary>("/api/study-check-ins", {
    method: "POST",
  });
}

export function getStudyCheckInSummary(month: string) {
  return apiRequest<StudyCheckInSummary>(
    `/api/study-check-ins/summary?month=${encodeURIComponent(month)}`,
  );
}
