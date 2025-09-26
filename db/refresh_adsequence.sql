SHOW VARIABLES LIKE 'event_scheduler';
-- If it's OFF:
SET GLOBAL event_scheduler = ON;


DELIMITER $$

CREATE EVENT refresh_adsequence
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
    -- Step 1: Remove inactive/expired ads
    DELETE s 
    FROM adsequence s
    JOIN ads a ON s.ad_id = a.id
    WHERE a.isactive = 0 
       OR a.is_deleted = 1
       OR a.remaining = 0;

    -- Step 2: Insert newly added ads (last 24h)
    INSERT INTO adsequence (pincode, ad_id, ad_index, created_at)
    SELECT 
        a.pincode,
        a.id,
        COALESCE(pm.max_index, 0) 
            + ROW_NUMBER() OVER (PARTITION BY a.pincode ORDER BY a.display_level DESC, a.added_date) AS ad_index,
        CURDATE()
    FROM ads a
    LEFT JOIN (
        SELECT pincode, COALESCE(MAX(ad_index),0) AS max_index
        FROM adsequence
        GROUP BY pincode
    ) pm ON pm.pincode = a.pincode
    WHERE a.isactive = 1
      AND a.is_deleted = 0
      AND a.remaining > 0
      AND DATE(a.added_date) >= CURDATE() - INTERVAL 1 DAY;
END$$

DELIMITER ;
