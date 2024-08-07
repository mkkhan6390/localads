CREATE TABLE `ads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `display_level` int NOT NULL,
  `cityid` varchar(255) NOT NULL,
  `districtid`INT NOT NULL,
  `stateid` INT NOT NULL,
  `countryid` INT NOT NULL,
  `added_date` datetime NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `pincode` varchar(6) NOT NULL,
  `type` enum('image','video','audio') NOT NULL,
  `url` varchar(255) NOT NULL,
  `views` int DEFAULT '0',
  `clicks` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


select * from ad where (city = "locationcity") or (district = "locationdistrict" and display_level>2) or