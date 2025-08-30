CREATE TABLE `apps` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `user_id` int NOT NULL,
  `type` enum('WEBSITE','APP') NOT NULL DEFAULT 'WEBSITE',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`user_id`)
);
