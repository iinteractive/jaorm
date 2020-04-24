CREATE TABLE IF NOT EXISTS "user" ("id" SERIAL PRIMARY KEY, "username" VARCHAR(256) NOT NULL, "password" VARCHAR(256) NOT NULL, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6));
CREATE TABLE IF NOT EXISTS "role" ("id" SERIAL PRIMARY KEY, "name" VARCHAR(256) NOT NULL, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6));
CREATE TABLE IF NOT EXISTS "user_prefs" ("user_id" BIGINT NOT NULL, "theme" VARCHAR(256) NOT NULL, "font" VARCHAR(256) NOT NULL, CONSTRAINT fk_user_prefs_user_id FOREIGN KEY (user_id) REFERENCES "user" (id));
CREATE TABLE IF NOT EXISTS "user_role" ("user_id" BIGINT NOT NULL, "role_id" BIGINT NOT NULL, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), CONSTRAINT fk_user_role_user_id FOREIGN KEY (user_id) REFERENCES "user" (id), CONSTRAINT fk_user_role_role_id FOREIGN KEY (role_id) REFERENCES "role" (id));
CREATE TABLE IF NOT EXISTS "message" ("uuid" CHAR(36) PRIMARY KEY, "sender_id" BIGINT NOT NULL, "recipient_id" BIGINT NOT NULL, "message" TEXT, "read" BOOLEAN DEFAULT FALSE, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), CONSTRAINT fk_messager_sender_id FOREIGN KEY (sender_id) REFERENCES "user" (id), CONSTRAINT fk_messager_recipient_id FOREIGN KEY (recipient_id) REFERENCES "user" (id));
CREATE TABLE IF NOT EXISTS "meta" ("key" VARCHAR(256) PRIMARY KEY NOT NULL, "value"  VARCHAR(256) NOT NULL, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6));
CREATE TABLE IF NOT EXISTS "friend_list" ("user_id" BIGINT NOT NULL, "friend_id" BIGINT NOT NULL, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY ("user_id", "friend_id"));
CREATE TABLE IF NOT EXISTS "news" ("id" SERIAL PRIMARY KEY, "headline" VARCHAR(256) NOT NULL, "tags" VARCHAR(256) DEFAULT NULL, "story_text" TEXT, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6));
-- This table is intentionally set up badly for testing purposes
CREATE TABLE IF NOT EXISTS "user_reports" ("id" BIGINT NOT NULL, "reporting_user_id" BIGINT NOT NULL, "reported_user_id" BIGINT NOT NULL, "date_created" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), CONSTRAINT fk_user_reports_reporting_id FOREIGN KEY (reporting_user_id) REFERENCES "user" (id), CONSTRAINT fk_user_reports_reported_id FOREIGN KEY (reported_user_id) REFERENCES "user" (id));


SELECT setval('user_id_seq', 7);
SELECT setval('role_id_seq', 4);