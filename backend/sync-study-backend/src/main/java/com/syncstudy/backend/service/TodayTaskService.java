package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.CreateTodayTaskRequest;
import com.syncstudy.backend.dto.RecommendedTaskResponse;
import com.syncstudy.backend.dto.TodayTaskDashboardResponse;
import com.syncstudy.backend.dto.TodayTaskItemResponse;
import com.syncstudy.backend.dto.UpdateTaskCompletionRequest;
import com.syncstudy.backend.dto.UpdateTodayTaskRequest;
import com.syncstudy.backend.dto.InternalTaskUpdateRequest;
import com.syncstudy.backend.model.TodayTaskData;
import com.syncstudy.backend.repository.StudyCheckInRepository;
import com.syncstudy.backend.repository.TodayTaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class TodayTaskService {

    private static final List<RecommendedTaskResponse> RECOMMENDATIONS = List.of(
            new RecommendedTaskResponse("ted", "看一篇TED演讲", 20),
            new RecommendedTaskResponse(
                    "shadowing",
                    "模仿演员语调跟读，手机录音对比",
                    15
            ),
            new RecommendedTaskResponse(
                    "journal",
                    "用280个英文单词描述昨日经历",
                    25
            )
    );

    private final TodayTaskRepository taskRepository;
    private final StudyCheckInRepository checkInRepository;

    public TodayTaskService(
            TodayTaskRepository taskRepository,
            StudyCheckInRepository checkInRepository
    ) {
        this.taskRepository = taskRepository;
        this.checkInRepository = checkInRepository;
    }

    public TodayTaskDashboardResponse getDashboard(Long userId) {
        return buildDashboard(userId, LocalDate.now());
    }

    public TodayTaskDashboardResponse create(Long userId, CreateTodayTaskRequest request) {
        createItem(userId, request, LocalDate.now());
        return getDashboard(userId);
    }

    public TodayTaskItemResponse createItem(
            Long userId,
            CreateTodayTaskRequest request,
            LocalDate taskDate
    ) {
        return createItem(
                userId,
                request.title(),
                request.estimatedMinutes(),
                request.source(),
                taskDate
        );
    }

    public TodayTaskItemResponse createItem(
            Long userId,
            String title,
            int estimatedMinutes,
            String source,
            LocalDate taskDate
    ) {
        Long id = taskRepository.insert(
                userId,
                title.trim(),
                estimatedMinutes,
                source,
                taskDate
        );
        return getItem(userId, id);
    }

    public List<TodayTaskItemResponse> listItems(Long userId, LocalDate taskDate) {
        return taskRepository.findByUserAndDate(userId, taskDate).stream()
                .map(this::toResponse)
                .toList();
    }

    public TodayTaskDashboardResponse updateDetails(
            Long taskId,
            Long userId,
            UpdateTodayTaskRequest request
    ) {
        TodayTaskData current = getOwnedTask(taskId, userId);
        if (request.title() == null && request.estimatedMinutes() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "至少提供一个要修改的字段");
        }
        updateStoredTask(
                taskId,
                userId,
                request.title() == null ? current.title() : normalizedTitle(request.title()),
                request.estimatedMinutes() == null
                        ? current.estimatedMinutes()
                        : request.estimatedMinutes(),
                current.completed()
        );
        return getDashboard(userId);
    }

    public TodayTaskItemResponse updateItem(
            Long taskId,
            Long userId,
            InternalTaskUpdateRequest request
    ) {
        TodayTaskData current = getOwnedTask(taskId, userId);
        if (request.title() == null
                && request.estimatedMinutes() == null
                && request.completed() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "至少提供一个要修改的字段");
        }
        updateStoredTask(
                taskId,
                userId,
                request.title() == null ? current.title() : normalizedTitle(request.title()),
                request.estimatedMinutes() == null
                        ? current.estimatedMinutes()
                        : request.estimatedMinutes(),
                request.completed() == null ? current.completed() : request.completed()
        );
        return getItem(userId, taskId);
    }

    public TodayTaskDashboardResponse updateCompletion(
            Long taskId,
            Long userId,
            UpdateTaskCompletionRequest request
    ) {
        if (!taskRepository.updateCompletion(
                taskId,
                userId,
                request.completed()
        )) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "今日任务不存在");
        }
        return getDashboard(userId);
    }

    public TodayTaskDashboardResponse delete(Long taskId, Long userId) {
        deleteItem(taskId, userId);
        return getDashboard(userId);
    }

    public void deleteItem(Long taskId, Long userId) {
        if (!taskRepository.delete(taskId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "今日任务不存在");
        }
    }

    private TodayTaskDashboardResponse buildDashboard(Long userId, LocalDate today) {
        List<TodayTaskData> tasks = taskRepository.findByUserAndDate(userId, today);
        List<TodayTaskItemResponse> pendingTasks = tasks.stream()
                .filter(task -> !task.completed())
                .map(this::toResponse)
                .toList();
        List<TodayTaskItemResponse> completedTasks = tasks.stream()
                .filter(TodayTaskData::completed)
                .map(this::toResponse)
                .toList();
        int studyMinutes = completedTasks.stream()
                .mapToInt(TodayTaskItemResponse::estimatedMinutes)
                .sum();

        return new TodayTaskDashboardResponse(
                today,
                checkInRepository.countByUserId(userId),
                studyMinutes,
                Math.min(99, 50 + Math.round(studyMinutes * 5F / 6F)),
                RECOMMENDATIONS,
                pendingTasks,
                completedTasks
        );
    }

    private TodayTaskItemResponse toResponse(TodayTaskData task) {
        return new TodayTaskItemResponse(
                task.id(),
                task.title(),
                task.estimatedMinutes(),
                task.source(),
                task.completed(),
                task.completedAt()
        );
    }

    private TodayTaskItemResponse getItem(Long userId, Long taskId) {
        return toResponse(getOwnedTask(taskId, userId));
    }

    private TodayTaskData getOwnedTask(Long taskId, Long userId) {
        return taskRepository.findByIdAndUserId(taskId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "今日任务不存在"
                ));
    }

    private void updateStoredTask(
            Long taskId,
            Long userId,
            String title,
            int estimatedMinutes,
            boolean completed
    ) {
        if (!taskRepository.update(
                taskId,
                userId,
                title,
                estimatedMinutes,
                completed
        )) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "今日任务不存在");
        }
    }

    private String normalizedTitle(String title) {
        String normalized = title.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "任务名称不能为空");
        }
        return normalized;
    }

}
