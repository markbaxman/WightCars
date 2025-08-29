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

// Popular car makes and models for Isle of Wight market
export const POPULAR_CAR_MAKES: CarMake[] = [
  {
    name: 'Ford',
    models: ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Puma', 'EcoSport', 'Mustang']
  },
  {
    name: 'Vauxhall',
    models: ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland']
  },
  {
    name: 'BMW',
    models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', 'X1', 'X3', 'X5']
  },
  {
    name: 'Volkswagen',
    models: ['Polo', 'Golf', 'Passat', 'Tiguan', 'T-Roc', 'Arteon']
  },
  {
    name: 'Audi',
    models: ['A1', 'A3', 'A4', 'A6', 'Q2', 'Q3', 'Q5', 'TT']
  },
  {
    name: 'Mercedes-Benz',
    models: ['A-Class', 'C-Class', 'E-Class', 'CLA', 'GLA', 'GLC', 'GLE']
  },
  {
    name: 'Honda',
    models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz']
  },
  {
    name: 'Toyota',
    models: ['Yaris', 'Corolla', 'Camry', 'RAV4', 'C-HR', 'Prius']
  },
  {
    name: 'Nissan',
    models: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf']
  },
  {
    name: 'Mini',
    models: ['Cooper', 'Countryman', 'Clubman', 'Convertible']
  },
  {
    name: 'Tesla',
    models: ['Model 3', 'Model Y', 'Model S', 'Model X']
  },
  {
    name: 'Peugeot',
    models: ['208', '308', '508', '2008', '3008', '5008']
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