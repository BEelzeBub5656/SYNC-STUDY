package com.syncstudy.backend.repository;

import com.syncstudy.backend.model.KnowledgeDocumentData;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class KnowledgeDocumentRepository {

    private final JdbcTemplate jdbcTemplate;

    public KnowledgeDocumentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(
            Long userId,
            String title,
            String course,
            String sourceType,
            String content
    ) {
        String sql = """
                INSERT INTO course_knowledge_documents
                    (user_id, title, course, source_type, content)
                VALUES (?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    sql,
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setLong(1, userId);
            statement.setString(2, title);
            statement.setString(3, course);
            statement.setString(4, sourceType);
            statement.setString(5, content);
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("创建课程资料失败，未获取到资料 ID");
        }
        return key.longValue();
    }

    public List<KnowledgeDocumentData> search(Long userId, String query, int limit) {
        String baseSql = """
                SELECT id, user_id, title, course, source_type, content,
                       created_at, updated_at
                FROM course_knowledge_documents
                WHERE user_id = ?
                """;
        if (query == null || query.isBlank()) {
            return jdbcTemplate.query(
                    baseSql + " ORDER BY updated_at DESC, id DESC LIMIT ?",
                    this::mapRow,
                    userId,
                    limit
            );
        }
        String pattern = "%" + escapeLike(query.trim()) + "%";
        return jdbcTemplate.query(
                baseSql + """
                         AND (title LIKE ? ESCAPE '='
                              OR course LIKE ? ESCAPE '='
                              OR content LIKE ? ESCAPE '=')
                        ORDER BY updated_at DESC, id DESC
                        LIMIT ?
                        """,
                this::mapRow,
                userId,
                pattern,
                pattern,
                pattern,
                limit
        );
    }

    public KnowledgeDocumentData findOwned(Long id, Long userId) {
        List<KnowledgeDocumentData> results = jdbcTemplate.query("""
                SELECT id, user_id, title, course, source_type, content,
                       created_at, updated_at
                FROM course_knowledge_documents
                WHERE id = ? AND user_id = ?
                """, this::mapRow, id, userId);
        return results.isEmpty() ? null : results.get(0);
    }

    public boolean delete(Long id, Long userId) {
        return jdbcTemplate.update(
                "DELETE FROM course_knowledge_documents WHERE id = ? AND user_id = ?",
                id,
                userId
        ) == 1;
    }

    private String escapeLike(String input) {
        return input.replace("=", "==").replace("%", "=%").replace("_", "=_");
    }

    private KnowledgeDocumentData mapRow(java.sql.ResultSet resultSet, int rowNumber)
            throws java.sql.SQLException {
        return new KnowledgeDocumentData(
                resultSet.getLong("id"),
                resultSet.getLong("user_id"),
                resultSet.getString("title"),
                resultSet.getString("course"),
                resultSet.getString("source_type"),
                resultSet.getString("content"),
                resultSet.getTimestamp("created_at").toLocalDateTime(),
                resultSet.getTimestamp("updated_at").toLocalDateTime()
        );
    }
}
