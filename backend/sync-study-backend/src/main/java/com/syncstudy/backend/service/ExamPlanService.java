package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.CreateExamPlanRequest;
import com.syncstudy.backend.dto.ExamPlanPhaseResponse;
import com.syncstudy.backend.dto.ExamPlanResponse;
import com.syncstudy.backend.model.ExamPlanData;
import com.syncstudy.backend.repository.ExamPlanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class ExamPlanService {

    private final ExamPlanRepository examPlanRepository;

    public ExamPlanService(ExamPlanRepository examPlanRepository) {
        this.examPlanRepository = examPlanRepository;
    }

    public ExamPlanResponse create(Long userId, CreateExamPlanRequest request) {
        Long id = examPlanRepository.insert(
                userId,
                request.subject().trim(),
                request.examDate()
        );
        return getById(userId, id);
    }

    public ExamPlanResponse getById(Long userId, Long id) {
        ExamPlanData plan = examPlanRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "考试规划不存在"
                ));
        if (!plan.userId().equals(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "考试规划不存在"
            );
        }
        return toResponse(plan);
    }

    public ExamPlanResponse getLatest(Long userId) {
        ExamPlanData plan = examPlanRepository.findLatestByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "还没有创建考试规划"
                ));
        return toResponse(plan);
    }

    private ExamPlanResponse toResponse(ExamPlanData plan) {
        LocalDate today = LocalDate.now();
        long remainingDays = Math.max(0, ChronoUnit.DAYS.between(today, plan.examDate()));
        LocalDate planStart = plan.createdAt().toLocalDate();
        long totalDays = Math.max(1, ChronoUnit.DAYS.between(planStart, plan.examDate()) + 1);
        long elapsedDays = Math.max(0, ChronoUnit.DAYS.between(planStart, today));
        int progressPercent = (int) Math.min(100, elapsedDays * 100 / totalDays);

        return new ExamPlanResponse(
                plan.id(),
                plan.userId(),
                plan.subject(),
                plan.examDate(),
                remainingDays,
                progressPercent,
                plan.createdAt(),
                buildPhases(plan.subject(), planStart, plan.examDate())
        );
    }

    private List<ExamPlanPhaseResponse> buildPhases(
            String subject,
            LocalDate startDate,
            LocalDate examDate
    ) {
        long availableDays = Math.max(1, ChronoUnit.DAYS.between(startDate, examDate) + 1);
        long foundationDays = Math.max(1, Math.round(availableDays * 0.45));
        long practiceDays = Math.max(1, Math.round(availableDays * 0.35));

        LocalDate foundationEnd = minDate(
                startDate.plusDays(foundationDays - 1),
                examDate
        );
        LocalDate practiceStart = minDate(foundationEnd.plusDays(1), examDate);
        LocalDate practiceEnd = minDate(
                practiceStart.plusDays(practiceDays - 1),
                examDate
        );
        LocalDate sprintStart = minDate(practiceEnd.plusDays(1), examDate);

        return List.of(
                phase(
                        "基础复习",
                        startDate,
                        foundationEnd,
                        List.of(
                                "梳理" + subject + "考试范围与核心知识点",
                                "建立错题和薄弱点清单",
                                "每天完成一轮基础知识回顾"
                        )
                ),
                phase(
                        "强化练习",
                        practiceStart,
                        practiceEnd,
                        List.of(
                                "按章节完成" + subject + "专项练习",
                                "整理高频题型的解题步骤",
                                "每两天复盘一次错题"
                        )
                ),
                phase(
                        "冲刺模拟",
                        sprintStart,
                        examDate,
                        List.of(
                                "完成至少两套限时模拟题",
                                "回看易错知识点和答题策略",
                                "考前一天轻量复习并保证休息"
                        )
                )
        );
    }

    private ExamPlanPhaseResponse phase(
            String title,
            LocalDate startDate,
            LocalDate endDate,
            List<String> tasks
    ) {
        LocalDate today = LocalDate.now();
        String status;
        if (today.isAfter(endDate)) {
            status = "已完成";
        } else if (today.isBefore(startDate)) {
            status = "待开始";
        } else {
            status = "进行中";
        }
        return new ExamPlanPhaseResponse(title, startDate, endDate, status, tasks);
    }

    private LocalDate minDate(LocalDate first, LocalDate second) {
        return first.isBefore(second) ? first : second;
    }
}
