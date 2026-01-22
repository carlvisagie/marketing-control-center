-- Marketing Control Center Tables for PostgreSQL
-- Run this on your Render PostgreSQL database (purposeful-db)

-- Create enums
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE platform AS ENUM ('facebook', 'instagram', 'linkedin', 'tiktok');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('pending', 'scheduled', 'posted', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    "openId" VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    "loginMethod" VARCHAR(64),
    role role NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Platform connections table
CREATE TABLE IF NOT EXISTS platform_connections (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id),
    platform platform NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "pageId" VARCHAR(255),
    "pageName" VARCHAR(255),
    "expiresAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    platforms JSONB NOT NULL,
    "mediaUrls" JSONB,
    link TEXT,
    "scheduledTime" TIMESTAMP,
    status post_status NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Post results table
CREATE TABLE IF NOT EXISTS post_results (
    id SERIAL PRIMARY KEY,
    "scheduledPostId" INTEGER NOT NULL REFERENCES scheduled_posts(id),
    platform platform NOT NULL,
    success BOOLEAN NOT NULL,
    "postId" VARCHAR(255),
    error TEXT,
    "postedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the owner user (Carl Visagie)
INSERT INTO users ("openId", name, email, role, "createdAt", "updatedAt", "lastSignedIn")
VALUES ('owner', 'Carl Visagie', 'coachingpurposefulliving@gmail.com', 'admin', NOW(), NOW(), NOW())
ON CONFLICT ("openId") DO NOTHING;

-- Verify owner was created
SELECT id, "openId", name, email, role FROM users WHERE "openId" = 'owner';
