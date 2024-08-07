CREATE TABLE cities(
    city_id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    district_id INT,
    FOREIGN KEY (district_id) REFERENCES district(district_id),
    UNIQUE (district_id, city_name)
);