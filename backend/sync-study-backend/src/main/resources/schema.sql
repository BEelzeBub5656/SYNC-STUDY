CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    identity VARCHAR(10) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_phone (phone),
    CONSTRAINT chk_users_identity CHECK (identity IN ('GUEST', 'USER'))
);

CREATE TABLE IF NOT EXISTS user_personas (
    user_id BIGINT NOT NULL,
    answers_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_user_personas_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_exam_plans_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS study_check_ins (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    check_in_date DATE NOT NULL,
    points INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_study_check_ins_user_date (user_id, check_in_date),
    INDEX idx_study_check_ins_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS today_tasks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    estimated_minutes INT NOT NULL,
    source VARCHAR(16) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    task_date DATE NOT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_today_tasks_user_date (user_id, task_date, completed)
);

CREATE TABLE IF NOT EXISTS learning_goals (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    term VARCHAR(5) NOT NULL,
    title VARCHAR(60) NOT NULL,
    detail VARCHAR(255) NOT NULL,
    target_date DATE NULL,
    progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
    actions_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_learning_goals_user_term (user_id, term),
    CONSTRAINT chk_learning_goals_term CHECK (term IN ('SHORT', 'LONG')),
    CONSTRAINT chk_learning_goals_progress
        CHECK (progress_percent BETWEEN 0 AND 100),
    CONSTRAINT fk_learning_goals_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_memories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category VARCHAR(40) NOT NULL,
    memory_key VARCHAR(80) NOT NULL,
    value VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_memories_user_category_key (user_id, category, memory_key),
    INDEX idx_user_memories_user_updated (user_id, updated_at),
    CONSTRAINT fk_user_memories_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_knowledge_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    title VARCHAR(160) NOT NULL,
    course VARCHAR(100) NOT NULL,
    source_type VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_knowledge_documents_user_updated (user_id, updated_at),
    INDEX idx_knowledge_documents_user_course (user_id, course),
    CONSTRAINT fk_knowledge_documents_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_moods (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    mood_date DATE NOT NULL,
    mood_id VARCHAR(30) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    advice VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_daily_moods_user_date (user_id, mood_date),
    CONSTRAINT fk_daily_moods_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_idempotency_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    operation VARCHAR(64) NOT NULL,
    request_fingerprint CHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL,
    response_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_agent_idempotency_user_key_operation
        (user_id, idempotency_key, operation),
    INDEX idx_agent_idempotency_created (created_at),
    CONSTRAINT chk_agent_idempotency_status
        CHECK (status IN ('PROCESSING', 'COMPLETED')),
    CONSTRAINT fk_agent_idempotency_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
