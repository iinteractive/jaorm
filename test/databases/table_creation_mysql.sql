CREATE TABLE IF NOT EXISTS `user` (`id` SERIAL, `username` VARCHAR(256) NOT NULL, `password` VARCHAR(256) NOT NULL, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `role` (`id` SERIAL, `name` VARCHAR(256) NOT NULL, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `user_prefs` (`user_id` BIGINT UNSIGNED NOT NULL, `theme` VARCHAR(256) NOT NULL, `font` VARCHAR(256) NOT NULL, CONSTRAINT fk_user_prefs_user_id FOREIGN KEY (user_id) REFERENCES user(id)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `user_role` (`user_id` BIGINT UNSIGNED NOT NULL, `role_id` BIGINT UNSIGNED NOT NULL, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), CONSTRAINT fk_user_role_user_id FOREIGN KEY (user_id) REFERENCES user(id), CONSTRAINT fk_user_role_role_id FOREIGN KEY (role_id) REFERENCES role(id)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `message` (`uuid` CHAR(36), `sender_id` BIGINT UNSIGNED NOT NULL, `recipient_id` BIGINT UNSIGNED NOT NULL, `message` TEXT, `read` BOOLEAN DEFAULT FALSE, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`uuid`), CONSTRAINT fk_messager_sender_id FOREIGN KEY (sender_id) REFERENCES user(id), CONSTRAINT fk_messager_recipient_id FOREIGN KEY (recipient_id) REFERENCES user(id)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `meta` (`key` VARCHAR(256) NOT NULL, `value`  VARCHAR(256) NOT NULL, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`key`)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `friend_list` (`user_id` BIGINT UNSIGNED NOT NULL, `friend_id` BIGINT UNSIGNED NOT NULL, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`user_id`, `friend_id`)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `news` (`id` SERIAL, `headline` VARCHAR(256) NOT NULL, `tags` VARCHAR(256) DEFAULT NULL, `story_text` TEXT, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- This table is intentional set up badly for testing purposes
CREATE TABLE IF NOT EXISTS `user_reports` (`id` BIGINT UNSIGNED NOT NULL, `reporting_user_id` BIGINT UNSIGNED NOT NULL, `reported_user_id` BIGINT UNSIGNED NOT NULL, `date_created` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), CONSTRAINT fk_user_reports_reporting_id FOREIGN KEY (reporting_user_id) REFERENCES user(id), CONSTRAINT fk_user_reports_reported_id FOREIGN KEY (reported_user_id) REFERENCES user(id)) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
