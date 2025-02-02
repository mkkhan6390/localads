CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT, 
  `name` VARCHAR(10) NOT NULL,
  `description` VARCHAR(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;