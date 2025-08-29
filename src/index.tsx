import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { CloudflareBindings } from './types'
import { renderer } from './renderer'

// Import API routes
import auth from './routes/auth'
import cars from './routes/cars'
import messages from './routes/messages'
import users from './routes/users'
import images from './routes/images'
import admin from './routes/admin'

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
app.route('/api/users', users)
app.route('/api/images', images)
app.route('/api/admin', admin)

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
              
              <form id="filters-form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Make</label>
                  <select name="make" class="car-make-select w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Any Make</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <select name="model" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Any Model</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <div class="grid grid-cols-2 gap-2">
                    <select name="min_price" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Min Price</option>
                      <option value="500000">£5,000</option>
                      <option value="1000000">£10,000</option>
                      <option value="1500000">£15,000</option>
                      <option value="2000000">£20,000</option>
                      <option value="3000000">£30,000</option>
                    </select>
                    <select name="max_price" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Max Price</option>
                      <option value="1000000">£10,000</option>
                      <option value="2000000">£20,000</option>
                      <option value="3000000">£30,000</option>
                      <option value="5000000">£50,000</option>
                      <option value="10000000">£100,000</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Year Range</label>
                  <div class="grid grid-cols-2 gap-2">
                    <select name="min_year" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Min Year</option>
                      <option value="2020">2020+</option>
                      <option value="2018">2018+</option>
                      <option value="2016">2016+</option>
                      <option value="2014">2014+</option>
                      <option value="2010">2010+</option>
                    </select>
                    <select name="max_year" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Max Year</option>
                      <option value="2024">2024</option>
                      <option value="2022">2022</option>
                      <option value="2020">2020</option>
                      <option value="2018">2018</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                  <select name="fuel_type" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Any Fuel</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
                  <select name="transmission" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Any Transmission</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select name="location" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select name="sort_by" class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="created_desc">Newest First</option>
                    <option value="created_asc">Oldest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="year_desc">Year: Newest First</option>
                    <option value="year_asc">Year: Oldest First</option>
                  </select>
                </div>
                
                <button type="button" onclick="applyFilters()" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium">
                  <i class="fas fa-search mr-2"></i>
                  Apply Filters
                </button>
                
                <button type="button" onclick="clearFilters()" class="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200 font-medium">
                  <i class="fas fa-times mr-2"></i>
                  Clear Filters
                </button>
              </form>
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

// Car Details Page
app.get('/car/:id', async (c) => {
  const carId = c.req.param('id')
  
  return c.render(
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        {/* Car details will be loaded by JavaScript */}
        <div id="car-details-container" data-car-id={carId}>
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">Loading car details...</p>
          </div>
        </div>
      </div>
    </div>
  )
})

// User Dashboard
app.get('/dashboard', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div class="lg:w-1/4">
            <div class="bg-white rounded-lg shadow-md p-6">
              <div id="dashboard-user-info" class="text-center mb-6">
                <div class="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <i class="fas fa-user text-2xl text-gray-600"></i>
                </div>
                <h3 class="font-semibold text-lg" id="dashboard-user-name">Loading...</h3>
                <p class="text-gray-600 text-sm" id="dashboard-user-email">Loading...</p>
              </div>
              
              <nav class="space-y-2">
                <a href="#overview" class="dashboard-nav-item active flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg">
                  <i class="fas fa-tachometer-alt mr-3"></i>
                  Overview
                </a>
                <a href="#listings" class="dashboard-nav-item flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <i class="fas fa-car mr-3"></i>
                  My Listings
                </a>
                <a href="#messages" class="dashboard-nav-item flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <i class="fas fa-envelope mr-3"></i>
                  Messages
                  <span id="unread-count" class="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full hidden">0</span>
                </a>
                <a href="#saved" class="dashboard-nav-item flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <i class="fas fa-heart mr-3"></i>
                  Saved Cars
                </a>
                <a href="#profile" class="dashboard-nav-item flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  <i class="fas fa-user-cog mr-3"></i>
                  Profile Settings
                </a>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div class="lg:w-3/4">
            <div id="dashboard-content">
              {/* Content will be loaded by JavaScript based on selected tab */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Sell Car Page  
app.get('/sell', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="bg-blue-600 text-white p-6">
              <h1 class="text-2xl font-bold">Sell Your Car</h1>
              <p class="mt-2">List your car on WightCars and reach thousands of potential buyers on the Isle of Wight</p>
            </div>
            
            <div id="sell-car-form-container" class="p-6">
              {/* Form will be generated by JavaScript */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Messages Page
app.get('/messages', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">Messages</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-md">
              <div class="p-4 border-b">
                <h2 class="text-lg font-semibold">Conversations</h2>
              </div>
              <div id="conversations-list" class="divide-y">
                {/* Conversations will be loaded by JavaScript */}
              </div>
            </div>
          </div>
          
          {/* Message Thread */}
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-md h-96">
              <div id="message-thread">
                <div class="flex items-center justify-center h-full text-gray-500">
                  <div class="text-center">
                    <i class="fas fa-comments text-4xl mb-4"></i>
                    <p>Select a conversation to view messages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Saved Cars Page
app.get('/saved', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">
          <i class="fas fa-heart mr-3 text-red-500"></i>
          Saved Cars
        </h1>
        
        <div id="saved-cars-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Saved cars will be loaded by JavaScript */}
        </div>
      </div>
    </div>
  )
})

// Advanced Search Page
app.get('/search', (c) => {
  return c.render(
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-8">Advanced Search</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Advanced Filters */}
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold mb-4">Search Filters</h2>
              <div id="advanced-search-form">
                {/* Advanced search form will be generated by JavaScript */}
              </div>
            </div>
          </div>
          
          {/* Search Results */}
          <div class="lg:col-span-3">
            <div id="search-results">
              {/* Search results will be loaded by JavaScript */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// User Profile Page (public)
app.get('/profile/:id', async (c) => {
  const userId = c.req.param('id')
  
  return c.render(
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <div id="user-profile-container" data-user-id={userId}>
          {/* User profile will be loaded by JavaScript */}
        </div>
      </div>
    </div>
  )
})

// Enhanced Admin Panel (protected route)
app.get('/admin', (c) => {
  return c.render(
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Admin Header */}
      <div class="bg-white shadow-sm border-b border-gray-200">
        <div class="container mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="bg-red-100 rounded-lg p-2">
                <i class="fas fa-shield-alt text-red-600 text-xl"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">WightCars Admin</h1>
                <p class="text-sm text-gray-600">System Administration Dashboard</p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div id="admin-alerts" class="hidden">
                <div class="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-md text-sm">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  <span id="alert-count">0</span> items need attention
                </div>
              </div>
              <div class="text-sm text-gray-500">
                Last updated: <span id="last-updated">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row gap-6">
          {/* Enhanced Admin Sidebar */}
          <div class="lg:w-64 flex-shrink-0">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
                <h2 class="font-semibold text-lg">Navigation</h2>
              </div>
              
              <nav class="p-4 space-y-1">
                <a href="#dashboard" class="admin-nav-item active flex items-center px-3 py-2.5 text-red-600 bg-red-50 rounded-lg font-medium transition-colors">
                  <i class="fas fa-chart-line mr-3 text-sm"></i>
                  Dashboard
                  <div class="ml-auto">
                    <span class="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">Live</span>
                  </div>
                </a>
                
                <a href="#users" class="admin-nav-item flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors">
                  <i class="fas fa-users mr-3 text-sm"></i>
                  User Management
                  <span class="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full" id="users-count">0</span>
                </a>
                
                <a href="#moderation" class="admin-nav-item flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors">
                  <i class="fas fa-gavel mr-3 text-sm"></i>
                  Listing Moderation
                  <span class="ml-auto bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full" id="moderation-count">0</span>
                </a>
                
                <a href="#reports" class="admin-nav-item flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors">
                  <i class="fas fa-flag mr-3 text-sm"></i>
                  Reports & Flags
                  <span class="ml-auto bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full" id="reports-count">0</span>
                </a>
                
                <a href="#analytics" class="admin-nav-item flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors">
                  <i class="fas fa-chart-bar mr-3 text-sm"></i>
                  Analytics & Insights
                </a>
                
                <a href="#settings" class="admin-nav-item flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors">
                  <i class="fas fa-cogs mr-3 text-sm"></i>
                  Site Settings
                </a>
                
                <div class="border-t border-gray-200 my-3 pt-3">
                  <a href="#logs" class="admin-nav-item flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors">
                    <i class="fas fa-clipboard-list mr-3 text-sm"></i>
                    Activity Logs
                  </a>
                  
                  <a href="/dashboard" class="flex items-center px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors">
                    <i class="fas fa-arrow-left mr-3 text-sm"></i>
                    Back to Site
                  </a>
                </div>
              </nav>
            </div>

            {/* Quick Stats Sidebar */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 overflow-hidden">
              <div class="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h3 class="font-semibold">Quick Stats</h3>
              </div>
              <div class="p-4 space-y-3" id="quick-stats">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Users Online</span>
                  <span class="font-semibold text-green-600">--</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Today's Listings</span>
                  <span class="font-semibold text-blue-600">--</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Pending Actions</span>
                  <span class="font-semibold text-red-600">--</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Admin Content Area */}
          <div class="flex-1 min-w-0">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
              <div id="admin-content" class="p-6">
                {/* Enhanced admin content will be loaded by JavaScript */}
                <div class="flex items-center justify-center h-96">
                  <div class="text-center">
                    <div class="animate-pulse">
                      <div class="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                      <div class="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                      <div class="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default app
