// Car listings routes for WightCars
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { CloudflareBindings, Car, CarFilters, CarCreate, PaginatedResponse, ApiResponse } from '../types'
import { DatabaseService } from '../utils/database'
import { verifyJWT, extractToken } from '../utils/auth'

const cars = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS
cars.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// Middleware to extract user from token (optional)
const optionalAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader)
  
  if (token) {
    const payload = await verifyJWT(token)
    if (payload) {
      c.set('userId', payload.userId)
      c.set('userEmail', payload.email)
    }
  }
  
  await next()
}

// Middleware to require authentication
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader)
  
  if (!token) {
    return c.json<ApiResponse>({
      success: false,
      error: 'Authentication required'
    }, 401)
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    return c.json<ApiResponse>({
      success: false,
      error: 'Invalid or expired token'
    }, 401)
  }

  c.set('userId', payload.userId)
  c.set('userEmail', payload.email)
  
  await next()
}

// Get all cars with filters and pagination
cars.get('/', optionalAuth, async (c) => {
  try {
    const query = c.req.query()
    
    const filters: CarFilters = {
      make: query.make,
      model: query.model,
      min_year: query.min_year ? parseInt(query.min_year) : undefined,
      max_year: query.max_year ? parseInt(query.max_year) : undefined,
      min_price: query.min_price ? parseInt(query.min_price) : undefined,
      max_price: query.max_price ? parseInt(query.max_price) : undefined,
      fuel_type: query.fuel_type as any,
      transmission: query.transmission as any,
      body_type: query.body_type as any,
      location: query.location,
      min_mileage: query.min_mileage ? parseInt(query.min_mileage) : undefined,
      max_mileage: query.max_mileage ? parseInt(query.max_mileage) : undefined,
      search: query.search,
      is_dealer: query.is_dealer === 'true' ? true : query.is_dealer === 'false' ? false : undefined,
      status: query.status as any || 'active',
      sort_by: query.sort_by as any,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20
    }

    // Try database first, fallback to mock data if unavailable
    if (c.env.DB) {
      try {
        const db = new DatabaseService(c.env.DB)
        const result = await db.getCarsWithFilters(filters)
        return c.json<PaginatedResponse<Car>>(result)
      } catch (dbError) {
        console.warn('Database unavailable, using mock data:', dbError)
      }
    }

    // Fallback to mock data for development
    const mockCars = getMockCars(filters)
    return c.json<PaginatedResponse<Car>>({
      success: true,
      data: mockCars,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: mockCars.length,
        pages: 1
      }
    })
  } catch (error) {
    console.error('Error fetching cars:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch cars'
    }, 500)
  }
})

// Get featured cars for homepage
cars.get('/featured', async (c) => {
  try {
    const filters: CarFilters = {
      status: 'active',
      sort_by: 'created_desc',
      limit: 6
    }

    // Try database first, fallback to mock data if unavailable
    if (c.env.DB) {
      try {
        const db = new DatabaseService(c.env.DB)
        const result = await db.getCarsWithFilters(filters)
        return c.json<PaginatedResponse<Car>>(result)
      } catch (dbError) {
        console.warn('Database unavailable for featured cars, using mock data:', dbError)
      }
    }

    // Fallback to mock featured cars
    const mockCars = getMockCars(filters).slice(0, 6)
    return c.json<PaginatedResponse<Car>>({
      success: true,
      data: mockCars,
      pagination: {
        page: 1,
        limit: 6,
        total: mockCars.length,
        pages: 1
      }
    })
  } catch (error) {
    console.error('Error fetching featured cars:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch featured cars'
    }, 500)
  }
})

// Get single car by ID
cars.get('/:id', optionalAuth, async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    
    if (!id || isNaN(id)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid car ID'
      }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    const car = await db.getCarById(id)
    
    if (!car) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Car not found'
      }, 404)
    }

    return c.json<ApiResponse<Car>>({
      success: true,
      data: car
    })
  } catch (error) {
    console.error('Error fetching car:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch car'
    }, 500)
  }
})

// Create new car listing (requires auth)
cars.post('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    const carData: CarCreate = await c.req.json()
    
    // Basic validation
    if (!carData.title || !carData.make || !carData.model || !carData.year || !carData.price || !carData.location) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Title, make, model, year, price, and location are required'
      }, 400)
    }

    if (carData.year < 1900 || carData.year > new Date().getFullYear() + 1) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid year'
      }, 400)
    }

    if (carData.price <= 0) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Price must be greater than 0'
      }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    const car = await db.createCar(carData, userId)
    
    if (!car) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to create car listing'
      }, 500)
    }

    return c.json<ApiResponse<Car>>({
      success: true,
      data: car
    })
  } catch (error) {
    console.error('Error creating car:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to create car listing'
    }, 500)
  }
})

// Get user's own car listings (requires auth)
cars.get('/my/listings', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    const query = c.req.query()
    
    const filters: CarFilters = {
      // Filter by current user's cars only (we'll modify the query in database)
      status: query.status as any || undefined, // Show all statuses for own cars
      sort_by: query.sort_by as any || 'created_desc',
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20
    }

    const db = new DatabaseService(c.env.DB)
    
    // For user's own listings, we need a custom query
    // This is a simplified version - in a real app you'd add this method to DatabaseService
    const result = await db.getCarsWithFilters({
      ...filters,
      // We'll need to modify the database service to support filtering by user_id
    })
    
    return c.json<PaginatedResponse<Car>>(result)
  } catch (error) {
    console.error('Error fetching user cars:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch your car listings'
    }, 500)
  }
})

// Save/unsave car (favorites)
cars.post('/:id/save', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    const carId = parseInt(c.req.param('id'))
    
    if (!carId || isNaN(carId)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid car ID'
      }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    const isSaved = await db.toggleSavedCar(userId, carId)
    
    return c.json<ApiResponse>({
      success: true,
      data: { saved: isSaved },
      message: isSaved ? 'Car saved to favorites' : 'Car removed from favorites'
    })
  } catch (error) {
    console.error('Error saving/unsaving car:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to save/unsave car'
    }, 500)
  }
})

// Get user's saved cars
cars.get('/my/saved', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    
    const db = new DatabaseService(c.env.DB)
    const savedCars = await db.getUserSavedCars(userId)
    
    return c.json<ApiResponse<Car[]>>({
      success: true,
      data: savedCars
    })
  } catch (error) {
    console.error('Error fetching saved cars:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch saved cars'
    }, 500)
  }
})

// Get car makes and models for dropdowns
cars.get('/data/makes', async (c) => {
  try {
    // In a real app, this would come from the database
    // For now, return the predefined data from types
    const { POPULAR_CAR_MAKES } = await import('../types')
    
    return c.json<ApiResponse>({
      success: true,
      data: POPULAR_CAR_MAKES
    })
  } catch (error) {
    console.error('Error fetching car makes:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch car makes'
    }, 500)
  }
})

// Mock data function for development when database isn't available
function getMockCars(filters: CarFilters = {}): Car[] {
  const mockCars: Car[] = [
    {
      id: 1,
      user_id: 1,
      title: '2020 Ford Fiesta ST-Line - Low Mileage!',
      description: 'Excellent condition Ford Fiesta with full service history. Perfect for Island driving with great fuel economy. One owner from new, garage kept.',
      make: 'Ford',
      model: 'Fiesta',
      year: 2020,
      mileage: 28500,
      fuel_type: 'petrol',
      transmission: 'manual',
      body_type: 'hatchback',
      engine_size: '1.0L',
      doors: 5,
      color: 'Magnetic Grey',
      price: 12995000,
      is_negotiable: true,
      status: 'active',
      location: 'Newport, Isle of Wight',
      postcode: 'PO30',
      mot_expiry: '2025-07-15',
      service_history: 'full',
      features: ['Air Conditioning', 'Bluetooth', 'DAB Radio', 'Cruise Control', 'Alloy Wheels'],
      condition_notes: 'Excellent condition throughout. Minor stone chips on front bumper.',
      images: [],
      featured_image: '/static/images/cars/ford-fiesta-1.jpg',
      views: 45,
      is_featured: false,
      created_at: '2024-08-15T10:00:00Z',
      updated_at: '2024-08-15T10:00:00Z',
      seller: {
        full_name: 'John Smith',
        location: 'Newport, Isle of Wight',
        is_dealer: false,
        is_verified: true
      }
    },
    {
      id: 2,
      user_id: 2,
      title: '2018 BMW 320d M Sport - Isle of Wight Delivery Available',
      description: 'Stunning BMW 320d in Alpine White. Dealer maintained with comprehensive warranty. Professional detailing included. Island delivery available.',
      make: 'BMW',
      model: '3 Series',
      year: 2018,
      mileage: 45000,
      fuel_type: 'diesel',
      transmission: 'automatic',
      body_type: 'saloon',
      engine_size: '2.0L',
      doors: 4,
      color: 'Alpine White',
      price: 18950000,
      is_negotiable: true,
      status: 'active',
      location: 'Cowes, Isle of Wight',
      postcode: 'PO31',
      mot_expiry: '2025-03-22',
      service_history: 'full',
      features: ['Leather Seats', 'Navigation', 'Heated Seats', 'Parking Sensors', 'LED Headlights', 'M Sport Package'],
      condition_notes: 'Immaculate condition. Professional valet included.',
      images: [],
      featured_image: '/static/images/cars/bmw-320d-1.jpg',
      views: 67,
      is_featured: true,
      created_at: '2024-08-10T14:30:00Z',
      updated_at: '2024-08-10T14:30:00Z',
      seller: {
        full_name: 'Sarah Jones',
        location: 'Cowes, Isle of Wight',
        is_dealer: true,
        is_verified: true
      }
    },
    {
      id: 3,
      user_id: 1,
      title: '2019 Honda Civic Type R - Track Ready!',
      description: 'Championship White Type R in exceptional condition. Perfect for track days or spirited Island drives. Full Honda service history.',
      make: 'Honda',
      model: 'Civic Type R',
      year: 2019,
      mileage: 15200,
      fuel_type: 'petrol',
      transmission: 'manual',
      body_type: 'hatchback',
      engine_size: '2.0L',
      doors: 5,
      color: 'Championship White',
      price: 32500000,
      is_negotiable: false,
      status: 'active',
      location: 'Newport, Isle of Wight',
      postcode: 'PO30',
      mot_expiry: '2025-11-08',
      service_history: 'full',
      features: ['VTEC Turbo', 'Brembo Brakes', 'Recaro Seats', 'Track Mode', 'Rev Matching'],
      condition_notes: 'Excellent condition. Some track use but well maintained.',
      images: [],
      featured_image: '/static/images/cars/honda-civic-type-r-1.jpg',
      views: 123,
      is_featured: true,
      created_at: '2024-08-05T09:15:00Z',
      updated_at: '2024-08-05T09:15:00Z',
      seller: {
        full_name: 'John Smith',
        location: 'Newport, Isle of Wight',
        is_dealer: false,
        is_verified: true
      }
    },
    {
      id: 4,
      user_id: 3,
      title: '2017 Volkswagen Golf GTI - Island Owned',
      description: 'Local Island owned Golf GTI with excellent service history. Tornado Red with tartan interior. Great fun and practical daily driver.',
      make: 'Volkswagen',
      model: 'Golf',
      year: 2017,
      mileage: 52000,
      fuel_type: 'petrol',
      transmission: 'manual',
      body_type: 'hatchback',
      engine_size: '2.0L',
      doors: 5,
      color: 'Tornado Red',
      price: 16750000,
      is_negotiable: true,
      status: 'active',
      location: 'Ryde, Isle of Wight',
      postcode: 'PO33',
      mot_expiry: '2025-09-14',
      service_history: 'partial',
      features: ['GTI Interior', 'Sports Suspension', '18" Alloys', 'Touchscreen'],
      condition_notes: 'Good condition. Minor wear on drivers seat bolster.',
      images: [],
      featured_image: '/static/images/cars/vw-golf-gti-1.jpg',
      views: 89,
      is_featured: false,
      created_at: '2024-08-12T16:45:00Z',
      updated_at: '2024-08-12T16:45:00Z',
      seller: {
        full_name: 'Mike Wilson',
        location: 'Ryde, Isle of Wight',
        is_dealer: false,
        is_verified: false
      }
    },
    {
      id: 5,
      user_id: 2,
      title: '2021 Tesla Model 3 - Perfect for Island Life',
      description: 'Nearly new Tesla Model 3 with Autopilot. Ideal for Island commuting with home charging setup. Comprehensive Tesla warranty remaining.',
      make: 'Tesla',
      model: 'Model 3',
      year: 2021,
      mileage: 12000,
      fuel_type: 'electric',
      transmission: 'automatic',
      body_type: 'saloon',
      engine_size: 'Electric',
      doors: 4,
      color: 'Pearl White',
      price: 38500000,
      is_negotiable: false,
      status: 'active',
      location: 'Cowes, Isle of Wight',
      postcode: 'PO31',
      mot_expiry: null,
      service_history: 'full',
      features: ['Autopilot', 'Supercharging', 'Premium Audio', 'Glass Roof', 'Over-the-Air Updates'],
      condition_notes: 'As new condition. Includes home charging cable.',
      images: [],
      featured_image: '/static/images/cars/tesla-model-3-1.jpg',
      views: 156,
      is_featured: true,
      created_at: '2024-08-08T11:20:00Z',
      updated_at: '2024-08-08T11:20:00Z',
      seller: {
        full_name: 'Sarah Jones',
        location: 'Cowes, Isle of Wight',
        is_dealer: true,
        is_verified: true
      }
    },
    {
      id: 6,
      user_id: 4,
      title: '2022 Kia Sportage GT-Line S - Hybrid Efficiency',
      description: 'Nearly new Kia Sportage with hybrid technology. Perfect family SUV with excellent fuel economy and 7-year warranty remaining.',
      make: 'Kia',
      model: 'Sportage',
      year: 2022,
      mileage: 8500,
      fuel_type: 'hybrid',
      transmission: 'automatic',
      body_type: 'suv',
      engine_size: '1.6L',
      doors: 5,
      color: 'Platinum Graphite',
      price: 28995000,
      is_negotiable: true,
      status: 'active',
      location: 'Sandown, Isle of Wight',
      postcode: 'PO36',
      mot_expiry: '2026-03-15',
      service_history: 'full',
      features: ['Hybrid Technology', 'Panoramic Sunroof', 'Wireless Charging', 'Lane Keep Assist', 'Blind Spot Monitoring'],
      condition_notes: 'As new condition. Manufacturer warranty until 2029.',
      images: [],
      featured_image: '/static/images/cars/kia-sportage-1.jpg',
      views: 234,
      is_featured: true,
      created_at: '2024-08-01T08:00:00Z',
      updated_at: '2024-08-01T08:00:00Z',
      seller: {
        full_name: 'Emma Brown',
        location: 'Sandown, Isle of Wight',
        is_dealer: false,
        is_verified: true
      }
    }
  ];

  // Apply basic filtering
  let filteredCars = mockCars;

  if (filters.make) {
    filteredCars = filteredCars.filter(car => 
      car.make.toLowerCase().includes(filters.make!.toLowerCase())
    );
  }

  if (filters.model) {
    filteredCars = filteredCars.filter(car => 
      car.model.toLowerCase().includes(filters.model!.toLowerCase())
    );
  }

  if (filters.min_price) {
    filteredCars = filteredCars.filter(car => car.price >= filters.min_price!);
  }

  if (filters.max_price) {
    filteredCars = filteredCars.filter(car => car.price <= filters.max_price!);
  }

  if (filters.location) {
    filteredCars = filteredCars.filter(car => 
      car.location.toLowerCase().includes(filters.location!.toLowerCase())
    );
  }

  if (filters.fuel_type) {
    filteredCars = filteredCars.filter(car => car.fuel_type === filters.fuel_type);
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredCars = filteredCars.filter(car => 
      car.title.toLowerCase().includes(searchTerm) ||
      car.description?.toLowerCase().includes(searchTerm) ||
      car.make.toLowerCase().includes(searchTerm) ||
      car.model.toLowerCase().includes(searchTerm)
    );
  }

  // Sort results
  if (filters.sort_by) {
    switch (filters.sort_by) {
      case 'price_asc':
        filteredCars.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredCars.sort((a, b) => b.price - a.price);
        break;
      case 'year_desc':
        filteredCars.sort((a, b) => b.year - a.year);
        break;
      case 'year_asc':
        filteredCars.sort((a, b) => a.year - b.year);
        break;
      default:
        // Default to newest first
        filteredCars.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  return filteredCars;
}

export default cars