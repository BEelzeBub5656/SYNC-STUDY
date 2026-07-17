package com.syncstudy.backend.repository;

import com.syncstudy.backend.enums.LearningGoalTerm;
import com.syncstudy.backend.model.LearningGoalData;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class LearningGoalRepository {

    private final JdbcTemplate jdbcTemplate;

    public LearningGoalRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void upsert(
            Long userId,
            LearningGoalTerm term,
            String title,
            String detail,
            LocalDate targetDate,
            int progressPercent,
            String actionsJson
    ) {
        jdbcTemplate.update(
                """
                INSERT INTO learning_goals (
                    user_id,
                    term,
                    title,
                    detail,
                    target_date,
                    progress_percent,
                    actions_json
                ) VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    detail = VALUES(detail),
                    target_date = VALUES(target_date),
                    progress_percent = VALUES(progress_percent),
                    actions_json = VALUES(actions_json),
                    updated_at = CURRENT_TIMESTAMP
                """,
                userId,
                term.name(),
                title,
                detail,
                targetDate == null ? null : Date.valueOf(targetDate),
                progressPercent,
                actionsJson
        );
    }

    public List<LearningGoalData> findByUserId(Long userId) {
        return jdbcTemplate.query(
                """
                SELECT id, user_id, term, title, detail, target_date,
                       progress_percent, actions_json, updated_at
                FROM learning_goals
                WHERE user_id = ?
                ORDER BY term
                """,
                (resultSet, rowNumber) -> mapRow(resultSet),
                userId
        );
    }

    public Optional<LearningGoalData> findByUserIdAndTerm(
            Long userId,
            LearningGoalTerm term
    ) {
        try {
            LearningGoalData goal = jdbcTemplate.queryForObject(
                    """
                    SELECT id, user_id, term, title, detail, target_date,
                           progress_percent, actions_json, updated_at
                    FROM learning_goals
                    WHERE user_id = ? AND term = ?
                    """,
                    (resultSet, rowNumber) -> mapRow(resultSet),
                    userId,
                    term.name()
            );
            return Optional.ofNullable(goal);
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    private LearningGoalData mapRow(java.sql.ResultSet resultSet)
            throws java.sql.SQLException {
        Date targetDate = resultSet.getDate("target_date");
        return new LearningGoalData(
                resultSet.getLong("id"),
                resultSet.getLong("user_id"),
                LearningGoalTerm.valueOf(resultSet.getString("term")),
                resultSet.getString("title"),
                resultSet.getString("detail"),
                targetDate == null ? null : targetDate.toLocalDate(),
                resultSet.getInt("progress_percent"),
                resultSet.getString("actions_json"),
                resultSet.getTimestamp("updated_at").toLocalDateTime()
        );
    }
}
