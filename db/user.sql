CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(60) NOT NULL,
  `email` varchar(255) NULL,
  `phone` varchar(20) NOT NULL,
  `createddate` datetime NOT NULL,
  `modifieddate` datetime NOT NULL,
  `isactive` bit(0) DEFAULT 1
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
