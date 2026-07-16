package com.syncstudy.backend.repository;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class PersonaProfileRepository {

    private final JdbcTemplate jdbcTemplate;

    public PersonaProfileRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Long userId, String answersJson) {
        jdbcTemplate.update(
                """
                INSERT INTO user_personas (user_id, answers_json)
                VALUES (?, CAST(? AS JSON))
                ON DUPLICATE KEY UPDATE
                    answers_json = VALUES(answers_json),
                    updated_at = CURRENT_TIMESTAMP
                """,
                userId,
                answersJson
        );
    }

    public Optional<String> findAnswersJson(Long userId) {
        try {
            String json = jdbcTemplate.queryForObject(
                    "SELECT answers_json FROM user_personas WHERE user_id = ?",
                    String.class,
                    userId
            );
            return Optional.ofNullable(json);
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }
}
