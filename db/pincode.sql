CREATE TABLE pincode (
    pincode VARCHAR(6) PRIMARY KEY,
    city_id INT,
    FOREIGN KEY (city_id) REFERENCES city(id)
);