CREATE 
VIEW `ads`.`vw_ads` AS
    SELECT 
        `a`.`id` AS `id`,
        `a`.`owner_id` AS `owner_id`,
        `a`.`added_date` AS `added_date`,
        `a`.`title` AS `title`,
        `a`.`description` AS `description`,
        `a`.`pincode` AS `pincode`,
        `a`.`type` AS `type`,
        `a`.`url` AS `url`,
        `a`.`views` AS `views`,
        `a`.`clicks` AS `clicks`,
        `a`.`lastcalled` AS `lastcalled`,
        `a`.`remaining` AS `remaining`,
        CAST(`a`.`isactive` AS SIGNED) AS `isactive`,
        `c`.`name` AS `city`,
        `d`.`name` AS `district`,
        `s`.`name` AS `state`,
        'India' AS `country`
    FROM
        (((`ads`.`ads` `a`
        JOIN `ads`.`cities` `c` ON (((`a`.`owner_id` = 1)
            AND (`a`.`cityid` = `c`.`id`))))
        JOIN `ads`.`districts` `d` ON ((`a`.`districtid` = `d`.`id`)))
        JOIN `ads`.`states` `s` ON ((`a`.`stateid` = `s`.`id`)))