// Messages routes for WightCars
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { CloudflareBindings, Message, MessageCreate, ApiResponse } from '../types'
import { DatabaseService } from '../utils/database'
import { verifyJWT, extractToken } from '../utils/auth'

const messages = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS
messages.use('*', cors({
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

// Get user's messages
messages.get('/', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    
    const db = new DatabaseService(c.env.DB)
    const userMessages = await db.getUserMessages(userId)
    
    return c.json<ApiResponse<Message[]>>({
      success: true,
      data: userMessages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch messages'
    }, 500)
  }
})

// Send message about a car
messages.post('/', requireAuth, async (c) => {
  try {
    const senderId = c.get('userId') as number
    const messageData: MessageCreate = await c.req.json()
    
    if (!messageData.car_id || !messageData.recipient_id || !messageData.message) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Car ID, recipient ID, and message are required'
      }, 400)
    }

    if (senderId === messageData.recipient_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Cannot send message to yourself'
      }, 400)
    }

    const db = new DatabaseService(c.env.DB)
    
    // Verify the car exists and get owner info
    const car = await db.getCarById(messageData.car_id)
    if (!car) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Car not found'
      }, 404)
    }

    // Verify recipient is the car owner
    if (car.user_id !== messageData.recipient_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid recipient for this car'
      }, 400)
    }

    const subject = messageData.subject || `Enquiry about ${car.year} ${car.make} ${car.model}`
    
    const message = await db.createMessage(
      senderId,
      messageData.car_id,
      messageData.recipient_id,
      subject,
      messageData.message
    )
    
    if (!message) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to send message'
      }, 500)
    }

    return c.json<ApiResponse<Message>>({
      success: true,
      data: message,
      message: 'Message sent successfully'
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to send message'
    }, 500)
  }
})

// Mark message as read
messages.put('/:id/read', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    const messageId = parseInt(c.req.param('id'))
    
    if (!messageId || isNaN(messageId)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid message ID'
      }, 400)
    }

    // In a full implementation, you'd want to verify the user owns this message
    // For now, we'll just update it
    const db = new DatabaseService(c.env.DB)
    
    try {
      await c.env.DB.prepare(`
        UPDATE messages 
        SET is_read = 1 
        WHERE id = ? AND recipient_id = ?
      `).bind(messageId, userId).run()
      
      return c.json<ApiResponse>({
        success: true,
        message: 'Message marked as read'
      })
    } catch (dbError) {
      console.error('Database error marking message as read:', dbError)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to mark message as read'
      }, 500)
    }
  } catch (error) {
    console.error('Error marking message as read:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to mark message as read'
    }, 500)
  }
})

// Get conversation between two users about a specific car
messages.get('/conversation/:carId/:otherUserId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as number
    const carId = parseInt(c.req.param('carId'))
    const otherUserId = parseInt(c.req.param('otherUserId'))
    
    if (!carId || isNaN(carId) || !otherUserId || isNaN(otherUserId)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid car ID or user ID'
      }, 400)
    }

    try {
      const results = await c.env.DB.prepare(`
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
        WHERE messages.car_id = ? 
          AND (
            (messages.sender_id = ? AND messages.recipient_id = ?) 
            OR 
            (messages.sender_id = ? AND messages.recipient_id = ?)
          )
        ORDER BY messages.created_at ASC
      `).bind(carId, userId, otherUserId, otherUserId, userId).all()

      const conversation = results.results.map((row: any) => ({
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

      return c.json<ApiResponse<Message[]>>({
        success: true,
        data: conversation
      })
    } catch (dbError) {
      console.error('Database error fetching conversation:', dbError)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch conversation'
      }, 500)
    }
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch conversation'
    }, 500)
  }
})

export default messages