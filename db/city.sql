CREATE TABLE cities(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    district_id INT,
    FOREIGN KEY (district_id) REFERENCES district(id),
    UNIQUE (district_id, name)
);