-- Admin features migration for WightCars
-- Adds admin roles, user moderation, and content management

-- Add admin role and status fields to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN suspension_reason TEXT;
ALTER TABLE users ADD COLUMN suspended_at DATETIME;
ALTER TABLE users ADD COLUMN suspended_by INTEGER;
ALTER TABLE users ADD COLUMN verification_notes TEXT;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;

-- Add moderation fields to cars table
ALTER TABLE cars ADD COLUMN moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));
ALTER TABLE cars ADD COLUMN moderated_by INTEGER;
ALTER TABLE cars ADD COLUMN moderated_at DATETIME;
ALTER TABLE cars ADD COLUMN moderation_notes TEXT;
ALTER TABLE cars ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE cars ADD COLUMN flag_reason TEXT;
ALTER TABLE cars ADD COLUMN flagged_by INTEGER;
ALTER TABLE cars ADD COLUMN flagged_at DATETIME;

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'user', 'car', 'message', 'system'
  target_id INTEGER,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Create site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text', -- 'text', 'number', 'boolean', 'json'
  description TEXT,
  updated_by INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create user reports table
CREATE TABLE IF NOT EXISTS user_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL,
  reported_user_id INTEGER,
  reported_car_id INTEGER,
  report_type TEXT NOT NULL, -- 'spam', 'inappropriate', 'fraud', 'other'
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  assigned_to INTEGER,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (reported_user_id) REFERENCES users(id),
  FOREIGN KEY (reported_car_id) REFERENCES cars(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Create system statistics table for caching analytics
CREATE TABLE IF NOT EXISTS system_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date DATE UNIQUE NOT NULL,
  total_users INTEGER DEFAULT 0,
  new_users_today INTEGER DEFAULT 0,
  total_cars INTEGER DEFAULT 0,
  new_cars_today INTEGER DEFAULT 0,
  active_cars INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  new_messages_today INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default site settings
INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'WightCars', 'text', 'Name of the website'),
('site_description', 'Isle of Wight Car Marketplace', 'text', 'Site description for SEO'),
('max_images_per_car', '8', 'number', 'Maximum number of images per car listing'),
('max_image_size_mb', '5', 'number', 'Maximum image size in MB'),
('auto_approve_listings', 'false', 'boolean', 'Automatically approve new car listings'),
('require_verification_to_sell', 'false', 'boolean', 'Require user verification before posting cars'),
('enable_user_registration', 'true', 'boolean', 'Allow new user registration'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('featured_cars_count', '6', 'number', 'Number of featured cars on homepage'),
('contact_email', 'admin@wightcars.com', 'text', 'Contact email for site inquiries');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_cars_moderation_status ON cars(moderation_status);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_suspended ON users(is_suspended);
CREATE INDEX IF NOT EXISTS idx_system_stats_date ON system_stats(stat_date);

-- Create a default admin user (update existing user)
UPDATE users SET is_admin = TRUE WHERE email = 'john.smith@wightcars.com';

-- Insert today's initial stats
INSERT OR IGNORE INTO system_stats (
  stat_date,
  total_users,
  total_cars,
  active_cars,
  total_messages
) SELECT 
  DATE('now') as stat_date,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM cars) as total_cars,
  (SELECT COUNT(*) FROM cars WHERE status = 'active') as active_cars,
  (SELECT COUNT(*) FROM messages) as total_messages;