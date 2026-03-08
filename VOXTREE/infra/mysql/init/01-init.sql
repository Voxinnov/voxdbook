-- Initialize VOXTREE database
CREATE DATABASE IF NOT EXISTS voxtree CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'voxtree'@'%' IDENTIFIED BY 'voxtreepassword';
GRANT ALL PRIVILEGES ON voxtree.* TO 'voxtree'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE voxtree;

