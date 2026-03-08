-- Smart Daybook Database Dump
-- Generated on 2026-03-08T08:46:21.576Z

DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `categories` VALUES 
(1, 4, 'Shopping', 'expense', '2026-03-07 09:39:05'),
(2, 4, 'test', 'expense', '2026-03-07 17:10:53');

DROP TABLE IF EXISTS `task_subtasks`;
CREATE TABLE `task_subtasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `status` enum('pending','completed') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','in_progress','completed','overdue') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `tasks` VALUES 
(1, 4, 'VOXINNOV Pending payment ', 'collect all the pending payment ', '2026-03-04 18:30:00', '2026-03-11 18:30:00', 'medium', 'pending', '2026-03-05 18:55:39'),
(2, 4, 'vishnu', 'vishnu', NULL, '2026-03-05 18:30:00', 'medium', 'completed', '2026-03-07 17:19:12');

DROP TABLE IF EXISTS `todos`;
CREATE TABLE `todos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','completed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `todos` VALUES 
(1, 4, 'Meet PPP', 'today go to PPP', NULL, 'high', 'pending', '2026-03-05 19:16:29'),
(4, 4, 'hjhvjh', NULL, NULL, 'medium', 'pending', '2026-03-07 17:11:26'),
(5, 4, 'ggg', NULL, NULL, 'medium', 'pending', '2026-03-07 17:14:37'),
(6, 4, 'test', NULL, NULL, 'medium', 'pending', '2026-03-07 17:15:43'),
(7, 4, 'test', NULL, NULL, 'medium', 'pending', '2026-03-07 17:18:41');

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` enum('income','expense','credit','debit') NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `description` text,
  `attachment` varchar(255) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `transactions` VALUES 
(1, 4, NULL, '200.00', 'income', NULL, 'test', NULL, '2026-03-05 18:30:00', '2026-03-05 19:14:33'),
(2, 4, NULL, '150.00', 'expense', NULL, 'test', NULL, '2026-03-05 18:30:00', '2026-03-05 19:14:51'),
(3, 4, NULL, '150.00', 'expense', NULL, 'test', NULL, '2026-03-05 18:30:00', '2026-03-05 19:14:51');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `role` enum('user','admin') DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `users` VALUES 
(1, 'Niah Jisha Vishnu', 'jisha@voxinnov.com', '08086172344', '$2b$10$fgHw94DJnztaVTbvWGk9Nu1iDeEWSOeTSmMPRy.j.FY1hLjEs.AHC', '2026-03-04 19:06:07', '2026-03-06 18:12:17', 'admin'),
(2, 'Test User', 'vishnuvox@gmail.com', '9999999999', '$2b$10$rXcbj.AjRGweOHWwhLcDnuLPHky21LE9cwMn5PvtzqnTcNA8u4qk6', '2026-03-04 19:11:00', NULL, 'user'),
(3, 'vis', 'vis@gmail.com', '9400380008', '$2b$10$rp8S//fhiMoIoUktrsoy3OIDp1.zPl7UotJnDTGnbuHlktFAiyuwO', '2026-03-04 19:13:34', NULL, 'user'),
(4, 'Vishnu', 'vishnu@gmail.com', NULL, '$2b$10$HD07APxL8T8GfhH0g/IajO1yvelxDq1fUcBhb5hsvIaP/DMs5ZpWK', '2026-03-05 17:48:37', NULL, 'user'),
(5, 'Super Admin', 'admin@voxday.com', NULL, '$2b$10$cd9tdKeHy/mEoLAU1X7OxuLOVX30u09GrcLWZlvQvsSmtz662wvvu', '2026-03-06 18:26:56', '2026-03-08 07:04:34', 'admin');

