// Image upload and management routes for WightCars
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { CloudflareBindings, ApiResponse } from '../types'
import { verifyJWT, extractToken } from '../utils/auth'

const images = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS
images.use('*', cors({
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

// Upload image for car listing
images.post('/upload/car/:carId', requireAuth, async (c) => {
  try {
    const carId = parseInt(c.req.param('carId'))
    const userId = c.get('userId') as number

    // Verify user owns the car
    if (c.env.DB) {
      const car = await c.env.DB.prepare(`
        SELECT id, user_id FROM cars WHERE id = ?
      `).bind(carId).first()

      if (!car || car.user_id !== userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Car not found or access denied'
        }, 403)
      }
    }

    const formData = await c.req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return c.json<ApiResponse>({
        success: false,
        error: 'No image file provided'
      }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      }, 400)
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json<ApiResponse>({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      }, 400)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const filename = `car_${carId}_${timestamp}_${randomId}.${extension}`
    const key = `cars/${carId}/${filename}`

    if (c.env.IMAGES) {
      // Upload to R2
      const arrayBuffer = await file.arrayBuffer()
      await c.env.IMAGES.put(key, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          carId: carId.toString(),
          userId: userId.toString(),
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      })

      // Update car images in database
      if (c.env.DB) {
        // Get current images
        const currentCar = await c.env.DB.prepare(`
          SELECT images, featured_image FROM cars WHERE id = ?
        `).bind(carId).first()

        const currentImages = currentCar?.images ? JSON.parse(currentCar.images) : []
        currentImages.push(key)

        // Set as featured image if it's the first image
        const featuredImage = currentCar?.featured_image || key

        await c.env.DB.prepare(`
          UPDATE cars 
          SET images = ?, featured_image = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(JSON.stringify(currentImages), featuredImage, carId).run()
      }

      return c.json<ApiResponse>({
        success: true,
        data: {
          key,
          url: `/api/images/${key}`,
          filename,
          size: file.size,
          type: file.type
        }
      })
    }

    // Fallback for development without R2
    return c.json<ApiResponse>({
      success: true,
      data: {
        key: `mock_${filename}`,
        url: `/static/images/cars/placeholder-car.jpg`,
        filename,
        size: file.size,
        type: file.type,
        note: 'Development mode - using placeholder image'
      }
    })

  } catch (error) {
    console.error('Error uploading image:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to upload image'
    }, 500)
  }
})

// Get car images (specific route must come before catch-all)
images.get('/car/:carId', async (c) => {
  try {
    const carId = parseInt(c.req.param('carId'))

    if (c.env.DB) {
      const car = await c.env.DB.prepare(`
        SELECT images, featured_image FROM cars WHERE id = ?
      `).bind(carId).first()

      if (!car) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Car not found'
        }, 404)
      }

      const images = car.images ? JSON.parse(car.images) : []
      const imageUrls = images.map((key: string) => ({
        key,
        url: `/api/images/${key}`,
        isFeatured: key === car.featured_image
      }))

      return c.json<ApiResponse>({
        success: true,
        data: {
          images: imageUrls,
          featured: car.featured_image ? `/api/images/${car.featured_image}` : null,
          count: images.length
        }
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: {
        images: [
          { key: 'mock1', url: '/static/images/cars/ford-fiesta-1.jpg', isFeatured: true },
          { key: 'mock2', url: '/static/images/cars/placeholder-car.svg', isFeatured: false }
        ],
        featured: '/static/images/cars/ford-fiesta-1.jpg',
        count: 2
      }
    })

  } catch (error) {
    console.error('Error getting car images:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to get images'
    }, 500)
  }
})

// Set featured image (specific route must come before catch-all)
images.put('/car/:carId/featured', requireAuth, async (c) => {
  try {
    const carId = parseInt(c.req.param('carId'))
    const userId = c.get('userId') as number
    const { imageKey } = await c.req.json()

    if (c.env.DB) {
      // Verify user owns the car
      const car = await c.env.DB.prepare(`
        SELECT id, user_id, images FROM cars WHERE id = ?
      `).bind(carId).first()

      if (!car || car.user_id !== userId) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Car not found or access denied'
        }, 403)
      }

      // Verify image belongs to car
      const images = car.images ? JSON.parse(car.images) : []
      if (!images.includes(imageKey)) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Image not found for this car'
        }, 400)
      }

      // Update featured image
      await c.env.DB.prepare(`
        UPDATE cars SET featured_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(imageKey, carId).run()

      return c.json<ApiResponse>({
        success: true,
        data: { featuredImage: `/api/images/${imageKey}` }
      })
    }

    return c.json<ApiResponse>({
      success: true,
      data: { featuredImage: `/static/images/cars/placeholder-car.svg` }
    })

  } catch (error) {
    console.error('Error setting featured image:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to set featured image'
    }, 500)
  }
})

// Get image from R2 (catch-all route must come last)
images.get('/:key{.*}', async (c) => {
  try {
    const key = c.req.param('key')

    if (c.env.IMAGES) {
      const object = await c.env.IMAGES.get(key)
      
      if (!object) {
        return c.notFound()
      }

      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      headers.set('cache-control', 'public, max-age=31536000') // Cache for 1 year

      return new Response(object.body, { headers })
    }

    // Fallback for development
    return c.redirect('/static/images/cars/placeholder-car.jpg')

  } catch (error) {
    console.error('Error serving image:', error)
    return c.notFound()
  }
})

// Delete image
images.delete('/:key{.*}', requireAuth, async (c) => {
  try {
    const key = c.req.param('key')
    const userId = c.get('userId') as number

    if (c.env.IMAGES && c.env.DB) {
      // Get image metadata to verify ownership
      const object = await c.env.IMAGES.get(key)
      if (!object) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Image not found'
        }, 404)
      }

      const metadata = object.customMetadata
      if (metadata?.userId !== userId.toString()) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Access denied'
        }, 403)
      }

      // Delete from R2
      await c.env.IMAGES.delete(key)

      // Remove from car images array in database
      const carId = parseInt(metadata?.carId || '0')
      if (carId) {
        const car = await c.env.DB.prepare(`
          SELECT images, featured_image FROM cars WHERE id = ?
        `).bind(carId).first()

        if (car) {
          const currentImages = car.images ? JSON.parse(car.images) : []
          const updatedImages = currentImages.filter((img: string) => img !== key)
          
          // If deleted image was featured, set new featured image
          let featuredImage = car.featured_image
          if (featuredImage === key) {
            featuredImage = updatedImages.length > 0 ? updatedImages[0] : null
          }

          await c.env.DB.prepare(`
            UPDATE cars 
            SET images = ?, featured_image = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(JSON.stringify(updatedImages), featuredImage, carId).run()
        }
      }

      return c.json<ApiResponse>({
        success: true,
        data: { deleted: key }
      })
    }

    return c.json<ApiResponse>({
      success: true,
      data: { deleted: key, note: 'Development mode - mock deletion' }
    })

  } catch (error) {
    console.error('Error deleting image:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to delete image'
    }, 500)
  }
})

export default images