import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { CloudflareBindings } from './types'
import { renderer } from './renderer'

// Import API routes
import auth from './routes/auth'
import cars from './routes/cars'
import messages from './routes/messages'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Use renderer for HTML responses
app.use(renderer)

// Mount API routes
app.route('/api/auth', auth)
app.route('/api/cars', cars)
app.route('/api/messages', messages)

// API health check
app.get('/api/health', async (c) => {
  try {
    // Test database connection
    const result = await c.env.DB.prepare('SELECT 1 as test').first()
    
    return c.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: c.env.ENVIRONMENT || 'development',
      database: result ? 'connected' : 'disconnected'
    })
  } catch (error) {
    return c.json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Homepage
app.get('/', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div class="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div class="absolute inset-0 bg-black opacity-20"></div>
        <div class="relative container mx-auto px-4 py-20">
          <div class="text-center">
            <h1 class="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect Car on the 
              <span class="text-yellow-400"> Isle of Wight</span>
            </h1>
            <p class="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              The Island's premier car marketplace. Buy and sell cars locally with confidence.
            </p>
            
            {/* Quick Search */}
            <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 text-gray-800">
              <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Make</label>
                  <select id="search-make" name="make" class="car-make-select w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Any Make</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Model</label>
                  <select id="search-model" name="model" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Any Model</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Price Range</label>
                  <select name="price" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Any Price</option>
                    <option value="0-5000">Under £5,000</option>
                    <option value="5000-10000">£5,000 - £10,000</option>
                    <option value="10000-20000">£10,000 - £20,000</option>
                    <option value="20000-30000">£20,000 - £30,000</option>
                    <option value="30000+">£30,000+</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">Location</label>
                  <select name="location" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Anywhere on Island</option>
                    <option value="newport">Newport</option>
                    <option value="cowes">Cowes</option>
                    <option value="east cowes">East Cowes</option>
                    <option value="ryde">Ryde</option>
                    <option value="sandown">Sandown</option>
                    <option value="shanklin">Shanklin</option>
                    <option value="ventnor">Ventnor</option>
                    <option value="freshwater">Freshwater</option>
                    <option value="yarmouth">Yarmouth</option>
                    <option value="bembridge">Bembridge</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">&nbsp;</label>
                  <button 
                    onclick="searchCars()" 
                    class="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
                  >
                    <i class="fas fa-search mr-2"></i>
                    Search Cars
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose WightCars?
            </h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              The most trusted way to buy and sell cars on the Isle of Wight
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="text-center p-6">
              <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-map-marker-alt text-2xl text-blue-600"></i>
              </div>
              <h3 class="text-xl font-semibold mb-2">Local Island Focus</h3>
              <p class="text-gray-600">
                Exclusively for Isle of Wight residents. No off-island dealers or scams.
              </p>
            </div>
            
            <div class="text-center p-6">
              <div class="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-shield-alt text-2xl text-green-600"></i>
              </div>
              <h3 class="text-xl font-semibold mb-2">Verified Sellers</h3>
              <p class="text-gray-600">
                All sellers are verified with local addresses and contact details.
              </p>
            </div>
            
            <div class="text-center p-6">
              <div class="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-comments text-2xl text-purple-600"></i>
              </div>
              <h3 class="text-xl font-semibold mb-2">Direct Messaging</h3>
              <p class="text-gray-600">
                Contact sellers directly through our secure messaging system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Cars */}
      <div class="py-16 bg-gray-50">
        <div class="container mx-auto px-4">
          <div class="text-center mb-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Featured Cars
            </h2>
            <p class="text-xl text-gray-600">
              Handpicked quality vehicles from trusted Island sellers
            </p>
          </div>
          
          <div id="featured-cars" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Featured cars will be loaded here by JavaScript */}
            <div class="text-center py-8">
              <i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4"></i>
              <p class="text-gray-500">Loading featured cars...</p>
            </div>
          </div>
          
          <div class="text-center mt-12">
            <a 
              href="/browse" 
              class="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              <i class="fas fa-car mr-2"></i>
              Browse All Cars
            </a>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div class="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">
            Ready to Sell Your Car?
          </h2>
          <p class="text-xl mb-8 max-w-2xl mx-auto">
            List your car for free and reach thousands of potential buyers on the Isle of Wight
          </p>
          <div class="space-x-4">
            <a 
              href="/sell" 
              class="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition duration-200 font-medium"
            >
              <i class="fas fa-plus mr-2"></i>
              List Your Car Free
            </a>
            <a 
              href="/login" 
              class="inline-flex items-center border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition duration-200 font-medium"
            >
              <i class="fas fa-user mr-2"></i>
              Sign In
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer class="bg-gray-800 text-white py-12">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 class="text-xl font-bold mb-4">
                <i class="fas fa-car text-blue-400 mr-2"></i>
                WightCars
              </h3>
              <p class="text-gray-400 mb-4">
                The Isle of Wight's premier car marketplace. Connecting local buyers and sellers since 2024.
              </p>
              <div class="flex space-x-4">
                <a href="#" class="text-gray-400 hover:text-white">
                  <i class="fab fa-facebook-f"></i>
                </a>
                <a href="#" class="text-gray-400 hover:text-white">
                  <i class="fab fa-twitter"></i>
                </a>
                <a href="#" class="text-gray-400 hover:text-white">
                  <i class="fab fa-instagram"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 class="text-lg font-semibold mb-4">For Buyers</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="/browse" class="hover:text-white">Browse Cars</a></li>
                <li><a href="/search" class="hover:text-white">Advanced Search</a></li>
                <li><a href="/finance" class="hover:text-white">Finance Options</a></li>
                <li><a href="/insurance" class="hover:text-white">Insurance Quotes</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="text-lg font-semibold mb-4">For Sellers</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="/sell" class="hover:text-white">Sell Your Car</a></li>
                <li><a href="/pricing" class="hover:text-white">Pricing Guide</a></li>
                <li><a href="/tips" class="hover:text-white">Selling Tips</a></li>
                <li><a href="/dealer" class="hover:text-white">Dealer Accounts</a></li>
              </ul>
            </div>
            
            <div>
              <h4 class="text-lg font-semibold mb-4">Support</h4>
              <ul class="space-y-2 text-gray-400">
                <li><a href="/contact" class="hover:text-white">Contact Us</a></li>
                <li><a href="/help" class="hover:text-white">Help Center</a></li>
                <li><a href="/safety" class="hover:text-white">Safety Tips</a></li>
                <li><a href="/terms" class="hover:text-white">Terms & Conditions</a></li>
              </ul>
            </div>
          </div>
          
          <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 WightCars. All rights reserved. Made with ❤️ on the Isle of Wight.</p>
          </div>
        </div>
      </footer>
    </div>
  )
})

// Browse cars page
app.get('/browse', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50">
      {/* Header with navigation will be added */}
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">Browse Cars</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold mb-4">Filters</h2>
              {/* Filter form will be populated by JavaScript */}
              <div id="filters-form">
                <p class="text-gray-500">Loading filters...</p>
              </div>
            </div>
          </div>
          
          {/* Results */}
          <div class="lg:col-span-3">
            <div id="cars-grid" class="space-y-6">
              {/* Cars will be loaded here by JavaScript */}
              <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">Loading cars...</p>
              </div>
            </div>
            
            {/* Pagination */}
            <div id="pagination" class="mt-8">
              {/* Pagination will be added by JavaScript */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Login page
app.get('/login', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <i class="fas fa-car text-4xl text-blue-600 mb-4"></i>
          <h2 class="text-3xl font-bold text-gray-900">Sign in to WightCars</h2>
          <p class="mt-2 text-gray-600">Welcome back to the Island's car marketplace</p>
        </div>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form id="login-form" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div class="mt-1">
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autocomplete="email" 
                  required 
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div class="mt-1">
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autocomplete="current-password" 
                  required 
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i class="fas fa-sign-in-alt mr-2"></i>
                Sign in
              </button>
            </div>
          </form>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div class="mt-6">
              <a 
                href="/register" 
                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i class="fas fa-user-plus mr-2"></i>
                Create new account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Register page
app.get('/register', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="text-center">
          <i class="fas fa-car text-4xl text-blue-600 mb-4"></i>
          <h2 class="text-3xl font-bold text-gray-900">Join WightCars</h2>
          <p class="mt-2 text-gray-600">Start buying and selling cars on the Island</p>
        </div>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form id="register-form" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="full_name" class="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input 
                  id="full_name" 
                  name="full_name" 
                  type="text" 
                  required 
                  class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                autocomplete="email" 
                required 
                class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label for="location" class="block text-sm font-medium text-gray-700">
                Location on Island
              </label>
              <select 
                id="location" 
                name="location" 
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your area</option>
                <option value="Newport">Newport</option>
                <option value="Cowes">Cowes</option>
                <option value="East Cowes">East Cowes</option>
                <option value="Ryde">Ryde</option>
                <option value="Sandown">Sandown</option>
                <option value="Shanklin">Shanklin</option>
                <option value="Ventnor">Ventnor</option>
                <option value="Freshwater">Freshwater</option>
                <option value="Yarmouth">Yarmouth</option>
                <option value="Bembridge">Bembridge</option>
              </select>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                autocomplete="new-password" 
                required 
                class="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p class="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <div class="flex items-center">
              <input 
                id="is_dealer" 
                name="is_dealer" 
                type="checkbox" 
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="is_dealer" class="ml-2 block text-sm text-gray-900">
                I am a car dealer
              </label>
            </div>

            <div>
              <button 
                type="submit" 
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <i class="fas fa-user-plus mr-2"></i>
                Create Account
              </button>
            </div>
          </form>

          <div class="mt-6 text-center">
            <span class="text-sm text-gray-500">Already have an account? </span>
            <a href="/login" class="text-sm text-blue-600 hover:text-blue-500">
              Sign in here
            </a>
          </div>
        </div>
      </div>
    </div>
  )
})

export default app
