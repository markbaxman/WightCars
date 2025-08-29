// WightCars TypeScript Type Definitions
// Complete type definitions for Isle of Wight car marketplace

// Cloudflare bindings
export interface CloudflareBindings {
  DB: D1Database;
  ENVIRONMENT: string;
  JWT_SECRET?: string;
}

// Base interface for common fields
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at?: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  full_name: string;
  phone?: string;
  location?: string;
  is_dealer: boolean;
  is_verified: boolean;
  avatar_url?: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  location?: string;
  is_dealer?: boolean;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserProfile extends Omit<User, 'id' | 'created_at'> {
  // Public profile fields only
}

// Car listing types
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'other';
export type TransmissionType = 'manual' | 'automatic' | 'cvt';
export type BodyType = 'hatchback' | 'saloon' | 'estate' | 'suv' | 'coupe' | 'convertible' | 'mpv' | 'van' | 'other';
export type CarStatus = 'active' | 'sold' | 'withdrawn' | 'pending';
export type ServiceHistory = 'unknown' | 'full' | 'partial';

export interface Car extends BaseEntity {
  user_id: number;
  title: string;
  description?: string;
  
  // Car specifications
  make: string;
  model: string;
  year: number;
  mileage?: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  body_type: BodyType;
  engine_size?: string;
  doors?: number;
  color?: string;
  
  // Pricing and availability
  price: number; // Price in pence
  is_negotiable: boolean;
  status: CarStatus;
  
  // Location
  location: string;
  postcode?: string;
  
  // MOT and service
  mot_expiry?: string; // ISO date string
  service_history: ServiceHistory;
  
  // Additional details
  features?: string[]; // Parsed from JSON
  condition_notes?: string;
  
  // Images
  images?: string[]; // Parsed from JSON
  featured_image?: string;
  
  // Metadata
  views: number;
  is_featured: boolean;
  
  // Joined fields (when fetched with user info)
  seller?: UserProfile;
}

export interface CarCreate {
  title: string;
  description?: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  body_type: BodyType;
  engine_size?: string;
  doors?: number;
  color?: string;
  price: number;
  is_negotiable?: boolean;
  location: string;
  postcode?: string;
  mot_expiry?: string;
  service_history?: ServiceHistory;
  features?: string[];
  condition_notes?: string;
  images?: string[];
  featured_image?: string;
}

export interface CarUpdate extends Partial<CarCreate> {
  status?: CarStatus;
}

export interface CarFilters {
  make?: string;
  model?: string;
  min_year?: number;
  max_year?: number;
  min_price?: number;
  max_price?: number;
  fuel_type?: FuelType;
  transmission?: TransmissionType;
  body_type?: BodyType;
  location?: string;
  min_mileage?: number;
  max_mileage?: number;
  search?: string; // General search term
  is_dealer?: boolean;
  status?: CarStatus;
  sort_by?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'mileage_asc' | 'mileage_desc' | 'created_desc' | 'created_asc';
  page?: number;
  limit?: number;
}

// Message types
export interface Message extends BaseEntity {
  car_id: number;
  sender_id: number;
  recipient_id: number;
  subject?: string;
  message: string;
  is_read: boolean;
  
  // Joined fields
  car?: Pick<Car, 'id' | 'title' | 'make' | 'model' | 'year' | 'featured_image'>;
  sender?: Pick<User, 'id' | 'full_name' | 'email'>;
  recipient?: Pick<User, 'id' | 'full_name' | 'email'>;
}

export interface MessageCreate {
  car_id: number;
  recipient_id: number;
  subject?: string;
  message: string;
}

// Saved cars (favorites/watchlist)
export interface SavedCar extends BaseEntity {
  user_id: number;
  car_id: number;
  car?: Car;
}

// Search alerts
export interface SearchAlert extends BaseEntity {
  user_id: number;
  name: string;
  filters: CarFilters;
  is_active: boolean;
}

export interface SearchAlertCreate {
  name: string;
  filters: CarFilters;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Authentication types
export interface AuthResponse extends ApiResponse {
  data?: {
    user: User;
    token: string;
  };
}

export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

// Common dropdown options
export interface SelectOption {
  value: string;
  label: string;
}

// Car make/model data
export interface CarMake {
  name: string;
  models: string[];
}

// Statistics and analytics
export interface DashboardStats {
  total_cars: number;
  active_cars: number;
  sold_cars: number;
  total_views: number;
  messages_count: number;
  saved_cars_count: number;
}

export interface CarStats {
  views_this_week: number;
  messages_count: number;
  saved_count: number;
  similar_cars_count: number;
}

// Location data for Isle of Wight
export const ISLE_OF_WIGHT_LOCATIONS = [
  'Newport',
  'Cowes',
  'East Cowes', 
  'Ryde',
  'Sandown',
  'Shanklin',
  'Ventnor',
  'Freshwater',
  'Yarmouth',
  'Bembridge',
  'Brading',
  'Godshill',
  'Brighstone',
  'Arreton',
  'Wootton Bridge',
  'Lake',
  'Niton',
  'Seaview',
  'St Helens',
  'Totland'
] as const;

export type IsleOfWightLocation = typeof ISLE_OF_WIGHT_LOCATIONS[number];

// Comprehensive UK car makes and models database (2024)
// Based on current market research and best-selling models
export const POPULAR_CAR_MAKES: CarMake[] = [
  {
    name: 'Audi',
    models: ['A1', 'A3', 'A4', 'A4 Allroad', 'A5', 'A6', 'A6 Allroad', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'TT', 'TTS', 'TT RS', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'e-tron GT', 'R8']
  },
  {
    name: 'BMW',
    models: ['1 Series', '2 Series Gran Coupe', '2 Series Active Tourer', '3 Series', '3 Series Touring', '4 Series', '4 Series Gran Coupe', '5 Series', '5 Series Touring', '6 Series GT', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'iX1', 'iX3', 'iX', 'i4', 'i5', 'i7', 'M2', 'M3', 'M4', 'M5', 'X3 M', 'X4 M', 'X5 M', 'X6 M', 'Z4']
  },
  {
    name: 'Mercedes-Benz',
    models: ['A-Class', 'B-Class', 'C-Class', 'C-Class Estate', 'CLA', 'CLA Shooting Brake', 'E-Class', 'E-Class Estate', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLC Coupe', 'GLE', 'GLE Coupe', 'GLS', 'G-Class', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'AMG GT', 'SL', 'CLE']
  },
  {
    name: 'Ford',
    models: ['Ka+', 'Fiesta', 'Focus', 'Focus Estate', 'Mondeo', 'Mondeo Estate', 'S-MAX', 'Galaxy', 'Puma', 'Kuga', 'Explorer', 'Mustang', 'Mustang Mach-E', 'Tourneo Connect', 'Tourneo Courier', 'Transit Connect', 'Transit Custom', 'Transit']
  },
  {
    name: 'Volkswagen',
    models: ['up!', 'Polo', 'Golf', 'Golf Estate', 'Golf GTI', 'Golf R', 'Jetta', 'Passat', 'Passat Estate', 'Arteon', 'T-Cross', 'T-Roc', 'Tiguan', 'Tiguan Allspace', 'Touareg', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID. Buzz', 'Touran', 'Sharan', 'Caddy', 'Transporter']
  },
  {
    name: 'Toyota',
    models: ['Aygo X', 'Yaris', 'Yaris Cross', 'Corolla', 'Corolla Touring Sports', 'Camry', 'Prius', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Proace City', 'Proace', 'Proace Max', 'GR Yaris', 'GR Supra', 'GR86', 'bZ4X', 'Mirai']
  },
  {
    name: 'Nissan',
    models: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Pathfinder', 'Leaf', 'Ariya', 'GT-R', 'Z', '370Z', 'Navara', 'NV200', 'NV300', 'NV400', 'e-NV200', 'Townstar']
  },
  {
    name: 'Honda',
    models: ['Jazz', 'Civic', 'Civic Type R', 'Accord', 'HR-V', 'CR-V', 'Pilot', 'e', 'NSX']
  },
  {
    name: 'Hyundai',
    models: ['i10', 'i20', 'i20 N', 'i30', 'i30 N', 'i30 Fastback N', 'i40', 'Bayon', 'Kona', 'Kona N', 'Tucson', 'Santa Fe', 'Nexo', 'IONIQ 5', 'IONIQ 6', 'Genesis GV70', 'Genesis G90']
  },
  {
    name: 'Kia',
    models: ['Picanto', 'Rio', 'Stonic', 'Xceed', 'Ceed', 'Ceed SW', 'ProCeed', 'Sportage', 'Sorento', 'Niro', 'EV6', 'EV9', 'Stinger']
  },
  {
    name: 'Peugeot',
    models: ['108', '208', '208 GTI', '308', '308 SW', '308 GTI', '408', '508', '508 SW', '2008', '3008', '5008', 'Rifter', 'Partner', 'Expert', 'Boxer', 'e-208', 'e-2008', 'e-308', 'e-Rifter', 'e-Partner', 'e-Expert']
  },
  {
    name: 'Renault',
    models: ['Twingo', 'Clio', 'Captur', 'Arkana', 'Megane', 'Megane E-TECH', 'Scenic E-TECH', 'Austral', 'Koleos', 'Espace', 'Kangoo', 'Trafic', 'Master', 'ZOE', 'Twizy']
  },
  {
    name: 'Vauxhall',
    models: ['Corsa', 'Corsa-e', 'Astra', 'Astra Sports Tourer', 'Insignia', 'Insignia Sports Tourer', 'Crossland', 'Mokka', 'Mokka-e', 'Grandland', 'Combo Life', 'Combo Cargo', 'Vivaro', 'Movano']
  },
  {
    name: 'Citroen',
    models: ['C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'SpaceTourer', 'Dispatch', 'Relay', 'e-C4', 'e-SpaceTourer', 'e-Berlingo', 'e-Dispatch']
  },
  {
    name: 'Skoda',
    models: ['Citigo', 'Fabia', 'Scala', 'Octavia', 'Octavia Estate', 'Superb', 'Superb Estate', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Enyaq Coupe', 'Roomster', 'Yeti']
  },
  {
    name: 'SEAT',
    models: ['Mii', 'Ibiza', 'Arona', 'Leon', 'Leon Estate', 'Ateca', 'Tarraco', 'Formentor', 'Leon Cupra', 'Ateca Cupra', 'Formentor Cupra']
  },
  {
    name: 'Mazda',
    models: ['MX-30', 'Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5']
  },
  {
    name: 'Mitsubishi',
    models: ['Mirage', 'ASX', 'Eclipse Cross', 'Outlander', 'Outlander PHEV', 'L200']
  },
  {
    name: 'Subaru',
    models: ['Impreza', 'XV', 'Forester', 'Outback', 'Levorg', 'WRX', 'BRZ']
  },
  {
    name: 'Suzuki',
    models: ['Celerio', 'Swift', 'Swift Sport', 'Baleno', 'Ignis', 'S-Cross', 'Vitara', 'SX4 S-Cross', 'Jimny']
  },
  {
    name: 'Mini',
    models: ['Cooper 3-Door', 'Cooper 5-Door', 'Cooper Convertible', 'Clubman', 'Countryman', 'Electric Cooper', 'John Cooper Works']
  },
  {
    name: 'Jaguar',
    models: ['XE', 'XF', 'XJ', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace']
  },
  {
    name: 'Land Rover',
    models: ['Defender', 'Discovery Sport', 'Discovery', 'Range Rover Evoque', 'Range Rover Velar', 'Range Rover Sport', 'Range Rover']
  },
  {
    name: 'Volvo',
    models: ['V40', 'V60', 'V90', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40 Recharge', 'EX30', 'EX90']
  },
  {
    name: 'Tesla',
    models: ['Model 3', 'Model Y', 'Model S', 'Model X']
  },
  {
    name: 'Lexus',
    models: ['CT', 'IS', 'ES', 'GS', 'LS', 'LC', 'UX', 'NX', 'RX', 'GX', 'LX', 'RC', 'LFA']
  },
  {
    name: 'Infiniti',
    models: ['Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX60', 'QX70', 'QX80']
  },
  {
    name: 'Alfa Romeo',
    models: ['MiTo', 'Giulietta', 'Giulia', 'Stelvio', '4C', 'Tonale']
  },
  {
    name: 'Fiat',
    models: ['500', '500C', '500X', '500L', 'Panda', 'Tipo', '600', 'Doblo', 'Ducato', '500e']
  },
  {
    name: 'Jeep',
    models: ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator', 'Avenger']
  },
  {
    name: 'Dacia',
    models: ['Sandero', 'Sandero Stepway', 'Duster', 'Jogger', 'Spring']
  },
  {
    name: 'MG',
    models: ['MG3', 'MG4', 'HS', 'ZS', 'ZS EV', 'Marvel R', 'EHS']
  },
  {
    name: 'Genesis',
    models: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80']
  },
  {
    name: 'Cupra',
    models: ['Ateca', 'Formentor', 'Leon', 'Born', 'Tavascan']
  },
  {
    name: 'DS',
    models: ['DS 3', 'DS 4', 'DS 7', 'DS 9']
  },
  {
    name: 'Smart',
    models: ['ForTwo', 'ForFour', '#1', '#3']
  },
  {
    name: 'Porsche',
    models: ['911', 'Boxster', 'Cayman', 'Panamera', 'Cayenne', 'Macan', 'Taycan']
  },
  {
    name: 'Maserati',
    models: ['Ghibli', 'Quattroporte', 'Levante', 'MC20', 'Grecale']
  },
  {
    name: 'Ferrari',
    models: ['F8', 'Roma', 'Portofino', 'SF90', '812', 'Purosangue']
  },
  {
    name: 'Lamborghini',
    models: ['Huracan', 'Aventador', 'Urus', 'Revuelto']
  },
  {
    name: 'Bentley',
    models: ['Continental GT', 'Continental GTC', 'Flying Spur', 'Bentayga']
  },
  {
    name: 'Rolls-Royce',
    models: ['Ghost', 'Phantom', 'Wraith', 'Dawn', 'Cullinan', 'Spectre']
  },
  {
    name: 'Aston Martin',
    models: ['Vantage', 'DB11', 'DBS', 'DBX', 'Valkyrie']
  },
  {
    name: 'McLaren',
    models: ['GT', '720S', '750S', 'Artura', '765LT']
  },
  {
    name: 'Lotus',
    models: ['Elise', 'Exige', 'Evora', 'Emira', 'Evija']
  },
  {
    name: 'Morgan',
    models: ['3 Wheeler', 'Plus Four', 'Plus Six', 'Aero 8']
  },
  {
    name: 'Caterham',
    models: ['Seven 160', 'Seven 270', 'Seven 360', 'Seven 420', 'Seven 620']
  }
];

export const FUEL_TYPES: SelectOption[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'other', label: 'Other' }
];

export const TRANSMISSION_TYPES: SelectOption[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'cvt', label: 'CVT' }
];

export const BODY_TYPES: SelectOption[] = [
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'saloon', label: 'Saloon' },
  { value: 'estate', label: 'Estate' },
  { value: 'suv', label: 'SUV' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'convertible', label: 'Convertible' },
  { value: 'mpv', label: 'MPV' },
  { value: 'van', label: 'Van' },
  { value: 'other', label: 'Other' }
];