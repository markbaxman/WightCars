// Authentication routes for WightCars
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { CloudflareBindings, UserRegistration, UserLogin, AuthResponse, ApiResponse } from '../types'
import { DatabaseService } from '../utils/database'
import { generateJWT, hashPassword, verifyPassword, verifyJWT, extractToken } from '../utils/auth'

const auth = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS
auth.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// Register new user
auth.post('/register', async (c) => {
  try {
    const userData: UserRegistration = await c.req.json()
    
    // Basic validation
    if (!userData.email || !userData.password || !userData.full_name) {
      return c.json<AuthResponse>({
        success: false,
        error: 'Email, password, and full name are required'
      }, 400)
    }

    if (userData.password.length < 6) {
      return c.json<AuthResponse>({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    
    // Check if user already exists
    const existingUser = await db.getUserByEmail(userData.email)
    if (existingUser) {
      return c.json<AuthResponse>({
        success: false,
        error: 'User with this email already exists'
      }, 400)
    }

    // Hash password and create user
    const passwordHash = await hashPassword(userData.password)
    const user = await db.createUser({
      ...userData,
      password_hash: passwordHash
    })

    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        error: 'Failed to create user'
      }, 500)
    }

    // Generate JWT token
    const token = await generateJWT(user)

    return c.json<AuthResponse>({
      success: true,
      data: {
        user,
        token
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return c.json<AuthResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

// Login user
auth.post('/login', async (c) => {
  try {
    const { email, password }: UserLogin = await c.req.json()
    
    if (!email || !password) {
      return c.json<AuthResponse>({
        success: false,
        error: 'Email and password are required'
      }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    const user = await db.getUserByEmail(email)
    
    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        error: 'Invalid email or password'
      }, 401)
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      return c.json<AuthResponse>({
        success: false,
        error: 'Invalid email or password'
      }, 401)
    }

    // Remove password hash from user object
    const { password_hash, ...userWithoutPassword } = user
    const token = await generateJWT(userWithoutPassword)

    return c.json<AuthResponse>({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json<AuthResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

// Get current user profile
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = extractToken(authHeader)
    
    if (!token) {
      return c.json<AuthResponse>({
        success: false,
        error: 'No token provided'
      }, 401)
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return c.json<AuthResponse>({
        success: false,
        error: 'Invalid token'
      }, 401)
    }

    const db = new DatabaseService(c.env.DB)
    const user = await db.getUserById(payload.userId)
    
    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        error: 'User not found'
      }, 404)
    }

    return c.json<AuthResponse>({
      success: true,
      data: {
        user,
        token
      }
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return c.json<AuthResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

// Verify token endpoint
auth.post('/verify', async (c) => {
  try {
    const { token } = await c.req.json()
    
    if (!token) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Token is required'
      }, 400)
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid or expired token'
      }, 401)
    }

    const db = new DatabaseService(c.env.DB)
    const user = await db.getUserById(payload.userId)
    
    if (!user) {
      return c.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, 404)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { valid: true, user }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

export default auth