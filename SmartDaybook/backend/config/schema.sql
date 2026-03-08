CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120),
 email VARCHAR(150) UNIQUE,
 phone VARCHAR(20),
 password VARCHAR(255),
 role ENUM('user', 'admin') DEFAULT 'user',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 name VARCHAR(100),
 type ENUM('income','expense'),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 category_id INT,
 amount DECIMAL(10,2),
 type ENUM('income','expense','credit','debit'),
 payment_method VARCHAR(50),
 description TEXT,
 attachment VARCHAR(255),
 transaction_date DATE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS todos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 title VARCHAR(200),
 description TEXT,
 due_date DATE,
 priority ENUM('low','medium','high'),
 status ENUM('pending','completed'),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT,
 title VARCHAR(200),
 description TEXT,
 start_date DATE,
 due_date DATE,
 priority ENUM('low','medium','high'),
 status ENUM('pending','in_progress','completed','overdue'),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_subtasks (
 id INT AUTO_INCREMENT PRIMARY KEY,
 task_id INT,
 title VARCHAR(200),
 status ENUM('pending','completed'),
 FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
