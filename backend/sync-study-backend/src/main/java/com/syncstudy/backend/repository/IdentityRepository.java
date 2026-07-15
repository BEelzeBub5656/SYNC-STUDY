package com.syncstudy.backend.repository;

import com.syncstudy.backend.enums.IdentityType;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class IdentityRepository {

    private final JdbcTemplate jdbcTemplate;

    public IdentityRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int updateIdentity(
            Long userId,
            IdentityType identity
    ) {
        String sql = """
                UPDATE users
                SET identity = ?
                WHERE id = ?
                """;

        return jdbcTemplate.update(
                sql,
                identity.name(),
                userId
        );
    }

    public Optional<IdentityType> findIdentityByUserId(
            Long userId
    ) {
        String sql = """
                SELECT identity
                FROM users
                WHERE id = ?
                """;

        try {
            String identity = jdbcTemplate.queryForObject(
                    sql,
                    String.class,
                    userId
            );

            return Optional.of(
                    IdentityType.valueOf(identity)
            );
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }
}