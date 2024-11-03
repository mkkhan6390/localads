CREATE PROCEDURE ads.getad()
BEGIN

    DECLARE ad_id INT;


    START TRANSACTION;
 
    SELECT id INTO ad_id
    FROM ads.ads
    WHERE 
        remaining > 0 AND
          ((cityid = 1105)
       OR (districtid = 219 AND display_level >= 2)
       OR (stateid = 21 AND display_level >= 3)
       OR (countryid = 1 AND display_level >= 4))
    ORDER BY lastcalled
    LIMIT 1
    FOR UPDATE;
 
    UPDATE ads.ads
    SET lastcalled = NOW()
    WHERE id = ad_id;


    SELECT id, title, description, pincode, type, url FROM ads.ads
    WHERE id = ad_id;

    COMMIT;
END;
