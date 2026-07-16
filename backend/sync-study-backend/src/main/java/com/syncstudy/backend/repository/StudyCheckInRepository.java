package com.syncstudy.backend.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Repository
public class StudyCheckInRepository {

    private final JdbcTemplate jdbcTemplate;

    public StudyCheckInRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean insertIfAbsent(Long userId, LocalDate checkInDate) {
        String sql = """
                INSERT IGNORE INTO study_check_ins (user_id, check_in_date, points)
                VALUES (?, ?, 10)
                """;
        return jdbcTemplate.update(sql, userId, Date.valueOf(checkInDate)) == 1;
    }

    public int countByUserId(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM study_check_ins WHERE user_id = ?",
                Integer.class,
                userId
        );
        return count == null ? 0 : count;
    }

    public List<LocalDate> findDatesThrough(Long userId, LocalDate endDate) {
        String sql = """
                SELECT check_in_date
                FROM study_check_ins
                WHERE user_id = ? AND check_in_date <= ?
                ORDER BY check_in_date DESC
                """;
        return jdbcTemplate.query(
                sql,
                (resultSet, rowNumber) -> resultSet.getDate("check_in_date").toLocalDate(),
                userId,
                Date.valueOf(endDate)
        );
    }

    public List<LocalDate> findDatesBetween(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        String sql = """
                SELECT check_in_date
                FROM study_check_ins
                WHERE user_id = ? AND check_in_date BETWEEN ? AND ?
                ORDER BY check_in_date
                """;
        return jdbcTemplate.query(
                sql,
                (resultSet, rowNumber) -> resultSet.getDate("check_in_date").toLocalDate(),
                userId,
                Date.valueOf(startDate),
                Date.valueOf(endDate)
        );
    }
}
