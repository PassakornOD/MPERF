CREATE TABLE IF NOT EXISTS `insertion_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `user` VARCHAR(255),
  `table_name` VARCHAR(255),
  `status` VARCHAR(50), -- 'Success', 'Error', 'Skip'
  `records_processed` INT,
  `message` TEXT
);
