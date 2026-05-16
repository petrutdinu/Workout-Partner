-- Workout Partner Database Initialization

-- Users table (synced from Keycloak on first login)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'Athlete',
    -- Fitness profile
    bio TEXT,
    age SMALLINT CHECK (age > 0 AND age < 120),
    gender VARCHAR(20),
    city VARCHAR(100),
    fitness_level VARCHAR(20) CHECK (fitness_level IN ('Beginner','Intermediate','Advanced','Elite')),
    primary_goal VARCHAR(50),
    workout_types TEXT[],
    preferred_days TEXT[],
    preferred_time VARCHAR(20),
    weight_kg DECIMAL(5,2),
    -- Trainer fields
    certifications TEXT[],
    hourly_rate DECIMAL(8,2),
    profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    workout_type VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_minutes SMALLINT,
    total_calories DECIMAL(8,2),
    is_public BOOLEAN DEFAULT true,
    notes TEXT,
    muscle_group VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workout exercises (sets/reps/weight per session)
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    sets SMALLINT,
    reps SMALLINT,
    weight_kg DECIMAL(6,2),
    duration_sec INTEGER,
    distance_km DECIMAL(8,3),
    calories DECIMAL(6,2),
    met_value DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner connections (AI match + manual requests)
CREATE TABLE IF NOT EXISTS partner_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    match_score DECIMAL(5,4),
    initiated_by VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_connection UNIQUE (requester_id, addressee_id),
    CONSTRAINT no_self_connection CHECK (requester_id != addressee_id)
);

-- Direct messages (1-to-1, no rooms)
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shared workout sessions (competitive co-op between two partners)
CREATE TABLE IF NOT EXISTS shared_workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    workout_type VARCHAR(50) NOT NULL,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES users(id) ON DELETE SET NULL,
    host_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    guest_session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shared_status_check CHECK (status IN ('pending','active','finished'))
);

CREATE INDEX IF NOT EXISTS idx_shared_host ON shared_workout_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_shared_guest ON shared_workout_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_shared_status ON shared_workout_sessions(status);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_fitness_level ON users(fitness_level);
CREATE INDEX IF NOT EXISTS idx_users_primary_goal ON users(primary_goal);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_profile_complete ON users(profile_complete);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started_at ON workout_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_public ON workout_sessions(is_public);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_id ON workout_exercises(session_id);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON partner_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON partner_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON partner_connections(status);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_sent_at ON direct_messages(sent_at DESC);
