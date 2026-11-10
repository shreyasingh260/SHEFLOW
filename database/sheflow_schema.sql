-- ========================================================
-- SheFlow MySQL Database Schema
-- Database: sheflow_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS sheflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sheflow_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  date_of_birth DATE NULL,
  cycle_length_days INT DEFAULT 28,
  period_length_days INT DEFAULT 5,
  last_period_start DATE NULL,
  regularity VARCHAR(20) DEFAULT 'REGULAR',
  on_birth_control BOOLEAN DEFAULT FALSE,
  water_goal_glasses INT DEFAULT 8,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- 2. Period Logs Table (Feeds Weighted Cycle Algorithm)
CREATE TABLE IF NOT EXISTS period_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  flow_intensity VARCHAR(20) DEFAULT 'MEDIUM',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_period_user_date (user_id, start_date)
) ENGINE=InnoDB;

-- 3. Cycle Predictions Table
CREATE TABLE IF NOT EXISTS cycle_predictions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  predicted_cycle_length INT NOT NULL,
  next_period_date DATE NOT NULL,
  ovulation_date DATE NOT NULL,
  fertile_window_start DATE NOT NULL,
  fertile_window_end DATE NOT NULL,
  is_irregular BOOLEAN DEFAULT FALSE,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Water Logs Table
CREATE TABLE IF NOT EXISTS water_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  log_date DATE NOT NULL,
  glasses_consumed INT DEFAULT 0,
  glasses_goal INT DEFAULT 8,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_water_date (user_id, log_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Symptom Logs Table
CREATE TABLE IF NOT EXISTS symptom_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  log_date DATE NOT NULL,
  symptoms_json TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'MILD',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Mood Logs Table
CREATE TABLE IF NOT EXISTS mood_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  log_date DATE NOT NULL,
  moods_json TEXT NOT NULL,
  intensity INT DEFAULT 3,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Medications Table
CREATE TABLE IF NOT EXISTS medications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  dosage VARCHAR(100) NULL,
  frequency VARCHAR(100) NULL,
  reminder_time VARCHAR(20) NULL,
  taken_today BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Flora Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  sender VARCHAR(20) NOT NULL, -- 'USER' or 'FLORA'
  content TEXT NOT NULL,
  timestamp VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  relationship VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Products & Price Comparison Table
CREATE TABLE IF NOT EXISTS products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'PADS', 'TAMPONS', 'MENSTRUAL_CUPS', 'PAIN_RELIEF'
  description TEXT NULL,
  image_url VARCHAR(500) NULL,
  rating DECIMAL(2,1) DEFAULT 4.8,
  platforms_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. Washroom Facilities Table
CREATE TABLE IF NOT EXISTS washroom_facilities (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  facility_type VARCHAR(50) NOT NULL, -- 'VENDING_MACHINE', 'PUBLIC_TOILET', 'CAFE'
  address VARCHAR(255) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  wheelchair_accessible BOOLEAN DEFAULT FALSE,
  opening_hours VARCHAR(100) DEFAULT '24 hrs',
  rating DECIMAL(2,1) DEFAULT 4.7,
  has_sanitary_pads BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
