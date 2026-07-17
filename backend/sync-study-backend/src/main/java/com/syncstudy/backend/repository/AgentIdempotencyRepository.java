package com.syncstudy.backend.repository;

import com.syncstudy.backend.model.AgentIdempotencyData;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class AgentIdempotencyRepository {

    private final JdbcTemplate jdbcTemplate;

    public AgentIdempotencyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 利用唯一键原子抢占。同一事务中的并发 INSERT IGNORE 会等待首个事务完成，
     * 因而后续读取能看到首个请求保存的最终响应。
     */
    public boolean claim(
            Long userId,
            String idempotencyKey,
            String operation,
            String requestFingerprint
    ) {
        return jdbcTemplate.update("""
                INSERT IGNORE INTO agent_idempotency_records
                    (user_id, idempotency_key, operation, request_fingerprint, status)
                VALUES (?, ?, ?, ?, 'PROCESSING')
                """, userId, idempotencyKey, operation, requestFingerprint) == 1;
    }

    public Optional<AgentIdempotencyData> findForUpdate(
            Long userId,
            String idempotencyKey,
            String operation
    ) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("""
                    SELECT id, user_id, idempotency_key, operation,
                           request_fingerprint, status, response_json
                    FROM agent_idempotency_records
                    WHERE user_id = ? AND idempotency_key = ? AND operation = ?
                    FOR UPDATE
                    """, (resultSet, rowNumber) -> new AgentIdempotencyData(
                    resultSet.getLong("id"),
                    resultSet.getLong("user_id"),
                    resultSet.getString("idempotency_key"),
                    resultSet.getString("operation"),
                    resultSet.getString("request_fingerprint"),
                    resultSet.getString("status"),
                    resultSet.getString("response_json")
            ), userId, idempotencyKey, operation));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    public boolean complete(Long id, String responseJson) {
        return jdbcTemplate.update("""
                UPDATE agent_idempotency_records
                SET status = 'COMPLETED', response_json = ?
                WHERE id = ? AND status = 'PROCESSING'
                """, responseJson, id) == 1;
    }
}
