package com.syncstudy.backend.repository;

import com.syncstudy.backend.model.UserMemoryData;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UserMemoryRepository {

    private static final String SELECT_COLUMNS = """
            SELECT id, user_id, category, memory_key, value, created_at, updated_at
            FROM user_memories
            """;

    private final JdbcTemplate jdbcTemplate;

    public UserMemoryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<UserMemoryData> findByUserId(Long userId) {
        return jdbcTemplate.query(
                SELECT_COLUMNS + " WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
                this::mapRow,
                userId
        );
    }

    public Optional<UserMemoryData> findByIdAndUserId(Long id, Long userId) {
        return queryOne(SELECT_COLUMNS + " WHERE id = ? AND user_id = ?", id, userId);
    }

    public Optional<UserMemoryData> findByKey(
            Long userId,
            String category,
            String memoryKey
    ) {
        return queryOne(
                SELECT_COLUMNS + " WHERE user_id = ? AND category = ? AND memory_key = ?",
                userId,
                category,
                memoryKey
        );
    }

    public void lockUser(Long userId) {
        jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE id = ? FOR UPDATE",
                Long.class,
                userId
        );
    }

    public int countByUserId(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_memories WHERE user_id = ?",
                Integer.class,
                userId
        );
        return count == null ? 0 : count;
    }

    public UserMemoryData upsert(
            Long userId,
            String category,
            String memoryKey,
            String value
    ) {
        jdbcTemplate.update("""
                INSERT INTO user_memories (user_id, category, memory_key, value)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP
                """, userId, category, memoryKey, value);
        return findByKey(userId, category, memoryKey).orElseThrow();
    }

    public boolean deleteByIdAndUserId(Long id, Long userId) {
        return jdbcTemplate.update(
                "DELETE FROM user_memories WHERE id = ? AND user_id = ?",
                id,
                userId
        ) == 1;
    }

    public boolean deleteByKey(Long userId, String memoryKey, String category) {
        if (category == null || category.isBlank()) {
            return jdbcTemplate.update(
                    "DELETE FROM user_memories WHERE user_id = ? AND memory_key = ?",
                    userId,
                    memoryKey
            ) > 0;
        }
        return jdbcTemplate.update(
                "DELETE FROM user_memories WHERE user_id = ? AND category = ? AND memory_key = ?",
                userId,
                category,
                memoryKey
        ) == 1;
    }

    private Optional<UserMemoryData> queryOne(String sql, Object... parameters) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, this::mapRow, parameters));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    private UserMemoryData mapRow(java.sql.ResultSet resultSet, int rowNumber)
            throws java.sql.SQLException {
        return new UserMemoryData(
                resultSet.getLong("id"),
                resultSet.getLong("user_id"),
                resultSet.getString("category"),
                resultSet.getString("memory_key"),
                resultSet.getString("value"),
                resultSet.getTimestamp("created_at").toLocalDateTime(),
                resultSet.getTimestamp("updated_at").toLocalDateTime()
        );
    }
}
