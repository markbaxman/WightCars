-- Simple seed data for WightCars

-- Insert test users
INSERT OR IGNORE INTO users (id, email, password_hash, full_name, phone, location, is_dealer, is_verified) VALUES 
  (1, 'john.smith@wightcars.com', '$2a$10$rOOjbqNe9XjEd9se3DKtqOqKBk8Dk4v8xJGjhPmLWj0D9fX7.S0/G', 'John Smith', '01983 123456', 'Newport, Isle of Wight', 0, 1),
  (2, 'sarah.jones@dealer.com', '$2a$10$rOOjbqNe9XjEd9se3DKtqOqKBk8Dk4v8xJGjhPmLWj0D9fX7.S0/G', 'Sarah Jones', '01983 234567', 'Cowes, Isle of Wight', 1, 1),
  (3, 'mike.wilson@email.com', '$2a$10$rOOjbqNe9XjEd9se3DKtqOqKBk8Dk4v8xJGjhPmLWj0D9fX7.S0/G', 'Mike Wilson', '01983 345678', 'Ryde, Isle of Wight', 0, 0),
  (4, 'emma.brown@wightcars.com', '$2a$10$rOOjbqNe9XjEd9se3DKtqOqKBk8Dk4v8xJGjhPmLWj0D9fX7.S0/G', 'Emma Brown', '01983 456789', 'Sandown, Isle of Wight', 0, 1);

-- Insert test car listings
INSERT OR IGNORE INTO cars (
  id, user_id, title, description, make, model, year, mileage, fuel_type, 
  transmission, body_type, engine_size, doors, color, price, location, 
  mot_expiry, service_history, features, condition_notes, featured_image, status
) VALUES 
  (1, 1, '2020 Ford Fiesta ST-Line - Low Mileage!',
   'Excellent condition Ford Fiesta with full service history. Perfect for Island driving with great fuel economy.',
   'Ford', 'Fiesta', 2020, 28500, 'petrol', 'manual', 'hatchback', '1.0L', 5, 'Magnetic Grey',
   12995000, 'Newport, Isle of Wight', '2025-07-15', 1,
   '["Air Conditioning", "Bluetooth", "DAB Radio", "Cruise Control", "Alloy Wheels"]',
   'Excellent condition throughout. Minor stone chips on front bumper.',
   '/static/images/cars/ford-fiesta-1.jpg', 'active'),
   
  (2, 2, '2018 BMW 320d M Sport - Isle of Wight Delivery Available',
   'Stunning BMW 320d in Alpine White. Dealer maintained with comprehensive warranty.',
   'BMW', '3 Series', 2018, 45000, 'diesel', 'automatic', 'saloon', '2.0L', 4, 'Alpine White',
   18950000, 'Cowes, Isle of Wight', '2025-03-22', 1,
   '["Leather Seats", "Navigation", "Heated Seats", "Parking Sensors", "LED Headlights"]',
   'Immaculate condition. Professional valet included.',
   '/static/images/cars/bmw-320d-1.jpg', 'active'),
   
  (3, 1, '2019 Honda Civic Type R - Track Ready!',
   'Championship White Type R in exceptional condition. Perfect for track days.',
   'Honda', 'Civic Type R', 2019, 15200, 'petrol', 'manual', 'hatchback', '2.0L', 5, 'Championship White',
   32500000, 'Newport, Isle of Wight', '2025-11-08', 1,
   '["VTEC Turbo", "Brembo Brakes", "Recaro Seats", "Track Mode", "Rev Matching"]',
   'Excellent condition. Some track use but well maintained.',
   '/static/images/cars/honda-civic-type-r-1.jpg', 'active'),
   
  (4, 3, '2017 Volkswagen Golf GTI - Island Owned',
   'Local Island owned Golf GTI with excellent service history. Tornado Red with tartan interior.',
   'Volkswagen', 'Golf', 2017, 52000, 'petrol', 'manual', 'hatchback', '2.0L', 5, 'Tornado Red',
   16750000, 'Ryde, Isle of Wight', '2025-09-14', 1,
   '["GTI Interior", "Sports Suspension", "18 Alloys", "Touchscreen"]',
   'Good condition. Minor wear on drivers seat bolster.',
   '/static/images/cars/vw-golf-gti-1.jpg', 'active'),
   
  (5, 2, '2021 Tesla Model 3 - Perfect for Island Life',
   'Nearly new Tesla Model 3 with Autopilot. Ideal for Island commuting with home charging setup.',
   'Tesla', 'Model 3', 2021, 12000, 'electric', 'automatic', 'saloon', 'Electric', 4, 'Pearl White',
   38500000, 'Cowes, Isle of Wight', NULL, 1,
   '["Autopilot", "Supercharging", "Premium Audio", "Glass Roof", "Over-the-Air Updates"]',
   'As new condition. Includes home charging cable.',
   '/static/images/cars/tesla-model-3-1.jpg', 'active'),
   
  (6, 4, '2022 Kia Sportage GT-Line S - Hybrid Efficiency',
   'Nearly new Kia Sportage with hybrid technology. Perfect family SUV with excellent fuel economy.',
   'Kia', 'Sportage', 2022, 8500, 'hybrid', 'automatic', 'suv', '1.6L', 5, 'Platinum Graphite',
   28995000, 'Sandown, Isle of Wight', '2026-03-15', 1,
   '["Hybrid Technology", "Panoramic Sunroof", "Wireless Charging", "Lane Keep Assist"]',
   'As new condition. Manufacturer warranty until 2029.',
   '/static/images/cars/kia-sportage-1.jpg', 'active');