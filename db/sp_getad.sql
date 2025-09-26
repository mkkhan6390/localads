-- Need to improve logic for performance....
CREATE PROCEDURE `getad`(
    IN p_pincode INT,
    IN p_index INT
)
BEGIN
    DECLARE sel_ad_id INT;
    DECLARE next_index INT;
    
    START TRANSACTION;

    SELECT ad_id, ad_index+1 INTO sel_ad_id, next_index
    FROM ads.adsequence
    WHERE  
        pincode = p_pincode AND
        ad_index = p_index
    LIMIT 1;

	if sel_ad_id  IS NULL THEN
    SELECT ad_id, ad_index+1 INTO sel_ad_id, next_index
    FROM ads.adsequence
    WHERE  
        pincode = p_pincode AND
        ad_index > p_index
    LIMIT 1;
	END IF;
    
    IF sel_ad_id  IS NULL THEN
    SELECT ad_id, ad_index+1 INTO sel_ad_id, next_index
    FROM ads.adsequence
    WHERE
		pincode = p_pincode
	LIMIT 1;
	END IF;
    
	-- also need to decrement remaining count. right now ignoring that part for testing other things.
    UPDATE ads.ads
    SET 
		lastcalled = NOW(),
        views = views + 1
    WHERE id = sel_ad_id;

    SELECT id, title, description, pincode, type, ad_url, landing_url, next_index as next_index
    FROM ads.ads
    WHERE id = sel_ad_id;

    COMMIT;
END