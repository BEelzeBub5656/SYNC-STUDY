package com.syncstudy.backend.repository;


import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import com.syncstudy.backend.model.UserAuthData;
import org.springframework.dao.EmptyResultDataAccessException;

import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insertUser(
            String username,
            String passwordHash,
            String phone
    ) {
        String sql = """
                INSERT INTO users (
                    username,
                    password_hash,
                    phone,
                    identity
                )
                VALUES (?, ?, ?, 'USER')
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement =
                    connection.prepareStatement(
                            sql,
                            Statement.RETURN_GENERATED_KEYS
                    );

            statement.setString(1, username);
            statement.setString(2, passwordHash);
            statement.setString(3, phone);

            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();

        if (key == null) {
            throw new IllegalStateException("创建用户失败，未获取到用户 ID");
        }

        return key.longValue();
    }

    public boolean existsByUsername(String username) {
        String sql = """
                SELECT COUNT(*)
                FROM users
                WHERE username = ?
                """;

        Integer count = jdbcTemplate.queryForObject(
                sql,
                Integer.class,
                username
        );

        return count != null && count > 0;
    }

    public boolean existsByPhone(String phone) {
        String sql = """
                SELECT COUNT(*)
                FROM users
                WHERE phone = ?
                """;

        Integer count = jdbcTemplate.queryForObject(
                sql,
                Integer.class,
                phone
        );

        return count != null && count > 0;
    }

    public boolean existsById(Long userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ?",
                Integer.class,
                userId
        );
        return count != null && count > 0;
    }

    public Optional<UserAuthData> findAuthByUsername(
            String username
    ) {
        String sql = """
            SELECT
                id,
                username,
                password_hash
            FROM users
            WHERE username = ?
            """;

        try {
            UserAuthData user = jdbcTemplate.queryForObject(
                    sql,
                    (resultSet, rowNumber) ->
                            new UserAuthData(
                                    resultSet.getLong("id"),
                                    resultSet.getString("username"),
                                    resultSet.getString("password_hash")
                            ),
                    username
            );

            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }
}
