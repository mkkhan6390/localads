CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `root`@`localhost` 
    SQL SECURITY DEFINER
VIEW `vw_ads` AS
    SELECT 
        `a`.`id` AS `id`,
        `a`.`owner_id` AS `owner_id`,
        `a`.`added_date` AS `added_date`,
        `a`.`title` AS `title`,
        `a`.`description` AS `description`,
        `a`.`pincode` AS `pincode`,
        `a`.`type` AS `type`,
        `a`.`ad_url` AS `url`,
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
        (((`ads` `a`
        JOIN `cities` `c` ON ((`a`.`cityid` = `c`.`id`)))
        JOIN `district` `d` ON ((`a`.`districtid` = `d`.`id`)))
        JOIN `state` `s` ON ((`a`.`stateid` = `s`.`id`)))
    WHERE
        (`a`.`isactive` = 1)
    limit 1