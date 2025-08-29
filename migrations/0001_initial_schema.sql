-- WightCars Database Schema
-- Initial migration for Isle of Wight car classified ads website

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  is_dealer INTEGER DEFAULT 0, -- 0 for private seller, 1 for dealer
  is_verified INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Car listings table
CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Car details
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER,
  fuel_type TEXT, -- 'petrol', 'diesel', 'electric', 'hybrid'
  transmission TEXT, -- 'manual', 'automatic'
  body_type TEXT, -- 'hatchback', 'saloon', 'estate', 'suv', etc.
  engine_size TEXT,
  doors INTEGER,
  color TEXT,
  
  -- Pricing and availability
  price INTEGER NOT NULL, -- Price in pence
  is_negotiable INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'withdrawn'
  
  -- Location
  location TEXT NOT NULL,
  postcode TEXT,
  
  -- MOT and service history
  mot_expiry DATE,
  service_history INTEGER DEFAULT 0, -- 0 = unknown, 1 = full, 2 = partial
  
  -- Features and condition
  features TEXT, -- JSON string of features array
  condition_notes TEXT,
  
  -- Images
  images TEXT, -- JSON string of image URLs array
  featured_image TEXT,
  
  -- Metadata
  views INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table for buyer-seller communication
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  car_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved cars table (favorites/watchlist)
CREATE TABLE IF NOT EXISTS saved_cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  car_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  
  UNIQUE(user_id, car_id) -- Prevent duplicate saves
);

-- Search filters/alerts table
CREATE TABLE IF NOT EXISTS search_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  filters TEXT NOT NULL, -- JSON string of search criteria
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_make_model ON cars(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_location ON cars(location);
CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON cars(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_car_id ON messages(car_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_saved_cars_user_id ON saved_cars(user_id);
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id ON search_alerts(user_id);