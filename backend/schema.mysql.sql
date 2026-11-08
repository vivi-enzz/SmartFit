-- MySQL 8+ migration reference ONLY. The running demo uses node:sqlite.
-- This file does not install a MySQL adapter or migrate existing SQLite data.
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY, name VARCHAR(40) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
  password VARCHAR(100), demo BOOLEAN NOT NULL DEFAULT FALSE, created DATETIME(3) NOT NULL
);
CREATE TABLE sessions (
  token CHAR(64) PRIMARY KEY, user_id CHAR(36) NOT NULL, expires BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE metrics (
  user_id CHAR(36) PRIMARY KEY, encrypted TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE designs (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, name VARCHAR(60) NOT NULL,
  config JSON NOT NULL, price INT UNSIGNED NOT NULL, version INT NOT NULL DEFAULT 1, created DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE orders (
  id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, design_id CHAR(36), snapshot JSON NOT NULL,
  amount INT UNSIGNED NOT NULL, address JSON NOT NULL,
  status ENUM('pending_payment','paid','in_production','shipped','delivered','cancelled') NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL, created DATETIME(3) NOT NULL,
  UNIQUE KEY order_once (user_id,idempotency_key), FOREIGN KEY (user_id) REFERENCES users(id)
  -- No FK on design_id: deleting a draft must preserve the immutable snapshot.
);
CREATE TABLE payment_events (
  id VARCHAR(120) PRIMARY KEY, order_id CHAR(36) NOT NULL, outcome ENUM('success','failed') NOT NULL,
  created DATETIME(3) NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE TABLE history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, order_id CHAR(36) NOT NULL, status VARCHAR(30) NOT NULL,
  note TEXT, created DATETIME(3) NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE TABLE tracking (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, order_id CHAR(36) NOT NULL, status VARCHAR(100),
  location VARCHAR(200), created DATETIME(3), FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE TABLE posts (
  id VARCHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, caption TEXT NOT NULL, category VARCHAR(20) NOT NULL,
  config JSON NOT NULL, image_url VARCHAR(255), created DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE likes (
  post_id VARCHAR(36) NOT NULL, user_id CHAR(36) NOT NULL, PRIMARY KEY(post_id,user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id), FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE comments (
  id CHAR(36) PRIMARY KEY, post_id VARCHAR(36) NOT NULL, user_id CHAR(36) NOT NULL,
  content VARCHAR(500) NOT NULL, created DATETIME(3) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id), FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE uploads (
  url VARCHAR(255) PRIMARY KEY, user_id CHAR(36) NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id CHAR(36) NOT NULL, order_id CHAR(36) NOT NULL,
  text TEXT NOT NULL, created DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (order_id) REFERENCES orders(id)
);
