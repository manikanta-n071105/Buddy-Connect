-- JuniorConnect PostgreSQL Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'SENIOR', 'JUNIOR', 'FACULTY')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. ADMIN PERMISSIONS
CREATE TABLE IF NOT EXISTS admin_permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission)
);

-- 3. DIRECTORS
CREATE TABLE IF NOT EXISTS directors (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    director_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. FACULTY
CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    faculty_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    max_juniors INT NOT NULL DEFAULT 5,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_user ON faculty(user_id);

-- 5. SENIORS
CREATE TABLE IF NOT EXISTS seniors (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    senior_code VARCHAR(50) UNIQUE NOT NULL,
    director_id VARCHAR(36) NOT NULL REFERENCES directors(id) ON DELETE RESTRICT,
    department VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seniors_director_id ON seniors(director_id);

-- 6. JUNIORS
CREATE TABLE IF NOT EXISTS juniors (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    register_number VARCHAR(50) UNIQUE NOT NULL,
    senior_id VARCHAR(36) NOT NULL REFERENCES seniors(id) ON DELETE RESTRICT,
    faculty_id VARCHAR(36) REFERENCES faculty(id) ON DELETE SET NULL,
    department VARCHAR(100) NOT NULL,
    batch VARCHAR(30) NOT NULL,
    year VARCHAR(20) NOT NULL,
    joining_date DATE,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    profile_photo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_juniors_senior_id ON juniors(senior_id);
CREATE INDEX IF NOT EXISTS idx_juniors_faculty_id ON juniors(faculty_id);

-- 6. TEMPORARY MENTORS
CREATE TABLE IF NOT EXISTS temporary_mentors (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
    original_senior_id VARCHAR(36) NOT NULL REFERENCES seniors(id) ON DELETE CASCADE,
    temp_senior_id VARCHAR(36) NOT NULL REFERENCES seniors(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ISSUE CATEGORIES
CREATE TABLE IF NOT EXISTS issue_categories (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ISSUES
CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    issue_number VARCHAR(50) UNIQUE NOT NULL,
    reported_by_id VARCHAR(36) NOT NULL REFERENCES users(id),
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id),
    senior_id VARCHAR(36) NOT NULL REFERENCES seniors(id),
    director_id VARCHAR(36) NOT NULL REFERENCES directors(id),
    category_id VARCHAR(36) NOT NULL REFERENCES issue_categories(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'VOTING', 'CLOSED', 'REOPENED', 'ESCALATED', 'CANCELLED')),
    assigned_to_id VARCHAR(36) REFERENCES users(id),
    resolution TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    reopened_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issues_junior ON issues(junior_id);
CREATE INDEX IF NOT EXISTS idx_issues_senior ON issues(senior_id);
CREATE INDEX IF NOT EXISTS idx_issues_director ON issues(director_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);

-- 10. ISSUE COMMENTS
CREATE TABLE IF NOT EXISTS issue_comments (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    issue_id VARCHAR(36) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id VARCHAR(36) NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);

-- 11. ISSUE VOTES
CREATE TABLE IF NOT EXISTS issue_votes (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    issue_id VARCHAR(36) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    voter_id VARCHAR(36) NOT NULL REFERENCES users(id),
    vote_type VARCHAR(30) NOT NULL CHECK (vote_type IN ('SATISFIED', 'PARTIALLY_SATISFIED', 'NOT_SATISFIED')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(issue_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_votes_issue ON issue_votes(issue_id);

-- 12. ISSUE ATTACHMENTS
CREATE TABLE IF NOT EXISTS issue_attachments (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    issue_id VARCHAR(36) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. ONBOARDING ITEMS
CREATE TABLE IF NOT EXISTS onboarding_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    sequence_order INT NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. ONBOARDING PROGRESS
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
    onboarding_item_id VARCHAR(36) NOT NULL REFERENCES onboarding_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(junior_id, onboarding_item_id)
);

-- 15. COMMON QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('YES_NO', 'MULTIPLE_CHOICE', 'RATING', 'TEXT')),
    options JSONB,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. QUESTION RESPONSES
CREATE TABLE IF NOT EXISTS question_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    response_text TEXT,
    response_rating INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(junior_id, question_id)
);

-- 17. SURVEYS
CREATE TABLE IF NOT EXISTS surveys (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. SURVEY QUESTIONS
CREATE TABLE IF NOT EXISTS survey_questions (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    survey_id VARCHAR(36) NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    options JSONB,
    sequence_order INT DEFAULT 0
);

-- 19. SURVEY RESPONSES
CREATE TABLE IF NOT EXISTS survey_responses (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    survey_id VARCHAR(36) NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    question_id VARCHAR(36) NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
    response_text TEXT,
    response_rating INT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. SUGGESTIONS
CREATE TABLE IF NOT EXISTS suggestions (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. SUGGESTION VOTES
CREATE TABLE IF NOT EXISTS suggestion_votes (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    suggestion_id VARCHAR(36) NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(suggestion_id, user_id)
);

-- 22. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    target_audience VARCHAR(50) DEFAULT 'ALL',
    department VARCHAR(100),
    batch VARCHAR(30),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. COLLEGE INFORMATION
CREATE TABLE IF NOT EXISTS college_information (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    sequence_order INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. CAMPUS LOCATIONS
CREATE TABLE IF NOT EXISTS campus_locations (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    building VARCHAR(100),
    floor VARCHAR(50),
    description TEXT,
    contact_person VARCHAR(100),
    phone VARCHAR(30),
    operating_hours VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. EMERGENCY CONTACTS
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(150) NOT NULL,
    contact_type VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    location VARCHAR(150),
    availability VARCHAR(100) DEFAULT '24/7',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 26. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    recipient_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

-- 27. MENTOR CONVERSATIONS
CREATE TABLE IF NOT EXISTS mentor_conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
    senior_id VARCHAR(36) NOT NULL REFERENCES seniors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(junior_id, senior_id)
);

-- 28. MENTOR MESSAGES
CREATE TABLE IF NOT EXISTS mentor_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    conversation_id VARCHAR(36) NOT NULL REFERENCES mentor_conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. DIRECTOR CONVERSATIONS
CREATE TABLE IF NOT EXISTS director_conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    junior_id VARCHAR(36) NOT NULL REFERENCES juniors(id) ON DELETE CASCADE,
    director_id VARCHAR(36) NOT NULL REFERENCES directors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(junior_id, director_id)
);

-- 30. DIRECTOR MESSAGES
CREATE TABLE IF NOT EXISTS director_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    conversation_id VARCHAR(36) NOT NULL REFERENCES director_conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 31. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    actor_id VARCHAR(36) REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
