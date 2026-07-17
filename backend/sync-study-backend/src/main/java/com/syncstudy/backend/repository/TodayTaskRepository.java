package com.syncstudy.backend.repository;

import com.syncstudy.backend.model.TodayTaskData;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class TodayTaskRepository {

    private final JdbcTemplate jdbcTemplate;

    public TodayTaskRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(
            Long userId,
            String title,
            int estimatedMinutes,
            String source,
            LocalDate taskDate
    ) {
        String sql = """
                INSERT INTO today_tasks (
                    user_id, title, estimated_minutes, source, task_date
                ) VALUES (?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    sql,
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, userId);
            statement.setString(2, title);
            statement.setInt(3, estimatedMinutes);
            statement.setString(4, source);
            statement.setDate(5, Date.valueOf(taskDate));
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("创建今日任务失败，未获取到任务 ID");
        }
        return key.longValue();
    }

    public List<TodayTaskData> findByUserAndDate(Long userId, LocalDate taskDate) {
        String sql = """
                SELECT id, user_id, title, estimated_minutes, source, completed,
                       task_date, completed_at, created_at
                FROM today_tasks
                WHERE user_id = ? AND task_date = ?
                ORDER BY completed ASC, created_at ASC, id ASC
                """;
        return jdbcTemplate.query(
                sql,
                (resultSet, rowNumber) -> new TodayTaskData(
                        resultSet.getLong("id"),
                        resultSet.getLong("user_id"),
                        resultSet.getString("title"),
                        resultSet.getInt("estimated_minutes"),
                        resultSet.getString("source"),
                        resultSet.getBoolean("completed"),
                        resultSet.getDate("task_date").toLocalDate(),
                        resultSet.getTimestamp("completed_at") == null
                                ? null
                                : resultSet.getTimestamp("completed_at").toLocalDateTime(),
                        resultSet.getTimestamp("created_at").toLocalDateTime()
                ),
                userId,
                Date.valueOf(taskDate)
        );
    }

    public Optional<TodayTaskData> findByIdAndUserId(Long id, Long userId) {
        List<TodayTaskData> tasks = jdbcTemplate.query("""
                SELECT id, user_id, title, estimated_minutes, source, completed,
                       task_date, completed_at, created_at
                FROM today_tasks
                WHERE id = ? AND user_id = ?
                """, (resultSet, rowNumber) -> mapRow(resultSet), id, userId);
        return tasks.stream().findFirst();
    }

    public boolean update(
            Long id,
            Long userId,
            String title,
            int estimatedMinutes,
            boolean completed
    ) {
        String sql = """
                UPDATE today_tasks
                SET title = ?, estimated_minutes = ?, completed = ?,
                    completed_at = CASE
                        WHEN ? AND completed_at IS NULL THEN CURRENT_TIMESTAMP
                        WHEN NOT ? THEN NULL
                        ELSE completed_at
                    END
                WHERE id = ? AND user_id = ?
                """;
        return jdbcTemplate.update(
                sql,
                title,
                estimatedMinutes,
                completed,
                completed,
                completed,
                id,
                userId
        ) == 1;
    }

    public boolean updateCompletion(Long id, Long userId, boolean completed) {
        String sql = """
                UPDATE today_tasks
                SET completed = ?,
                    completed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END
                WHERE id = ? AND user_id = ?
                """;
        return jdbcTemplate.update(sql, completed, completed, id, userId) == 1;
    }

    public boolean delete(Long id, Long userId) {
        return jdbcTemplate.update(
                "DELETE FROM today_tasks WHERE id = ? AND user_id = ?",
                id,
                userId
        ) == 1;
    }

    private TodayTaskData mapRow(java.sql.ResultSet resultSet)
            throws java.sql.SQLException {
        return new TodayTaskData(
                resultSet.getLong("id"),
                resultSet.getLong("user_id"),
                resultSet.getString("title"),
                resultSet.getInt("estimated_minutes"),
                resultSet.getString("source"),
                resultSet.getBoolean("completed"),
                resultSet.getDate("task_date").toLocalDate(),
                resultSet.getTimestamp("completed_at") == null
                        ? null
                        : resultSet.getTimestamp("completed_at").toLocalDateTime(),
                resultSet.getTimestamp("created_at").toLocalDateTime()
        );
    }
}
