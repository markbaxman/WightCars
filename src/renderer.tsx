import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>WightCars - Isle of Wight Car Marketplace</title>
        <meta name="description" content="Find and sell cars on the Isle of Wight. The Island's premier car marketplace with verified local sellers and buyers." />
        <meta name="keywords" content="Isle of Wight cars, car sales, buy car, sell car, Island marketplace, IOW cars" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* Font Awesome Icons */}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Custom Styles */}
        <link href="/static/styles.css" rel="stylesheet" />
        
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/static/favicon.ico" />
        
        {/* Open Graph tags for social media */}
        <meta property="og:title" content="WightCars - Isle of Wight Car Marketplace" />
        <meta property="og:description" content="Find and sell cars on the Isle of Wight. The Island's premier car marketplace." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/static/images/wightcars-og.jpg" />
        
        {/* Tailwind Config - Custom classes defined in CSS instead */}
      </head>
      <body class="font-sans antialiased">
        {/* Navigation Bar */}
        <nav id="navbar" class="bg-white shadow-lg sticky top-0 z-50">
          <div class="container mx-auto px-4">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center space-x-4">
                <a href="/" class="flex items-center space-x-2 text-xl font-bold text-blue-600">
                  <i class="fas fa-car"></i>
                  <span>WightCars</span>
                </a>
              </div>
              
              <div class="hidden md:flex items-center space-x-6">
                <a href="/browse" class="text-gray-700 hover:text-blue-600 transition duration-200">
                  <i class="fas fa-search mr-1"></i>
                  Browse Cars
                </a>
                <a href="/sell" class="text-gray-700 hover:text-blue-600 transition duration-200">
                  <i class="fas fa-plus mr-1"></i>
                  Sell Car
                </a>
                <div id="nav-user-menu" class="hidden">
                  <div class="relative">
                    <button id="user-menu-button" class="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                      <i class="fas fa-user"></i>
                      <span id="user-name">Account</span>
                      <i class="fas fa-chevron-down text-xs"></i>
                    </button>
                    <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <a href="/dashboard" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                      </a>
                      <a href="/messages" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-envelope mr-2"></i>Messages
                      </a>
                      <a href="/saved" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-heart mr-2"></i>Saved Cars
                      </a>
                      <div class="border-t border-gray-100"></div>
                      <button id="logout-btn" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <i class="fas fa-sign-out-alt mr-2"></i>Sign Out
                      </button>
                    </div>
                  </div>
                </div>
                <div id="nav-auth-buttons" class="flex items-center space-x-4">
                  <a href="/login" class="text-gray-700 hover:text-blue-600 transition duration-200">
                    <i class="fas fa-sign-in-alt mr-1"></i>
                    Sign In
                  </a>
                  <a href="/register" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                    <i class="fas fa-user-plus mr-1"></i>
                    Register
                  </a>
                </div>
              </div>
              
              {/* Mobile menu button */}
              <div class="md:hidden">
                <button id="mobile-menu-btn" class="text-gray-700 hover:text-blue-600">
                  <i class="fas fa-bars text-xl"></i>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu */}
          <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
            <div class="px-2 pt-2 pb-3 space-y-1">
              <a href="/browse" class="block px-3 py-2 text-gray-700 hover:text-blue-600">Browse Cars</a>
              <a href="/sell" class="block px-3 py-2 text-gray-700 hover:text-blue-600">Sell Car</a>
              <a href="/login" class="block px-3 py-2 text-gray-700 hover:text-blue-600">Sign In</a>
              <a href="/register" class="block px-3 py-2 text-gray-700 hover:text-blue-600">Register</a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* JavaScript Libraries */}
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        
        {/* Main Application JavaScript */}
        <script src="/static/app.js"></script>
      </body>
    </html>
  )
})
