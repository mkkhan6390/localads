CREATE TABLE `ads` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `owner_id` int NOT NULL,
  `display_level` int NOT NULL,
  `cityid` varchar(255) NOT NULL,
  `districtid`INT NOT NULL,
  `stateid` INT NOT NULL,
  `countryid` INT NOT NULL,
  `added_date` datetime NOT NULL,
  `last_modified_date` datetime NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `pincode` varchar(6) NOT NULL,
  `type` enum('image','video','audio') NOT NULL,
  `ad_url` varchar(255) NOT NULL,
  `landing_url` varchar(255) DEFAULT '', -- need a default landing page
  `views` int DEFAULT '0',
  `clicks` int DEFAULT '0', 
  `lastcalled` datetime DEFAULT NULL,
  `remaining` int DEFAULT '0',
  `isactive` bit(1) DEFAULT 0,
  `is_deleted` bit(1) DEFAULT 0
) 