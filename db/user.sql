CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` varchar(255) NOT NULL,
  `password` varchar(60) NOT NULL,
  `email` varchar(255) NULL,
  `phone` varchar(20) NOT NULL,
  `apikey` varchar(255) NULL,
  `createddate` datetime NOT NULL,
  `modifieddate` datetime NOT NULL,
  `isactive` bit(1) DEFAULT 1,
  `usertype` ENUM('ADMIN', 'ADVERTISER', 'DEVELOPER') NOT NULL DEFAULT 'ADVERTISER',
   UNIQUE KEY `username` (`username`)
)