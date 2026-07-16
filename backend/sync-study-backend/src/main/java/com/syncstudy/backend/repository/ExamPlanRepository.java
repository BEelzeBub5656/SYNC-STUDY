package com.syncstudy.backend.repository;

import com.syncstudy.backend.model.ExamPlanData;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Optional;

@Repository
public class ExamPlanRepository {

    private final JdbcTemplate jdbcTemplate;

    public ExamPlanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(Long userId, String subject, java.time.LocalDate examDate) {
        String sql = """
                INSERT INTO exam_plans (user_id, subject, exam_date)
                VALUES (?, ?, ?)
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    sql,
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, userId);
            statement.setString(2, subject);
            statement.setDate(3, Date.valueOf(examDate));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("创建考试规划失败，未获取到规划 ID");
        }
        return key.longValue();
    }

    public Optional<ExamPlanData> findById(Long id) {
        String sql = """
                SELECT id, user_id, subject, exam_date, created_at
                FROM exam_plans
                WHERE id = ?
                """;
        return queryOne(sql, id);
    }

    public Optional<ExamPlanData> findLatestByUserId(Long userId) {
        String sql = """
                SELECT id, user_id, subject, exam_date, created_at
                FROM exam_plans
                WHERE user_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """;
        return queryOne(sql, userId);
    }

    private Optional<ExamPlanData> queryOne(String sql, Object parameter) {
        try {
            ExamPlanData plan = jdbcTemplate.queryForObject(
                    sql,
                    (resultSet, rowNumber) -> new ExamPlanData(
                            resultSet.getLong("id"),
                            resultSet.getLong("user_id"),
                            resultSet.getString("subject"),
                            resultSet.getDate("exam_date").toLocalDate(),
                            resultSet.getTimestamp("created_at").toLocalDateTime()
                    ),
                    parameter
            );
            return Optional.ofNullable(plan);
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }
}
