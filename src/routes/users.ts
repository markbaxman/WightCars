// User profile and dashboard routes for WightCars
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { CloudflareBindings, User, ApiResponse } from '../types'
import { DatabaseService } from '../utils/database'
import { verifyJWT, extractToken, hashPassword } from '../utils/auth'

const users = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS
users.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

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

// Get user dashboard stats
users.get('/dashboard/stats', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    
    if (c.env.DB) {
      const db = new DatabaseService(c.env.DB)
      const stats = await db.getUserStats(userId)
      
      return c.json<ApiResponse>({
        success: true,
        data: stats
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: {
        cars: 2,
        messages: 5,
        saved: 3
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch dashboard stats'
    }, 500)
  }
})

// Get user recent activity
users.get('/dashboard/activity', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    
    if (c.env.DB) {
      const db = new DatabaseService(c.env.DB)
      const activity = await db.getRecentActivity(userId)
      
      return c.json<ApiResponse>({
        success: true,
        data: activity
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: [
        { type: 'message', created_at: '2024-08-29T10:00:00Z', description: 'New message about 2020 Ford Fiesta' },
        { type: 'car', created_at: '2024-08-28T15:30:00Z', description: 'Listed 2018 BMW 320d' }
      ]
    })
  } catch (error) {
    console.error('Error fetching dashboard activity:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch dashboard activity'
    }, 500)
  }
})

// Get public user profile
users.get('/profile/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'))
    
    if (isNaN(userId)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid user ID'
      }, 400)
    }

    if (c.env.DB) {
      const db = new DatabaseService(c.env.DB)
      const user = await db.getUserById(userId)
      
      if (!user) {
        return c.json<ApiResponse>({
          success: false,
          error: 'User not found'
        }, 404)
      }

      // Get user's cars for public profile
      const userCars = await c.env.DB.prepare(`
        SELECT 
          id, title, make, model, year, price, featured_image, status, created_at, views
        FROM cars 
        WHERE user_id = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 20
      `).bind(userId).all()

      return c.json<ApiResponse>({
        success: true,
        data: {
          user,
          cars: userCars.results || []
        }
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: {
        user: { id: userId, full_name: 'Test User', location: 'Newport', is_dealer: false, is_verified: true },
        cars: []
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch user profile'
    }, 500)
  }
})

// Update user profile
users.put('/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    const profileData = await c.req.json()
    
    // Basic validation
    if (profileData.email && !profileData.email.includes('@')) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid email format'
      }, 400)
    }

    if (c.env.DB) {
      const updateFields = []
      const updateValues = []
      
      // Build dynamic update query
      if (profileData.full_name) {
        updateFields.push('full_name = ?')
        updateValues.push(profileData.full_name)
      }
      if (profileData.phone) {
        updateFields.push('phone = ?')
        updateValues.push(profileData.phone)
      }
      if (profileData.location) {
        updateFields.push('location = ?')
        updateValues.push(profileData.location)
      }
      if (profileData.avatar_url) {
        updateFields.push('avatar_url = ?')
        updateValues.push(profileData.avatar_url)
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      updateValues.push(userId)

      const result = await c.env.DB.prepare(`
        UPDATE users SET ${updateFields.join(', ')}
        WHERE id = ?
        RETURNING id, email, full_name, phone, location, is_dealer, is_verified, avatar_url, created_at, updated_at
      `).bind(...updateValues).first()

      return c.json<ApiResponse<User>>({
        success: true,
        data: result as User
      })
    }

    // Mock response for development
    return c.json<ApiResponse>({
      success: true,
      data: { ...profileData, id: userId }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to update profile'
    }, 500)
  }
})

// Change password
users.put('/password', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    const { currentPassword, newPassword } = await c.req.json()
    
    if (!currentPassword || !newPassword) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Current password and new password are required'
      }, 400)
    }

    if (newPassword.length < 6) {
      return c.json<ApiResponse>({
        success: false,
        error: 'New password must be at least 6 characters long'
      }, 400)
    }

    if (c.env.DB) {
      const db = new DatabaseService(c.env.DB)
      
      // Get current user with password hash
      const user = await c.env.DB.prepare(`
        SELECT password_hash FROM users WHERE id = ?
      `).bind(userId).first()

      if (!user) {
        return c.json<ApiResponse>({
          success: false,
          error: 'User not found'
        }, 404)
      }

      // Verify current password
      const currentPasswordHash = await hashPassword(currentPassword)
      if (currentPasswordHash !== (user as any).password_hash) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Current password is incorrect'
        }, 400)
      }

      // Update password
      const newPasswordHash = await hashPassword(newPassword)
      await c.env.DB.prepare(`
        UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newPasswordHash, userId).run()

      return c.json<ApiResponse>({
        success: true,
        message: 'Password updated successfully'
      })
    }

    // Mock response for development
    return c.json<ApiResponse>({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Error updating password:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to update password'
    }, 500)
  }
})

// Admin endpoints (basic implementation)
users.get('/admin/stats', requireAuth, async (c) => {
  try {
    // Basic auth check - in production, verify admin role
    const userId = c.get('userId') as number
    
    if (c.env.DB) {
      const [totalUsers, totalCars, totalMessages, activeListings] = await Promise.all([
        c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first(),
        c.env.DB.prepare(`SELECT COUNT(*) as count FROM cars`).first(),
        c.env.DB.prepare(`SELECT COUNT(*) as count FROM messages`).first(),
        c.env.DB.prepare(`SELECT COUNT(*) as count FROM cars WHERE status = 'active'`).first()
      ])

      return c.json<ApiResponse>({
        success: true,
        data: {
          users: (totalUsers as any)?.count || 0,
          cars: (totalCars as any)?.count || 0,
          messages: (totalMessages as any)?.count || 0,
          activeListings: (activeListings as any)?.count || 0
        }
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: {
        users: 25,
        cars: 150,
        messages: 430,
        activeListings: 120
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch admin stats'
    }, 500)
  }
})

users.get('/admin/users', requireAuth, async (c) => {
  try {
    if (c.env.DB) {
      const users = await c.env.DB.prepare(`
        SELECT 
          id, email, full_name, location, is_dealer, is_verified, created_at,
          (SELECT COUNT(*) FROM cars WHERE user_id = users.id) as car_count
        FROM users
        ORDER BY created_at DESC
        LIMIT 100
      `).all()

      return c.json<ApiResponse>({
        success: true,
        data: users.results || []
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: [
        { id: 1, email: 'john@example.com', full_name: 'John Smith', location: 'Newport', is_dealer: false, is_verified: true, car_count: 2 }
      ]
    })
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch users'
    }, 500)
  }
})

// Get user's cars by ID
users.get('/:id/cars', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'))
    
    if (c.env.DB) {
      const db = new DatabaseService(c.env.DB)
      const cars = await db.getUserCars(userId)
      
      return c.json<ApiResponse>({
        success: true,
        data: cars
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: [
        {
          id: 1,
          title: "2020 Ford Fiesta ST-Line",
          make: "Ford", 
          model: "Fiesta",
          year: 2020,
          price: 12995000,
          featured_image: "/static/images/cars/ford-fiesta-1.jpg",
          status: "active",
          views: 156,
          created_at: "2024-08-29T10:00:00Z"
        }
      ]
    })
  } catch (error) {
    console.error('Error fetching user cars:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch user cars'
    }, 500)
  }
})

export default users