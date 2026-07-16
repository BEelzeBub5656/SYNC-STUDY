package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.StudyCheckInResponse;
import com.syncstudy.backend.repository.StudyCheckInRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class StudyCheckInService {

    private static final int POINTS_PER_CHECK_IN = 10;

    private final StudyCheckInRepository repository;

    public StudyCheckInService(StudyCheckInRepository repository) {
        this.repository = repository;
    }

    public StudyCheckInResponse checkIn(Long userId) {
        LocalDate today = LocalDate.now();
        boolean newlyCheckedIn = repository.insertIfAbsent(userId, today);
        return buildResponse(
                userId,
                YearMonth.from(today),
                today,
                newlyCheckedIn
        );
    }

    public StudyCheckInResponse getSummary(Long userId, String monthText) {
        YearMonth month;
        try {
            month = YearMonth.parse(monthText);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "月份格式必须为 YYYY-MM"
            );
        }
        return buildResponse(userId, month, LocalDate.now(), false);
    }

    private StudyCheckInResponse buildResponse(
            Long userId,
            YearMonth month,
            LocalDate referenceDate,
            boolean newlyCheckedIn
    ) {
        List<LocalDate> allDates = repository.findDatesThrough(userId, referenceDate);
        List<LocalDate> monthDates = repository.findDatesBetween(
                userId,
                month.atDay(1),
                month.atEndOfMonth()
        );

        return new StudyCheckInResponse(
                userId,
                referenceDate,
                newlyCheckedIn,
                newlyCheckedIn ? POINTS_PER_CHECK_IN : 0,
                calculateContinuousDays(allDates, referenceDate),
                repository.countByUserId(userId),
                month,
                monthDates
        );
    }

    private int calculateContinuousDays(List<LocalDate> dates, LocalDate today) {
        if (dates.isEmpty()) {
            return 0;
        }

        LocalDate expected = dates.get(0).equals(today)
                ? today
                : today.minusDays(1);
        int continuousDays = 0;

        for (LocalDate date : dates) {
            if (date.equals(expected)) {
                continuousDays++;
                expected = expected.minusDays(1);
            } else if (date.isBefore(expected)) {
                break;
            }
        }
        return continuousDays;
    }
}
