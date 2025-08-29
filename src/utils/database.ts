// Database utilities for WightCars
import type { 
  Car, 
  User, 
  Message, 
  CarFilters, 
  CloudflareBindings,
  UserRegistration,
  CarCreate,
  PaginatedResponse
} from '../types'

export class DatabaseService {
  constructor(private db: D1Database) {}

  // User operations
  async createUser(userData: UserRegistration & { password_hash: string }): Promise<User | null> {
    try {
      const result = await this.db.prepare(`
        INSERT INTO users (email, password_hash, full_name, phone, location, is_dealer)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        userData.email,
        userData.password_hash,
        userData.full_name,
        userData.phone || null,
        userData.location || null,
        userData.is_dealer ? 1 : 0
      ).first()

      return result as User
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  async getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM users WHERE email = ?
      `).bind(email).first()

      return result as (User & { password_hash: string }) | null
    } catch (error) {
      console.error('Error fetching user by email:', error)
      return null
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const result = await this.db.prepare(`
        SELECT id, email, full_name, phone, location, is_dealer, is_verified, 
               avatar_url, created_at, updated_at 
        FROM users WHERE id = ?
      `).bind(id).first()

      return result as User | null
    } catch (error) {
      console.error('Error fetching user by ID:', error)
      return null
    }
  }

  // Car operations
  async createCar(carData: CarCreate, userId: number): Promise<Car | null> {
    try {
      const result = await this.db.prepare(`
        INSERT INTO cars (
          user_id, title, description, make, model, year, mileage, fuel_type,
          transmission, body_type, engine_size, doors, color, price, is_negotiable,
          location, postcode, mot_expiry, service_history, features, condition_notes,
          images, featured_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `).bind(
        userId,
        carData.title,
        carData.description || null,
        carData.make,
        carData.model,
        carData.year,
        carData.mileage || null,
        carData.fuel_type,
        carData.transmission,
        carData.body_type,
        carData.engine_size || null,
        carData.doors || null,
        carData.color || null,
        carData.price,
        carData.is_negotiable ? 1 : 0,
        carData.location,
        carData.postcode || null,
        carData.mot_expiry || null,
        carData.service_history || 'unknown',
        carData.features ? JSON.stringify(carData.features) : null,
        carData.condition_notes || null,
        carData.images ? JSON.stringify(carData.images) : null,
        carData.featured_image || null
      ).first()

      const car = result as Car
      if (car) {
        // Parse JSON fields
        car.features = car.features ? JSON.parse(car.features as any) : []
        car.images = car.images ? JSON.parse(car.images as any) : []
      }
      return car
    } catch (error) {
      console.error('Error creating car:', error)
      return null
    }
  }

  async getCarsWithFilters(filters: CarFilters = {}): Promise<PaginatedResponse<Car>> {
    try {
      const page = filters.page || 1
      const limit = Math.min(filters.limit || 20, 50)
      const offset = (page - 1) * limit

      let whereClause = 'WHERE cars.status = ?'
      const params: any[] = [filters.status || 'active']

      // Build dynamic WHERE clause based on filters
      if (filters.make) {
        whereClause += ' AND LOWER(cars.make) = LOWER(?)'
        params.push(filters.make)
      }
      if (filters.model) {
        whereClause += ' AND LOWER(cars.model) = LOWER(?)'
        params.push(filters.model)
      }
      if (filters.min_price) {
        whereClause += ' AND cars.price >= ?'
        params.push(filters.min_price)
      }
      if (filters.max_price) {
        whereClause += ' AND cars.price <= ?'
        params.push(filters.max_price)
      }
      if (filters.min_year) {
        whereClause += ' AND cars.year >= ?'
        params.push(filters.min_year)
      }
      if (filters.max_year) {
        whereClause += ' AND cars.year <= ?'
        params.push(filters.max_year)
      }
      if (filters.fuel_type) {
        whereClause += ' AND cars.fuel_type = ?'
        params.push(filters.fuel_type)
      }
      if (filters.transmission) {
        whereClause += ' AND cars.transmission = ?'
        params.push(filters.transmission)
      }
      if (filters.body_type) {
        whereClause += ' AND cars.body_type = ?'
        params.push(filters.body_type)
      }
      if (filters.location) {
        whereClause += ' AND LOWER(cars.location) LIKE LOWER(?)'
        params.push(`%${filters.location}%`)
      }
      if (filters.search) {
        whereClause += ' AND (LOWER(cars.title) LIKE LOWER(?) OR LOWER(cars.make) LIKE LOWER(?) OR LOWER(cars.model) LIKE LOWER(?))'
        const searchTerm = `%${filters.search}%`
        params.push(searchTerm, searchTerm, searchTerm)
      }
      if (filters.is_dealer !== undefined) {
        whereClause += ' AND users.is_dealer = ?'
        params.push(filters.is_dealer ? 1 : 0)
      }

      // Sort clause
      let orderClause = 'ORDER BY '
      switch (filters.sort_by) {
        case 'price_asc': orderClause += 'cars.price ASC'; break
        case 'price_desc': orderClause += 'cars.price DESC'; break
        case 'year_asc': orderClause += 'cars.year ASC'; break
        case 'year_desc': orderClause += 'cars.year DESC'; break
        case 'mileage_asc': orderClause += 'cars.mileage ASC'; break
        case 'mileage_desc': orderClause += 'cars.mileage DESC'; break
        case 'created_asc': orderClause += 'cars.created_at ASC'; break
        default: orderClause += 'cars.created_at DESC'
      }

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM cars 
        JOIN users ON cars.user_id = users.id 
        ${whereClause}
      `
      const countResult = await this.db.prepare(countQuery).bind(...params).first() as { total: number }
      const total = countResult.total

      // Get paginated results
      const query = `
        SELECT 
          cars.*,
          users.full_name as seller_name,
          users.location as seller_location,
          users.is_dealer as seller_is_dealer,
          users.is_verified as seller_is_verified
        FROM cars 
        JOIN users ON cars.user_id = users.id 
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `
      
      const results = await this.db.prepare(query).bind(...params, limit, offset).all()
      
      // Process results
      const cars = results.results.map((row: any) => {
        const car: Car = {
          ...row,
          is_negotiable: Boolean(row.is_negotiable),
          is_featured: Boolean(row.is_featured),
          features: row.features ? JSON.parse(row.features) : [],
          images: row.images ? JSON.parse(row.images) : [],
          seller: {
            full_name: row.seller_name,
            location: row.seller_location,
            is_dealer: Boolean(row.seller_is_dealer),
            is_verified: Boolean(row.seller_is_verified)
          }
        }
        
        // Clean up joined fields
        delete (car as any).seller_name
        delete (car as any).seller_location  
        delete (car as any).seller_is_dealer
        delete (car as any).seller_is_verified
        
        return car
      })

      return {
        success: true,
        data: cars,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching cars:', error)
      return {
        success: false,
        error: 'Failed to fetch cars'
      }
    }
  }

  async getCarById(id: number): Promise<Car | null> {
    try {
      const result = await this.db.prepare(`
        SELECT 
          cars.*,
          users.full_name as seller_name,
          users.email as seller_email,
          users.phone as seller_phone,
          users.location as seller_location,
          users.is_dealer as seller_is_dealer,
          users.is_verified as seller_is_verified
        FROM cars 
        JOIN users ON cars.user_id = users.id 
        WHERE cars.id = ?
      `).bind(id).first()

      if (!result) return null

      const car: Car = {
        ...(result as any),
        is_negotiable: Boolean((result as any).is_negotiable),
        is_featured: Boolean((result as any).is_featured),
        features: (result as any).features ? JSON.parse((result as any).features) : [],
        images: (result as any).images ? JSON.parse((result as any).images) : [],
        seller: {
          full_name: (result as any).seller_name,
          email: (result as any).seller_email,
          phone: (result as any).seller_phone,
          location: (result as any).seller_location,
          is_dealer: Boolean((result as any).seller_is_dealer),
          is_verified: Boolean((result as any).seller_is_verified)
        }
      }

      // Clean up joined fields
      delete (car as any).seller_name
      delete (car as any).seller_email
      delete (car as any).seller_phone
      delete (car as any).seller_location
      delete (car as any).seller_is_dealer
      delete (car as any).seller_is_verified

      // Increment view count
      await this.db.prepare(`
        UPDATE cars SET views = views + 1 WHERE id = ?
      `).bind(id).run()

      return car
    } catch (error) {
      console.error('Error fetching car by ID:', error)
      return null
    }
  }

  // Message operations
  async createMessage(senderId: number, carId: number, recipientId: number, subject: string, message: string): Promise<Message | null> {
    try {
      const result = await this.db.prepare(`
        INSERT INTO messages (sender_id, car_id, recipient_id, subject, message)
        VALUES (?, ?, ?, ?, ?)
        RETURNING *
      `).bind(senderId, carId, recipientId, subject, message).first()

      return result as Message
    } catch (error) {
      console.error('Error creating message:', error)
      return null
    }
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    try {
      const results = await this.db.prepare(`
        SELECT 
          messages.*,
          cars.title as car_title,
          cars.make as car_make,
          cars.model as car_model,
          cars.year as car_year,
          cars.featured_image as car_image,
          sender.full_name as sender_name,
          sender.email as sender_email,
          recipient.full_name as recipient_name,
          recipient.email as recipient_email
        FROM messages
        JOIN cars ON messages.car_id = cars.id
        JOIN users as sender ON messages.sender_id = sender.id
        JOIN users as recipient ON messages.recipient_id = recipient.id
        WHERE messages.sender_id = ? OR messages.recipient_id = ?
        ORDER BY messages.created_at DESC
      `).bind(userId, userId).all()

      return results.results.map((row: any) => ({
        ...row,
        is_read: Boolean(row.is_read),
        car: {
          id: row.car_id,
          title: row.car_title,
          make: row.car_make,
          model: row.car_model,
          year: row.car_year,
          featured_image: row.car_image
        },
        sender: {
          id: row.sender_id,
          full_name: row.sender_name,
          email: row.sender_email
        },
        recipient: {
          id: row.recipient_id,
          full_name: row.recipient_name,
          email: row.recipient_email
        }
      }))
    } catch (error) {
      console.error('Error fetching user messages:', error)
      return []
    }
  }

  // Saved cars operations
  async toggleSavedCar(userId: number, carId: number): Promise<boolean> {
    try {
      // Check if already saved
      const existing = await this.db.prepare(`
        SELECT id FROM saved_cars WHERE user_id = ? AND car_id = ?
      `).bind(userId, carId).first()

      if (existing) {
        // Remove from saved
        await this.db.prepare(`
          DELETE FROM saved_cars WHERE user_id = ? AND car_id = ?
        `).bind(userId, carId).run()
        return false
      } else {
        // Add to saved
        await this.db.prepare(`
          INSERT INTO saved_cars (user_id, car_id) VALUES (?, ?)
        `).bind(userId, carId).run()
        return true
      }
    } catch (error) {
      console.error('Error toggling saved car:', error)
      return false
    }
  }

  async getUserSavedCars(userId: number): Promise<Car[]> {
    try {
      const results = await this.db.prepare(`
        SELECT 
          cars.*,
          users.full_name as seller_name,
          users.location as seller_location,
          users.is_dealer as seller_is_dealer,
          users.is_verified as seller_is_verified
        FROM saved_cars
        JOIN cars ON saved_cars.car_id = cars.id
        JOIN users ON cars.user_id = users.id
        WHERE saved_cars.user_id = ?
        ORDER BY saved_cars.created_at DESC
      `).bind(userId).all()

      return results.results.map((row: any) => ({
        ...row,
        is_negotiable: Boolean(row.is_negotiable),
        is_featured: Boolean(row.is_featured),
        features: row.features ? JSON.parse(row.features) : [],
        images: row.images ? JSON.parse(row.images) : [],
        seller: {
          full_name: row.seller_name,
          location: row.seller_location,
          is_dealer: Boolean(row.seller_is_dealer),
          is_verified: Boolean(row.seller_is_verified)
        }
      }))
    } catch (error) {
      console.error('Error fetching saved cars:', error)
      return []
    }
  }

  async incrementCarViews(carId: number): Promise<void> {
    try {
      await this.db.prepare(`
        UPDATE cars SET views = views + 1 WHERE id = ?
      `).bind(carId).run()
    } catch (error) {
      console.error('Error incrementing car views:', error)
    }
  }

  async updateCar(carId: number, carData: Partial<CarCreate>): Promise<Car | null> {
    try {
      const updateFields = []
      const updateValues = []
      
      // Build dynamic update query
      if (carData.title) {
        updateFields.push('title = ?')
        updateValues.push(carData.title)
      }
      if (carData.description !== undefined) {
        updateFields.push('description = ?')
        updateValues.push(carData.description)
      }
      if (carData.make) {
        updateFields.push('make = ?')
        updateValues.push(carData.make)
      }
      if (carData.model) {
        updateFields.push('model = ?')
        updateValues.push(carData.model)
      }
      if (carData.year) {
        updateFields.push('year = ?')
        updateValues.push(carData.year)
      }
      if (carData.mileage !== undefined) {
        updateFields.push('mileage = ?')
        updateValues.push(carData.mileage)
      }
      if (carData.fuel_type) {
        updateFields.push('fuel_type = ?')
        updateValues.push(carData.fuel_type)
      }
      if (carData.transmission) {
        updateFields.push('transmission = ?')
        updateValues.push(carData.transmission)
      }
      if (carData.body_type) {
        updateFields.push('body_type = ?')
        updateValues.push(carData.body_type)
      }
      if (carData.engine_size) {
        updateFields.push('engine_size = ?')
        updateValues.push(carData.engine_size)
      }
      if (carData.doors) {
        updateFields.push('doors = ?')
        updateValues.push(carData.doors)
      }
      if (carData.color) {
        updateFields.push('color = ?')
        updateValues.push(carData.color)
      }
      if (carData.price !== undefined) {
        updateFields.push('price = ?')
        updateValues.push(carData.price)
      }
      if (carData.is_negotiable !== undefined) {
        updateFields.push('is_negotiable = ?')
        updateValues.push(carData.is_negotiable ? 1 : 0)
      }
      if (carData.location) {
        updateFields.push('location = ?')
        updateValues.push(carData.location)
      }
      if (carData.postcode) {
        updateFields.push('postcode = ?')
        updateValues.push(carData.postcode)
      }
      if (carData.mot_expiry) {
        updateFields.push('mot_expiry = ?')
        updateValues.push(carData.mot_expiry)
      }
      if (carData.service_history) {
        updateFields.push('service_history = ?')
        updateValues.push(carData.service_history)
      }
      if (carData.features) {
        updateFields.push('features = ?')
        updateValues.push(JSON.stringify(carData.features))
      }
      if (carData.condition_notes) {
        updateFields.push('condition_notes = ?')
        updateValues.push(carData.condition_notes)
      }
      if (carData.images) {
        updateFields.push('images = ?')
        updateValues.push(JSON.stringify(carData.images))
      }
      if (carData.featured_image) {
        updateFields.push('featured_image = ?')
        updateValues.push(carData.featured_image)
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      updateValues.push(carId)

      const result = await this.db.prepare(`
        UPDATE cars SET ${updateFields.join(', ')} 
        WHERE id = ?
        RETURNING *
      `).bind(...updateValues).first()

      return result as Car
    } catch (error) {
      console.error('Error updating car:', error)
      return null
    }
  }

  async deleteCar(carId: number): Promise<boolean> {
    try {
      await this.db.prepare(`
        DELETE FROM cars WHERE id = ?
      `).bind(carId).run()
      
      return true
    } catch (error) {
      console.error('Error deleting car:', error)
      return false
    }
  }

  async getUserStats(userId: number): Promise<any> {
    try {
      const [carCount, messageCount, savedCount] = await Promise.all([
        this.db.prepare(`SELECT COUNT(*) as count FROM cars WHERE user_id = ?`).bind(userId).first(),
        this.db.prepare(`SELECT COUNT(*) as count FROM messages WHERE recipient_id = ?`).bind(userId).first(),
        this.db.prepare(`SELECT COUNT(*) as count FROM saved_cars WHERE user_id = ?`).bind(userId).first()
      ])

      return {
        cars: (carCount as any)?.count || 0,
        messages: (messageCount as any)?.count || 0,
        saved: (savedCount as any)?.count || 0
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return { cars: 0, messages: 0, saved: 0 }
    }
  }

  async getRecentActivity(userId: number): Promise<any[]> {
    try {
      const results = await this.db.prepare(`
        SELECT 
          'message' as type,
          created_at,
          'New message about ' || (SELECT title FROM cars WHERE id = car_id) as description
        FROM messages 
        WHERE recipient_id = ? 
        UNION ALL
        SELECT 
          'car' as type,
          created_at,
          'Listed ' || title as description
        FROM cars 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `).bind(userId, userId).all()

      return results.results || []
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  async getUserCars(userId: number, limit: number = 20): Promise<Car[]> {
    try {
      const results = await this.db.prepare(`
        SELECT 
          cars.*,
          users.full_name as seller_name,
          users.location as seller_location,
          users.is_dealer as seller_is_dealer,
          users.is_verified as seller_is_verified
        FROM cars
        JOIN users ON cars.user_id = users.id
        WHERE cars.user_id = ? AND cars.status = 'active'
        ORDER BY cars.created_at DESC
        LIMIT ?
      `).bind(userId, limit).all()

      return results.results.map((row: any) => ({
        ...row,
        is_negotiable: Boolean(row.is_negotiable),
        is_featured: Boolean(row.is_featured),
        features: row.features ? JSON.parse(row.features) : [],
        images: row.images ? JSON.parse(row.images) : [],
        seller: {
          full_name: row.seller_name,
          location: row.seller_location,
          is_dealer: Boolean(row.seller_is_dealer),
          is_verified: Boolean(row.seller_is_verified)
        }
      }))
    } catch (error) {
      console.error('Error fetching user cars:', error)
      return []
    }
  }
}