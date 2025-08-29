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

    const db = new DatabaseService(c.env.DB)
    const result = await db.getCarsWithFilters(filters)
    
    return c.json<PaginatedResponse<Car>>(result)
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

    const db = new DatabaseService(c.env.DB)
    const result = await db.getCarsWithFilters(filters)
    
    return c.json<PaginatedResponse<Car>>(result)
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

export default cars