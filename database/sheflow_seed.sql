-- ========================================================
-- SheFlow MySQL Database Seed Data
-- ========================================================

USE sheflow_db;

-- 1. Demo User (Password: Sheflow@123)
-- BCrypt for 'Sheflow@123': $2a$10$wE9aP.yBqF6pD4Jz6aBqDeHkUuM5T4aO/eS2U7cI3mBv1o6l1dJ0K
INSERT INTO users (id, full_name, email, password, date_of_birth, cycle_length_days, period_length_days, last_period_start, regularity, on_birth_control, water_goal_glasses)
VALUES (
  1, 
  'Shreya Singh', 
  'shreya@example.com', 
  '$2a$10$wE9aP.yBqF6pD4Jz6aBqDeHkUuM5T4aO/eS2U7cI3mBv1o6l1dJ0K', 
  '2001-07-15', 
  28, 
  5, 
  '2026-06-18', 
  'REGULAR', 
  FALSE, 
  8
) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 2. Period Logs
INSERT INTO period_logs (user_id, start_date, end_date, flow_intensity, notes)
VALUES
(1, '2026-03-24', '2026-03-29', 'MEDIUM', 'Normal cycle'),
(1, '2026-04-21', '2026-04-26', 'MEDIUM', 'Mild cramping on day 1'),
(1, '2026-05-20', '2026-05-24', 'LIGHT', 'Normal cycle'),
(1, '2026-06-18', '2026-06-23', 'MEDIUM', 'Most recent period');

-- 3. Cycle Prediction
INSERT INTO cycle_predictions (user_id, predicted_cycle_length, next_period_date, ovulation_date, fertile_window_start, fertile_window_end, is_irregular)
VALUES (
  1, 
  28, 
  '2026-07-16', 
  '2026-07-02', 
  '2026-06-28', 
  '2026-07-03', 
  FALSE
);

-- 4. Today's Water Log (5 of 8 Glasses on July 1)
INSERT INTO water_logs (user_id, log_date, glasses_consumed, glasses_goal)
VALUES (1, '2026-07-01', 5, 8)
ON DUPLICATE KEY UPDATE glasses_consumed = 5;

-- 5. Products Price Comparison
INSERT INTO products (name, category, description, image_url, rating, platforms_json)
VALUES
(
  'Nua Ultra Thin Organic Cotton Pads', 
  'PADS', 
  'Chemical-free, zero perfume, personalized absorbency pack of 12.', 
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', 
  4.8, 
  '[{"platformName": "Blinkit", "price": 289, "currency": "INR", "deliveryTime": "10 mins", "bestPrice": true}, {"platformName": "Amazon", "price": 310, "currency": "INR", "deliveryTime": "Tomorrow"}, {"platformName": "Nykaa", "price": 320, "currency": "INR", "deliveryTime": "2 days"}]'
),
(
  'Sirona FDA Approved Menstrual Cup', 
  'MENSTRUAL_CUPS', 
  '100% Medical Grade Silicone, up to 10 hours protection & leak-free.', 
  'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&q=80', 
  4.9, 
  '[{"platformName": "Amazon", "price": 299, "currency": "INR", "deliveryTime": "Tomorrow", "bestPrice": true}, {"platformName": "Flipkart", "price": 349, "currency": "INR", "deliveryTime": "3 days"}, {"platformName": "Nykaa", "price": 360, "currency": "INR", "deliveryTime": "2 days"}]'
),
(
  'Pee Safe Organic Tampons Regular', 
  'TAMPONS', 
  '100% Organic cotton, biodegradable, applicator-free pack of 16.', 
  'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80', 
  4.7, 
  '[{"platformName": "Blinkit", "price": 315, "currency": "INR", "deliveryTime": "12 mins", "bestPrice": true}, {"platformName": "Amazon", "price": 330, "currency": "INR", "deliveryTime": "Tomorrow"}, {"platformName": "Flipkart", "price": 350, "currency": "INR", "deliveryTime": "2 days"}]'
),
(
  'Meftal-Spas Pain Relief Roll-On & Patches', 
  'PAIN_RELIEF', 
  'Herbal cooling relief patches for period cramp management.', 
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&q=80', 
  4.9, 
  '[{"platformName": "Apollo 24|7", "price": 199, "currency": "INR", "deliveryTime": "15 mins", "bestPrice": true}, {"platformName": "Blinkit", "price": 219, "currency": "INR", "deliveryTime": "10 mins"}, {"platformName": "Amazon", "price": 240, "currency": "INR", "deliveryTime": "Tomorrow"}]'
);

-- 6. Washrooms & Pad Dispensers
INSERT INTO washroom_facilities (name, facility_type, address, latitude, longitude, wheelchair_accessible, opening_hours, rating, has_sanitary_pads)
VALUES
('City Hospital Pad Dispenser & Restroom', 'VENDING_MACHINE', 'Ground Floor, City Hospital, Wing B', 28.6139, 77.2090, TRUE, 'Open 24 Hours', 4.9, TRUE),
('Central Metro Clean Restroom', 'PUBLIC_TOILET', 'Gate 2, Concourse Level, Central Metro', 28.6145, 77.2100, TRUE, '5:30 AM - 11:30 PM', 4.6, TRUE),
('Bloom Organic Cafe Restroom', 'CAFE', '42 Orchid Lane, Market Complex', 28.6152, 77.2115, FALSE, '8:00 AM - 11:00 PM', 4.8, FALSE);

-- 7. Flora Chat Conversation Seed
INSERT INTO chat_messages (user_id, sender, content, timestamp)
VALUES
(1, 'FLORA', 'Hi Shreya! 🌸\nHow are you feeling today?', '10:30 AM'),
(1, 'USER', 'I have mild cramps and feeling a bit tired.', '10:31 AM'),
(1, 'FLORA', 'I\'m sorry to hear that. Mild cramps and tiredness are common during the ovulation phase.\n\nMake sure you stay hydrated, eat balanced meals, and get enough rest. If the pain increases, let me know.', '10:31 AM');
