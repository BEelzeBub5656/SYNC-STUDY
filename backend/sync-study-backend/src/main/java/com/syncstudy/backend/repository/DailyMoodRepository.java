package com.syncstudy.backend.repository;

import com.syncstudy.backend.model.DailyMoodData;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public class DailyMoodRepository {

    private final JdbcTemplate jdbcTemplate;

    public DailyMoodRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DailyMoodData upsert(
            Long userId,
            LocalDate date,
            String moodId,
            String description,
            String advice
    ) {
        jdbcTemplate.update("""
                INSERT INTO daily_moods
                    (user_id, mood_date, mood_id, description, advice)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    mood_id = VALUES(mood_id),
                    description = VALUES(description),
                    advice = VALUES(advice),
                    updated_at = CURRENT_TIMESTAMP
                """, userId, Date.valueOf(date), moodId, description, advice);
        return findByUserAndDate(userId, date).orElseThrow();
    }

    public Optional<DailyMoodData> findByUserAndDate(Long userId, LocalDate date) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("""
                    SELECT id, user_id, mood_date, mood_id, description, advice,
                           created_at, updated_at
                    FROM daily_moods
                    WHERE user_id = ? AND mood_date = ?
                    """, (resultSet, rowNumber) -> new DailyMoodData(
                    resultSet.getLong("id"),
                    resultSet.getLong("user_id"),
                    resultSet.getDate("mood_date").toLocalDate(),
                    resultSet.getString("mood_id"),
                    resultSet.getString("description"),
                    resultSet.getString("advice"),
                    resultSet.getTimestamp("created_at").toLocalDateTime(),
                    resultSet.getTimestamp("updated_at").toLocalDateTime()
            ), userId, Date.valueOf(date)));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }
}
