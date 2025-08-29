// Enhanced admin routes for WightCars
// Comprehensive admin panel with user management, moderation, and analytics
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { CloudflareBindings, ApiResponse } from '../types'
import { verifyJWT, extractToken } from '../utils/auth'
import { DatabaseService } from '../utils/database'

const admin = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS
admin.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// Middleware to require admin authentication
const requireAdmin = async (c: any, next: any) => {
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

  // Check if user is admin
  if (c.env.DB) {
    const user = await c.env.DB.prepare(`
      SELECT id, email, is_admin, is_suspended FROM users WHERE id = ?
    `).bind(payload.userId).first()

    if (!user || !user.is_admin || user.is_suspended) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, 403)
    }

    c.set('userId', payload.userId)
    c.set('userEmail', payload.email)
  }

  await next()
}

// Log admin actions
const logAdminAction = async (c: any, action: string, targetType: string, targetId?: number, details?: string) => {
  if (!c.env.DB) return

  try {
    await c.env.DB.prepare(`
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      c.get('userId'),
      action,
      targetType,
      targetId || null,
      details || null,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    ).run()
  } catch (error) {
    console.error('Error logging admin action:', error)
  }
}

// Dashboard overview
admin.get('/dashboard', requireAdmin, async (c) => {
  try {
    if (c.env.DB) {
      const db = new DatabaseService(c.env.DB)
      
      // Get comprehensive stats
      const [
        userStats,
        carStats,
        messageStats,
        todayStats,
        recentActivity,
        pendingReports,
        pendingModeration
      ] = await Promise.all([
        // User statistics
        c.env.DB.prepare(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
            COUNT(CASE WHEN is_dealer = 1 THEN 1 END) as dealers,
            COUNT(CASE WHEN is_suspended = 1 THEN 1 END) as suspended_users,
            COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_today
          FROM users
        `).first(),

        // Car statistics
        c.env.DB.prepare(`
          SELECT 
            COUNT(*) as total_cars,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_cars,
            COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_cars,
            COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending_moderation,
            COUNT(CASE WHEN is_flagged = 1 THEN 1 END) as flagged_cars,
            COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_today,
            AVG(price / 100.0) as avg_price
          FROM cars
        `).first(),

        // Message statistics
        c.env.DB.prepare(`
          SELECT 
            COUNT(*) as total_messages,
            COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_today,
            COUNT(DISTINCT sender_id) as active_senders,
            COUNT(DISTINCT recipient_id) as active_recipients
          FROM messages
        `).first(),

        // Today's activity
        c.env.DB.prepare(`
          SELECT 
            'user' as type, COUNT(*) as count, 'New Users' as label
          FROM users WHERE DATE(created_at) = DATE('now')
          UNION ALL
          SELECT 
            'car' as type, COUNT(*) as count, 'New Listings' as label
          FROM cars WHERE DATE(created_at) = DATE('now')
          UNION ALL
          SELECT 
            'message' as type, COUNT(*) as count, 'New Messages' as label
          FROM messages WHERE DATE(created_at) = DATE('now')
        `).all(),

        // Recent admin activity
        c.env.DB.prepare(`
          SELECT 
            al.*,
            u.full_name as admin_name
          FROM admin_logs al
          JOIN users u ON al.admin_id = u.id
          ORDER BY al.created_at DESC
          LIMIT 10
        `).all(),

        // Pending reports
        c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM user_reports WHERE status = 'open'
        `).first(),

        // Pending moderation
        c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM cars WHERE moderation_status = 'pending'
        `).first()
      ])

      return c.json<ApiResponse>({
        success: true,
        data: {
          userStats,
          carStats,
          messageStats,
          todayStats: todayStats.results || [],
          recentActivity: recentActivity.results || [],
          pendingReports: pendingReports?.count || 0,
          pendingModeration: pendingModeration?.count || 0,
          timestamp: new Date().toISOString()
        }
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: {
        userStats: { total_users: 156, verified_users: 142, dealers: 12, suspended_users: 2, new_today: 3 },
        carStats: { total_cars: 89, active_cars: 76, sold_cars: 13, pending_moderation: 5, flagged_cars: 2, new_today: 7, avg_price: 15750 },
        messageStats: { total_messages: 324, new_today: 18, active_senders: 45, active_recipients: 38 },
        todayStats: [
          { type: 'user', count: 3, label: 'New Users' },
          { type: 'car', count: 7, label: 'New Listings' },
          { type: 'message', count: 18, label: 'New Messages' }
        ],
        recentActivity: [],
        pendingReports: 3,
        pendingModeration: 5
      }
    })

  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to load dashboard data'
    }, 500)
  }
})

// User management - list users with filters
admin.get('/users', requireAdmin, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const search = c.req.query('search') || ''
    const status = c.req.query('status') || '' // 'verified', 'unverified', 'suspended', 'dealer'
    const sortBy = c.req.query('sortBy') || 'created_at'
    const sortOrder = c.req.query('sortOrder') || 'DESC'
    
    const offset = (page - 1) * limit

    if (c.env.DB) {
      let whereClause = 'WHERE 1=1'
      const params: any[] = []

      if (search) {
        whereClause += ' AND (u.email LIKE ? OR u.full_name LIKE ? OR u.location LIKE ?)'
        const searchTerm = `%${search}%`
        params.push(searchTerm, searchTerm, searchTerm)
      }

      if (status === 'verified') whereClause += ' AND u.is_verified = 1'
      if (status === 'unverified') whereClause += ' AND u.is_verified = 0'
      if (status === 'suspended') whereClause += ' AND u.is_suspended = 1'
      if (status === 'dealer') whereClause += ' AND u.is_dealer = 1'
      if (status === 'admin') whereClause += ' AND u.is_admin = 1'

      const validSortColumns = ['created_at', 'email', 'full_name', 'last_login_at']
      const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
      const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

      const [users, totalCount] = await Promise.all([
        c.env.DB.prepare(`
          SELECT 
            u.*,
            COUNT(c.id) as car_count,
            COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_cars,
            COUNT(m.id) as message_count
          FROM users u
          LEFT JOIN cars c ON u.id = c.user_id
          LEFT JOIN messages m ON u.id = m.sender_id
          ${whereClause}
          GROUP BY u.id
          ORDER BY u.${safeSort} ${safeOrder}
          LIMIT ? OFFSET ?
        `).bind(...params, limit, offset).all(),

        c.env.DB.prepare(`
          SELECT COUNT(*) as total FROM users u ${whereClause}
        `).bind(...params).first()
      ])

      await logAdminAction(c, 'view_users', 'system', null, `Page ${page}, Filters: ${status || 'none'}`)

      return c.json<ApiResponse>({
        success: true,
        data: {
          users: users.results || [],
          pagination: {
            page,
            limit,
            total: totalCount?.total || 0,
            pages: Math.ceil((totalCount?.total || 0) / limit)
          }
        }
      })
    }

    // Mock data for development
    return c.json<ApiResponse>({
      success: true,
      data: {
        users: [
          {
            id: 1,
            email: 'john.smith@wightcars.com',
            full_name: 'John Smith',
            location: 'Newport',
            is_verified: 1,
            is_dealer: 0,
            is_admin: 1,
            is_suspended: 0,
            car_count: 2,
            active_cars: 2,
            message_count: 5,
            created_at: '2024-08-01T10:00:00Z'
          }
        ],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 }
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to load users'
    }, 500)
  }
})

// User actions - verify, suspend, promote
admin.post('/users/:userId/verify', requireAdmin, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    const { notes } = await c.req.json()

    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET is_verified = 1, verification_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(notes || null, userId).run()

      await logAdminAction(c, 'verify_user', 'user', userId, notes)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { message: 'User verified successfully' }
    })

  } catch (error) {
    console.error('Error verifying user:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to verify user'
    }, 500)
  }
})

admin.post('/users/:userId/suspend', requireAdmin, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    const { reason, duration } = await c.req.json() // duration in days, null for permanent

    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET is_suspended = 1, suspension_reason = ?, suspended_at = CURRENT_TIMESTAMP, 
            suspended_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(reason, c.get('userId'), userId).run()

      // Deactivate user's car listings
      await c.env.DB.prepare(`
        UPDATE cars SET status = 'withdrawn' WHERE user_id = ? AND status = 'active'
      `).bind(userId).run()

      await logAdminAction(c, 'suspend_user', 'user', userId, `Reason: ${reason}${duration ? `, Duration: ${duration} days` : ', Permanent'}`)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { message: 'User suspended successfully' }
    })

  } catch (error) {
    console.error('Error suspending user:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to suspend user'
    }, 500)
  }
})

admin.post('/users/:userId/unsuspend', requireAdmin, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))

    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET is_suspended = 0, suspension_reason = NULL, suspended_at = NULL, 
            suspended_by = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(userId).run()

      await logAdminAction(c, 'unsuspend_user', 'user', userId)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { message: 'User unsuspended successfully' }
    })

  } catch (error) {
    console.error('Error unsuspending user:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to unsuspend user'
    }, 500)
  }
})

// Car moderation - list cars needing moderation
admin.get('/moderation/cars', requireAdmin, async (c) => {
  try {
    const status = c.req.query('status') || 'pending'
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    if (c.env.DB) {
      const [cars, totalCount] = await Promise.all([
        c.env.DB.prepare(`
          SELECT 
            c.*,
            u.full_name as seller_name,
            u.email as seller_email,
            u.is_verified as seller_verified,
            u.is_dealer as seller_is_dealer
          FROM cars c
          JOIN users u ON c.user_id = u.id
          WHERE c.moderation_status = ?
          ORDER BY c.created_at ASC
          LIMIT ? OFFSET ?
        `).bind(status, limit, offset).all(),

        c.env.DB.prepare(`
          SELECT COUNT(*) as total FROM cars WHERE moderation_status = ?
        `).bind(status).first()
      ])

      return c.json<ApiResponse>({
        success: true,
        data: {
          cars: cars.results || [],
          pagination: {
            page,
            limit,
            total: totalCount?.total || 0,
            pages: Math.ceil((totalCount?.total || 0) / limit)
          }
        }
      })
    }

    return c.json<ApiResponse>({ success: true, data: { cars: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } } })

  } catch (error) {
    console.error('Error fetching cars for moderation:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to load cars for moderation'
    }, 500)
  }
})

// Moderate car listing
admin.post('/moderation/cars/:carId/:action', requireAdmin, async (c) => {
  try {
    const carId = parseInt(c.req.param('carId'))
    const action = c.req.param('action') // 'approve', 'reject', 'flag'
    const { notes } = await c.req.json()

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid moderation action'
      }, 400)
    }

    if (c.env.DB) {
      let newStatus = action === 'approve' ? 'approved' : 'rejected'
      if (action === 'flag') {
        newStatus = 'flagged'
      }

      await c.env.DB.prepare(`
        UPDATE cars 
        SET moderation_status = ?, moderated_by = ?, moderated_at = CURRENT_TIMESTAMP,
            moderation_notes = ?, is_flagged = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newStatus, c.get('userId'), notes, action === 'flag' ? 1 : 0, carId).run()

      // If rejected or flagged, set status to withdrawn
      if (action === 'reject' || action === 'flag') {
        await c.env.DB.prepare(`
          UPDATE cars SET status = 'withdrawn' WHERE id = ?
        `).bind(carId).run()
      }

      await logAdminAction(c, `moderate_car_${action}`, 'car', carId, notes)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { message: `Car listing ${action}ed successfully` }
    })

  } catch (error) {
    console.error('Error moderating car:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to moderate car listing'
    }, 500)
  }
})

// Reports management
admin.get('/reports', requireAdmin, async (c) => {
  try {
    const status = c.req.query('status') || 'open'
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = (page - 1) * limit

    if (c.env.DB) {
      const [reports, totalCount] = await Promise.all([
        c.env.DB.prepare(`
          SELECT 
            r.*,
            u1.full_name as reporter_name,
            u1.email as reporter_email,
            u2.full_name as reported_user_name,
            u2.email as reported_user_email,
            c.title as reported_car_title,
            u3.full_name as assigned_admin_name
          FROM user_reports r
          JOIN users u1 ON r.reporter_id = u1.id
          LEFT JOIN users u2 ON r.reported_user_id = u2.id
          LEFT JOIN cars c ON r.reported_car_id = c.id
          LEFT JOIN users u3 ON r.assigned_to = u3.id
          WHERE r.status = ?
          ORDER BY r.created_at DESC
          LIMIT ? OFFSET ?
        `).bind(status, limit, offset).all(),

        c.env.DB.prepare(`
          SELECT COUNT(*) as total FROM user_reports WHERE status = ?
        `).bind(status).first()
      ])

      return c.json<ApiResponse>({
        success: true,
        data: {
          reports: reports.results || [],
          pagination: {
            page,
            limit,
            total: totalCount?.total || 0,
            pages: Math.ceil((totalCount?.total || 0) / limit)
          }
        }
      })
    }

    return c.json<ApiResponse>({ success: true, data: { reports: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } } })

  } catch (error) {
    console.error('Error fetching reports:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to load reports'
    }, 500)
  }
})

// Analytics - get detailed site analytics
admin.get('/analytics', requireAdmin, async (c) => {
  try {
    const period = c.req.query('period') || '30' // days
    const periodDays = parseInt(period)

    if (c.env.DB) {
      const [
        userGrowth,
        carStats,
        popularMakes,
        priceRanges,
        locationStats
      ] = await Promise.all([
        // User growth over time
        c.env.DB.prepare(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_users
          FROM users 
          WHERE DATE(created_at) >= DATE('now', '-${periodDays} days')
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all(),

        // Car listing stats
        c.env.DB.prepare(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_listings,
            COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_count,
            AVG(price / 100.0) as avg_price
          FROM cars
          WHERE DATE(created_at) >= DATE('now', '-${periodDays} days')
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all(),

        // Popular car makes
        c.env.DB.prepare(`
          SELECT 
            make,
            COUNT(*) as count,
            AVG(price / 100.0) as avg_price
          FROM cars
          WHERE DATE(created_at) >= DATE('now', '-${periodDays} days')
          GROUP BY make
          ORDER BY count DESC
          LIMIT 10
        `).all(),

        // Price ranges
        c.env.DB.prepare(`
          SELECT 
            CASE 
              WHEN price < 500000 THEN 'Under £5,000'
              WHEN price < 1000000 THEN '£5,000 - £10,000'
              WHEN price < 2000000 THEN '£10,000 - £20,000'
              WHEN price < 3000000 THEN '£20,000 - £30,000'
              ELSE 'Over £30,000'
            END as price_range,
            COUNT(*) as count
          FROM cars
          WHERE DATE(created_at) >= DATE('now', '-${periodDays} days')
          GROUP BY price_range
          ORDER BY MIN(price)
        `).all(),

        // Location statistics
        c.env.DB.prepare(`
          SELECT 
            location,
            COUNT(*) as user_count
          FROM users
          WHERE location IS NOT NULL AND location != ''
          GROUP BY location
          ORDER BY user_count DESC
          LIMIT 10
        `).all()
      ])

      return c.json<ApiResponse>({
        success: true,
        data: {
          userGrowth: userGrowth.results || [],
          carStats: carStats.results || [],
          popularMakes: popularMakes.results || [],
          priceRanges: priceRanges.results || [],
          locationStats: locationStats.results || [],
          period: periodDays
        }
      })
    }

    return c.json<ApiResponse>({ success: true, data: { period: periodDays } })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to load analytics'
    }, 500)
  }
})

// Site settings management
admin.get('/settings', requireAdmin, async (c) => {
  try {
    if (c.env.DB) {
      const settings = await c.env.DB.prepare(`
        SELECT * FROM site_settings ORDER BY setting_key
      `).all()

      return c.json<ApiResponse>({
        success: true,
        data: settings.results || []
      })
    }

    return c.json<ApiResponse>({ success: true, data: [] })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to load settings'
    }, 500)
  }
})

admin.put('/settings/:key', requireAdmin, async (c) => {
  try {
    const key = c.req.param('key')
    const { value } = await c.req.json()

    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE site_settings 
        SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `).bind(value, c.get('userId'), key).run()

      await logAdminAction(c, 'update_setting', 'system', null, `${key}: ${value}`)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { message: 'Setting updated successfully' }
    })

  } catch (error) {
    console.error('Error updating setting:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Failed to update setting'
    }, 500)
  }
})

export default admin