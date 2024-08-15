CREATE TABLE district (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT,
    FOREIGN KEY (state_id) REFERENCES state(id),
    UNIQUE (state_id, name)
);


