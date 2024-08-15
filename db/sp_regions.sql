DELIMITER //

CREATE PROCEDURE GetLocationDetailsByPincode(
    IN inputPincode VARCHAR(10),
    OUT cityId INT,
    OUT districtId INT,
    OUT stateId INT,
    OUT countryId INT
)

BEGIN
    DECLARE cityId INT;
    DECLARE districtId INT;
    DECLARE stateId INT;
    DECLARE countryId INT 

    -- Get the city_id
    SELECT city_id INTO cityId
    FROM pincodes
    WHERE pincode = inputPincode;

    -- Get the district_id
    SELECT district_id INTO districtId
    FROM cities
    WHERE id = cityId;

    -- Get the state_id
    SELECT state_id INTO stateId
    FROM districts
    WHERE id = districtId;

    -- Get the country_id
    countryId = 1

END //

DELIMITER ;
