CREATE TABLE adsequence (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pincode VARCHAR(6) NOT NULL,
  ad_id INT NOT NULL,
  ad_index INT NOT NULL,
  created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
  UNIQUE KEY (pincode, ad_id)
);
