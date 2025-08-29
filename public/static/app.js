// WightCars Frontend JavaScript
// Main application logic for the Isle of Wight car marketplace

// Global state management
const AppState = {
  user: null,
  token: localStorage.getItem('wightcars_token'),
  cars: [],
  featuredCars: [],
  loading: false
};

// API Configuration
const API_BASE = '/api';

// Axios defaults
axios.defaults.baseURL = API_BASE;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add token to requests if available
if (AppState.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${AppState.token}`;
}

// Utility Functions
const Utils = {
  // Format price in pounds
  formatPrice(priceInPence) {
    if (!priceInPence) return 'POA';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(priceInPence / 100);
  },

  // Format date
  formatDate(dateString) {
    return dayjs(dateString).format('DD/MM/YYYY');
  },

  // Format relative time
  formatRelativeTime(dateString) {
    return dayjs(dateString).fromNow();
  },

  // Format number with commas
  formatNumber(num) {
    if (!num) return '0';
    return new Intl.NumberFormat('en-GB').format(num);
  },

  // Truncate text
  truncate(text, length = 100) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  // Show loading state
  showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">Loading...</p>
        </div>
      `;
    }
  },

  // Show error message
  showError(elementId, message = 'Something went wrong') {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-4"></i>
          <p class="text-red-600">${message}</p>
        </div>
      `;
    }
  },

  // Show toast notification
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };
    
    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
};

// Authentication Functions
const Auth = {
  async login(email, password) {
    try {
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.success) {
        AppState.user = response.data.data.user;
        AppState.token = response.data.data.token;
        
        localStorage.setItem('wightcars_token', AppState.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${AppState.token}`;
        
        Utils.showToast('Welcome back!', 'success');
        this.updateNavigation();
        
        // Redirect to homepage after login
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        
        return true;
      }
      
      throw new Error(response.data.error || 'Login failed');
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      Utils.showToast(message, 'error');
      return false;
    }
  },

  async register(userData) {
    try {
      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        AppState.user = response.data.data.user;
        AppState.token = response.data.data.token;
        
        localStorage.setItem('wightcars_token', AppState.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${AppState.token}`;
        
        Utils.showToast('Account created successfully!', 'success');
        this.updateNavigation();
        
        // Redirect to homepage after registration
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
        
        return true;
      }
      
      throw new Error(response.data.error || 'Registration failed');
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      Utils.showToast(message, 'error');
      return false;
    }
  },

  async logout() {
    AppState.user = null;
    AppState.token = null;
    
    localStorage.removeItem('wightcars_token');
    delete axios.defaults.headers.common['Authorization'];
    
    this.updateNavigation();
    Utils.showToast('Logged out successfully', 'info');
    
    // Redirect to homepage
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  },

  async checkAuth() {
    if (!AppState.token) return false;
    
    try {
      const response = await axios.get('/auth/me');
      
      if (response.data.success) {
        AppState.user = response.data.data.user;
        this.updateNavigation();
        return true;
      }
      
      // Token is invalid, clear it
      this.logout();
      return false;
    } catch (error) {
      // Token is invalid, clear it
      this.logout();
      return false;
    }
  },

  updateNavigation() {
    const userMenu = document.getElementById('nav-user-menu');
    const authButtons = document.getElementById('nav-auth-buttons');
    const userName = document.getElementById('user-name');
    
    if (AppState.user && AppState.token) {
      // User is logged in - show user menu
      if (userMenu) userMenu.classList.remove('hidden');
      if (authButtons) authButtons.classList.add('hidden');
      if (userName) {
        userName.textContent = AppState.user.full_name;
        // Add dealer badge if user is a dealer
        if (AppState.user.is_dealer) {
          userName.innerHTML = `${AppState.user.full_name} <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-1">Dealer</span>`;
        }
      }
      
      // Update any "Sign In" buttons to show "Dashboard"
      const loginLinks = document.querySelectorAll('a[href="/login"]');
      loginLinks.forEach(link => {
        link.textContent = '👤 Account';
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          document.getElementById('user-menu-button')?.click();
        };
      });
    } else {
      // User is not logged in - show auth buttons
      if (userMenu) userMenu.classList.add('hidden');
      if (authButtons) authButtons.classList.remove('hidden');
      
      // Reset login links
      const loginLinks = document.querySelectorAll('a[href="#"]');
      loginLinks.forEach(link => {
        if (link.textContent.includes('Account')) {
          link.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Sign In';
          link.href = '/login';
          link.onclick = null;
        }
      });
    }
  }
};

// Car Functions
const Cars = {
  async loadCarMakes() {
    try {
      const response = await axios.get('/cars/data/makes');
      
      if (response.data.success) {
        AppState.carMakes = response.data.data || [];
        this.populateCarMakeDropdowns();
      }
    } catch (error) {
      console.error('Error loading car makes:', error);
    }
  },

  populateCarMakeDropdowns() {
    const makeSelects = document.querySelectorAll('select[name="make"], .car-make-select');
    
    makeSelects.forEach(select => {
      // Keep existing default option
      const defaultOption = select.querySelector('option[value=""]');
      select.innerHTML = '';
      
      if (defaultOption) {
        select.appendChild(defaultOption);
      } else {
        select.innerHTML = '<option value="">Any Make</option>';
      }
      
      // Add all car makes
      AppState.carMakes.forEach(make => {
        const option = document.createElement('option');
        option.value = make.name.toLowerCase();
        option.textContent = make.name;
        select.appendChild(option);
      });
    });
  },

  populateModelDropdown(makeSelect, modelSelect) {
    const selectedMake = makeSelect.value;
    const makeData = AppState.carMakes.find(make => 
      make.name.toLowerCase() === selectedMake
    );
    
    // Clear existing options
    modelSelect.innerHTML = '<option value="">Any Model</option>';
    
    if (makeData && makeData.models) {
      makeData.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.toLowerCase();
        option.textContent = model;
        modelSelect.appendChild(option);
      });
    }
  },

  async getFeaturedCars() {
    try {
      const response = await axios.get('/cars/featured');
      
      if (response.data.success) {
        AppState.featuredCars = response.data.data || [];
        this.renderFeaturedCars();
      }
    } catch (error) {
      console.error('Error fetching featured cars:', error);
      Utils.showError('featured-cars', 'Failed to load featured cars');
    }
  },

  async searchCars(filters = {}) {
    try {
      Utils.showLoading('cars-grid');
      
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`/cars?${params.toString()}`);
      
      if (response.data.success) {
        AppState.cars = response.data.data || [];
        this.renderCarsGrid();
        this.renderPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error searching cars:', error);
      Utils.showError('cars-grid', 'Failed to load cars');
    }
  },

  renderFeaturedCars() {
    const container = document.getElementById('featured-cars');
    if (!container) return;

    if (AppState.featuredCars.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fas fa-car text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">No featured cars available</p>
        </div>
      `;
      return;
    }

    container.innerHTML = AppState.featuredCars.map(car => `
      <div class="car-card bg-white rounded-lg shadow-md overflow-hidden">
        <div class="relative">
          ${car.featured_image ? 
            `<img src="${car.featured_image}" alt="${car.title}" class="w-full h-48 object-cover">` :
            `<div class="car-image-placeholder w-full h-48">
              <i class="fas fa-car"></i>
            </div>`
          }
          ${car.is_featured ? '<div class="badge-featured absolute top-2 right-2">Featured</div>' : ''}
          ${car.seller?.is_dealer ? '<div class="badge-dealer absolute top-2 left-2">Dealer</div>' : ''}
        </div>
        
        <div class="p-4">
          <h3 class="font-semibold text-lg mb-2 line-clamp-2">${car.title}</h3>
          
          <div class="flex justify-between items-center mb-3">
            <span class="price-small">${Utils.formatPrice(car.price)}</span>
            <span class="text-sm text-gray-600">${car.year}</span>
          </div>
          
          <div class="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span><i class="fas fa-tachometer-alt mr-1"></i>${car.mileage ? car.mileage.toLocaleString() + ' miles' : 'N/A'}</span>
            <span><i class="fas fa-gas-pump mr-1"></i>${car.fuel_type}</span>
          </div>
          
          <div class="flex items-center text-sm text-gray-600 mb-4">
            <i class="fas fa-map-marker-alt mr-1"></i>
            <span>${car.location}</span>
          </div>
          
          <a href="/car/${car.id}" class="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition duration-200">
            View Details
          </a>
        </div>
      </div>
    `).join('');
  },

  renderCarsGrid() {
    const container = document.getElementById('cars-grid');
    if (!container) return;

    if (AppState.cars.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No cars found</h3>
          <p class="text-gray-500">Try adjusting your search criteria</p>
        </div>
      `;
      return;
    }

    container.innerHTML = AppState.cars.map(car => `
      <div class="car-card bg-white rounded-lg shadow-md overflow-hidden">
        <div class="md:flex">
          <div class="md:w-1/3 relative">
            ${car.featured_image ? 
              `<img src="${car.featured_image}" alt="${car.title}" class="w-full h-48 md:h-full object-cover">` :
              `<div class="car-image-placeholder w-full h-48 md:h-full">
                <i class="fas fa-car"></i>
              </div>`
            }
            ${car.is_featured ? '<div class="badge-featured absolute top-2 right-2">Featured</div>' : ''}
          </div>
          
          <div class="md:w-2/3 p-6">
            <div class="flex justify-between items-start mb-4">
              <h3 class="font-semibold text-xl">${car.title}</h3>
              <span class="price-large">${Utils.formatPrice(car.price)}</span>
            </div>
            
            <p class="text-gray-600 mb-4">${Utils.truncate(car.description || '', 150)}</p>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <span class="text-gray-500">Year:</span><br>
                <span class="font-medium">${car.year}</span>
              </div>
              <div>
                <span class="text-gray-500">Mileage:</span><br>
                <span class="font-medium">${car.mileage ? car.mileage.toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span class="text-gray-500">Fuel:</span><br>
                <span class="font-medium capitalize">${car.fuel_type}</span>
              </div>
              <div>
                <span class="text-gray-500">Transmission:</span><br>
                <span class="font-medium capitalize">${car.transmission}</span>
              </div>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 text-sm text-gray-600">
                <i class="fas fa-map-marker-alt"></i>
                <span>${car.location}</span>
                ${car.seller?.is_dealer ? '<span class="badge-dealer ml-2">Dealer</span>' : ''}
                ${car.seller?.is_verified ? '<i class="fas fa-check-circle text-green-500 ml-1" title="Verified seller"></i>' : ''}
              </div>
              
              <a href="/car/${car.id}" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                View Details
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || !pagination) return;

    const { page, pages, total } = pagination;
    
    if (pages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-700">
          Showing <span class="font-medium">${((page - 1) * 20) + 1}</span> to 
          <span class="font-medium">${Math.min(page * 20, total)}</span> of 
          <span class="font-medium">${total}</span> results
        </p>
        
        <nav class="flex space-x-2">
    `;

    // Previous button
    if (page > 1) {
      paginationHTML += `
        <button onclick="Cars.goToPage(${page - 1})" class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Previous
        </button>
      `;
    }

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button onclick="Cars.goToPage(${i})" 
                class="px-3 py-2 text-sm rounded-md ${i === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}">
          ${i}
        </button>
      `;
    }

    // Next button
    if (page < pages) {
      paginationHTML += `
        <button onclick="Cars.goToPage(${page + 1})" class="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">
          Next
        </button>
      `;
    }

    paginationHTML += `
        </nav>
      </div>
    `;

    container.innerHTML = paginationHTML;
  },

  goToPage(page) {
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('page', page);
    window.location.href = currentUrl.toString();
  }
};

// Form Handlers
const Forms = {
  setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
      submitBtn.disabled = true;
      
      const success = await Auth.login(email, password);
      
      if (!success) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  },

  setupRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const userData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        location: formData.get('location'),
        password: formData.get('password'),
        is_dealer: formData.get('is_dealer') === 'on'
      };
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...';
      submitBtn.disabled = true;
      
      const success = await Auth.register(userData);
      
      if (!success) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
};

// Navigation Functions
const Navigation = {
  setupMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  },

  setupUserMenu() {
    const userMenuBtn = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', () => {
        userDropdown.classList.toggle('hidden');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.add('hidden');
        }
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
      });
    }
  }
};

// Filter Functions for Browse Page
function applyFilters() {
  const form = document.getElementById('filters-form');
  if (!form) return;
  
  const formData = new FormData(form);
  const filters = {};
  
  for (const [key, value] of formData.entries()) {
    if (value) filters[key] = value;
  }
  
  // Update URL with filters
  const params = new URLSearchParams(filters);
  const newUrl = `/browse?${params.toString()}`;
  window.history.pushState(null, '', newUrl);
  
  // Reload cars with new filters
  Cars.searchCars(filters);
}

function clearFilters() {
  const form = document.getElementById('filters-form');
  if (!form) return;
  
  form.reset();
  
  // Update URL without filters
  window.history.pushState(null, '', '/browse');
  
  // Reload cars without filters
  Cars.searchCars({});
}

// Search Functions
function searchCars() {
  const make = document.querySelector('select[name="make"]')?.value || '';
  const model = document.querySelector('select[name="model"]')?.value || '';
  const priceRange = document.querySelector('select[name="price"]')?.value || '';
  const location = document.querySelector('select[name="location"]')?.value || '';
  
  const filters = {};
  
  if (make) filters.make = make;
  if (model) filters.model = model;
  if (location) filters.location = location;
  
  if (priceRange) {
    const [min, max] = priceRange.split('-');
    if (min !== undefined) filters.min_price = parseInt(min) * 100; // Convert to pence
    if (max !== undefined && max !== '+') filters.max_price = parseInt(max) * 100;
  }
  
  // Redirect to browse page with filters
  const params = new URLSearchParams(filters);
  window.location.href = `/browse?${params.toString()}`;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication status
  await Auth.checkAuth();
  
  // Load car makes data
  await Cars.loadCarMakes();
  
  // Setup navigation
  Navigation.setupMobileMenu();
  Navigation.setupUserMenu();
  
  // Setup forms
  Forms.setupLoginForm();
  Forms.setupRegisterForm();
  
  // Setup make-model dependencies
  setupMakeModelDependency();
  
  // Page-specific initialization
  const pathname = window.location.pathname;
  
  if (pathname === '/') {
    // Homepage: Load featured cars
    Cars.getFeaturedCars();
  } else if (pathname === '/browse') {
    // Browse page: Load cars with filters
    const urlParams = new URLSearchParams(window.location.search);
    const filters = {};
    
    for (const [key, value] of urlParams) {
      filters[key] = value;
    }
    
    Cars.searchCars(filters);
  }
});

// Setup make-model dropdown dependency
function setupMakeModelDependency() {
  // Homepage search
  const makeSelect = document.getElementById('search-make');
  const modelSelect = document.getElementById('search-model');
  
  if (makeSelect && modelSelect) {
    makeSelect.addEventListener('change', () => {
      Cars.populateModelDropdown(makeSelect, modelSelect);
    });
  }
  
  // Browse page filters
  const filterForm = document.getElementById('filters-form');
  if (filterForm) {
    const filterMakeSelect = filterForm.querySelector('select[name="make"]');
    const filterModelSelect = filterForm.querySelector('select[name="model"]');
    
    if (filterMakeSelect && filterModelSelect) {
      filterMakeSelect.addEventListener('change', () => {
        Cars.populateModelDropdown(filterMakeSelect, filterModelSelect);
      });
    }
  }
}

// Global error handler for API calls
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  Utils.showToast('Something went wrong. Please try again.', 'error');
});

// Car Details Functions
const CarDetails = {
  async loadCarDetails(carId) {
    const container = document.getElementById('car-details-container');
    if (!container) return;

    Utils.showLoading('car-details-container');

    try {
      const response = await axios.get(`/cars/${carId}`);
      
      if (response.data.success) {
        this.renderCarDetails(response.data.data, container);
        // Load car images after rendering details
        await this.loadCarImages(carId);
      } else {
        Utils.showError('car-details-container', response.data.error);
      }
    } catch (error) {
      console.error('Error loading car details:', error);
      Utils.showError('car-details-container', 'Failed to load car details');
    }
  },

  renderCarDetails(car, container) {
    const isOwner = AppState.user && AppState.user.id === car.user_id;
    
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Car Images Gallery -->
        <div class="relative">
          <!-- Main Image -->
          <div id="main-image-container" class="relative h-96 bg-gray-200">
            <img id="main-image" src="${car.featured_image || '/static/images/cars/placeholder-car.svg'}" 
                 alt="${car.title}" 
                 class="w-full h-full object-cover cursor-pointer"
                 onclick="CarDetails.openImageModal(this.src)">
            ${car.is_featured ? '<div class="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Featured</div>' : ''}
            <div class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm" id="image-counter">
              Loading images...
            </div>
          </div>
          
          <!-- Image Thumbnails -->
          <div id="image-thumbnails" class="flex gap-2 p-4 bg-gray-50 overflow-x-auto">
            <!-- Thumbnails will be loaded here -->
          </div>
        </div>
        
        <!-- Car Info -->
        <div class="p-6">
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- Main Details -->
            <div class="lg:w-2/3">
              <h1 class="text-3xl font-bold text-gray-800 mb-4">${car.title}</h1>
              
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-sm">
                <div class="flex items-center">
                  <i class="fas fa-calendar mr-2 text-gray-500"></i>
                  <span>${car.year}</span>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-road mr-2 text-gray-500"></i>
                  <span>${car.mileage ? Utils.formatNumber(car.mileage) + ' miles' : 'Not specified'}</span>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-gas-pump mr-2 text-gray-500"></i>
                  <span class="capitalize">${car.fuel_type}</span>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-cog mr-2 text-gray-500"></i>
                  <span class="capitalize">${car.transmission}</span>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-car mr-2 text-gray-500"></i>
                  <span class="capitalize">${car.body_type}</span>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-map-marker-alt mr-2 text-gray-500"></i>
                  <span>${car.location}</span>
                </div>
              </div>

              <!-- Description -->
              ${car.description ? `
                <div class="mb-6">
                  <h3 class="text-lg font-semibold mb-2">Description</h3>
                  <p class="text-gray-700 leading-relaxed">${car.description}</p>
                </div>
              ` : ''}

              <!-- Features -->
              ${car.features && car.features.length > 0 ? `
                <div class="mb-6">
                  <h3 class="text-lg font-semibold mb-2">Features</h3>
                  <div class="flex flex-wrap gap-2">
                    ${car.features.map(feature => `
                      <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${feature}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Additional Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                ${car.engine_size ? `<div><strong>Engine Size:</strong> ${car.engine_size}</div>` : ''}
                ${car.doors ? `<div><strong>Doors:</strong> ${car.doors}</div>` : ''}
                ${car.color ? `<div><strong>Color:</strong> ${car.color}</div>` : ''}
                ${car.mot_expiry ? `<div><strong>MOT Expires:</strong> ${Utils.formatDate(car.mot_expiry)}</div>` : ''}
                <div><strong>Service History:</strong> ${car.service_history === 1 ? 'Full' : car.service_history === 2 ? 'Partial' : 'Unknown'}</div>
                <div><strong>Negotiable:</strong> ${car.is_negotiable ? 'Yes' : 'No'}</div>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="lg:w-1/3">
              <!-- Price -->
              <div class="bg-gray-50 rounded-lg p-6 mb-6">
                <div class="text-3xl font-bold text-green-600 mb-2">
                  ${Utils.formatPrice(car.price)}
                </div>
                ${car.is_negotiable ? '<p class="text-sm text-gray-600">Price negotiable</p>' : ''}
              </div>

              <!-- Seller Info -->
              <div class="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 class="text-lg font-semibold mb-3">Seller Information</h3>
                <div class="flex items-center mb-3">
                  <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    ${car.seller.full_name.charAt(0)}
                  </div>
                  <div>
                    <p class="font-semibold">${car.seller.full_name}</p>
                    <p class="text-sm text-gray-600">${car.seller.location}</p>
                  </div>
                </div>
                <div class="flex gap-2 mb-4">
                  ${car.seller.is_verified ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Verified</span>' : ''}
                  ${car.seller.is_dealer ? '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Dealer</span>' : ''}
                </div>
                
                ${isOwner ? `
                  <div class="space-y-3">
                    <button onclick="CarDetails.editCar(${car.id})" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                      <i class="fas fa-edit mr-2"></i>Edit Listing
                    </button>
                    <button onclick="CarDetails.deleteCar(${car.id})" class="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                      <i class="fas fa-trash mr-2"></i>Delete Listing
                    </button>
                  </div>
                ` : `
                  <div class="space-y-3">
                    <button onclick="CarDetails.contactSeller(${car.id}, ${car.user_id})" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                      <i class="fas fa-envelope mr-2"></i>Contact Seller
                    </button>
                    <button onclick="CarDetails.toggleSaved(${car.id})" class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300" id="save-btn-${car.id}">
                      <i class="fas fa-heart mr-2"></i>Save Car
                    </button>
                    <button onclick="window.open('/profile/${car.user_id}', '_blank')" class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300">
                      <i class="fas fa-user mr-2"></i>View Seller
                    </button>
                  </div>
                `}
              </div>

              <!-- Stats -->
              <div class="bg-gray-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-3">Listing Stats</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Views:</span>
                    <span>${car.views || 0}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Listed:</span>
                    <span>${Utils.formatRelativeTime(car.created_at)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Status:</span>
                    <span class="capitalize ${car.status === 'active' ? 'text-green-600' : 'text-red-600'}">${car.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async contactSeller(carId, sellerId) {
    if (!AppState.user) {
      Utils.showToast('Please log in to contact the seller', 'error');
      setTimeout(() => window.location.href = '/login', 1000);
      return;
    }

    // Show contact modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Contact Seller</h3>
        <form id="contact-form">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input type="text" name="subject" class="w-full p-2 border border-gray-300 rounded-md" placeholder="Enquiry about the car">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea name="message" rows="4" class="w-full p-2 border border-gray-300 rounded-md" placeholder="Hi, I'm interested in your car. Is it still available?" required></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Send Message
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle form submission
    const form = modal.querySelector('#contact-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        const response = await axios.post('/messages', {
          car_id: carId,
          recipient_id: sellerId,
          subject: formData.get('subject') || 'Enquiry about the car',
          message: formData.get('message')
        });

        if (response.data.success) {
          Utils.showToast('Message sent successfully!', 'success');
          modal.remove();
        } else {
          throw new Error(response.data.error);
        }
      } catch (error) {
        Utils.showToast(error.response?.data?.error || 'Failed to send message', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  },

  async toggleSaved(carId) {
    if (!AppState.user) {
      Utils.showToast('Please log in to save cars', 'error');
      return;
    }

    try {
      const response = await axios.post(`/cars/${carId}/save`);
      
      if (response.data.success) {
        const btn = document.getElementById(`save-btn-${carId}`);
        if (btn) {
          if (response.data.data.saved) {
            btn.innerHTML = '<i class="fas fa-heart mr-2 text-red-500"></i>Saved';
            btn.className = 'w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200';
            Utils.showToast('Car saved to favorites', 'success');
          } else {
            btn.innerHTML = '<i class="fas fa-heart mr-2"></i>Save Car';
            btn.className = 'w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300';
            Utils.showToast('Car removed from favorites', 'info');
          }
        }
      }
    } catch (error) {
      Utils.showToast('Failed to save car', 'error');
    }
  },

  editCar(carId) {
    window.location.href = `/sell?edit=${carId}`;
  },

  async deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/cars/${carId}`);
      
      if (response.data.success) {
        Utils.showToast('Car listing deleted successfully', 'success');
        setTimeout(() => window.location.href = '/dashboard', 1000);
      } else {
        Utils.showToast(response.data.error, 'error');
      }
    } catch (error) {
      Utils.showToast('Failed to delete car listing', 'error');
    }
  },

  async loadCarImages(carId) {
    try {
      const response = await axios.get(`/api/images/car/${carId}`);
      if (response.data.success) {
        this.renderImageGallery(response.data.data);
      }
    } catch (error) {
      console.error('Error loading car images:', error);
      // Show placeholder if no images
      document.getElementById('image-counter').textContent = '0 images';
    }
  },

  renderImageGallery(imageData) {
    const mainImage = document.getElementById('main-image');
    const thumbnailsContainer = document.getElementById('image-thumbnails');
    const imageCounter = document.getElementById('image-counter');
    
    if (imageData.images.length === 0) {
      imageCounter.textContent = '0 images';
      thumbnailsContainer.innerHTML = '<p class="text-gray-500 text-sm">No images available</p>';
      return;
    }

    // Update counter
    imageCounter.textContent = `${imageData.images.length} image${imageData.images.length > 1 ? 's' : ''}`;
    
    // Set featured image as main
    if (imageData.featured) {
      mainImage.src = imageData.featured;
    }

    // Create thumbnails
    const thumbnailsHTML = imageData.images.map((image, index) => `
      <div class="flex-shrink-0 cursor-pointer ${image.isFeatured ? 'ring-2 ring-blue-500' : ''}" 
           onclick="CarDetails.setMainImage('${image.url}', ${index})">
        <img src="${image.url}" 
             alt="Car image ${index + 1}" 
             class="w-20 h-16 object-cover rounded border hover:border-blue-500 transition-colors">
      </div>
    `).join('');

    thumbnailsContainer.innerHTML = thumbnailsHTML;
  },

  setMainImage(imageUrl, index) {
    const mainImage = document.getElementById('main-image');
    mainImage.src = imageUrl;
    
    // Update thumbnail selection
    const thumbnails = document.querySelectorAll('#image-thumbnails > div');
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('ring-2', 'ring-blue-500');
      } else {
        thumb.classList.remove('ring-2', 'ring-blue-500');
      }
    });
  },

  openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="relative max-w-4xl max-h-full p-4">
        <img src="${imageSrc}" alt="Car image" class="max-w-full max-h-full object-contain">
        <button onclick="this.closest('.fixed').remove()" 
                class="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full w-8 h-8 flex items-center justify-center">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
  }
};

// Dashboard Functions
const Dashboard = {
  currentTab: 'overview',

  async init() {
    if (!AppState.user) {
      window.location.href = '/login';
      return;
    }

    await this.loadUserInfo();
    this.setupNavigation();
    this.loadTab('overview');
  },

  async loadUserInfo() {
    try {
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        AppState.user = response.data.data.user;
        
        const nameEl = document.getElementById('dashboard-user-name');
        const emailEl = document.getElementById('dashboard-user-email');
        
        if (nameEl) nameEl.textContent = AppState.user.full_name;
        if (emailEl) emailEl.textContent = AppState.user.email;
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  },

  setupNavigation() {
    const navItems = document.querySelectorAll('.dashboard-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('href').substring(1);
        this.loadTab(tab);
        
        // Update active state
        navItems.forEach(nav => nav.classList.remove('active', 'text-blue-600', 'bg-blue-50'));
        item.classList.add('active', 'text-blue-600', 'bg-blue-50');
      });
    });
  },

  async loadTab(tab) {
    this.currentTab = tab;
    const container = document.getElementById('dashboard-content');
    
    Utils.showLoading('dashboard-content');
    
    switch (tab) {
      case 'overview':
        await this.loadOverview(container);
        break;
      case 'listings':
        await this.loadListings(container);
        break;
      case 'messages':
        await this.loadMessages(container);
        break;
      case 'saved':
        await this.loadSavedCars(container);
        break;
      case 'profile':
        await this.loadProfile(container);
        break;
    }
  },

  async loadOverview(container) {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        axios.get('/users/dashboard/stats'),
        axios.get('/users/dashboard/activity')
      ]);

      const stats = statsResponse.data.data;
      const activity = activityResponse.data.data;

      container.innerHTML = `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-lg shadow-md">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                  <i class="fas fa-car text-xl"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold">${stats.cars}</h3>
                  <p class="text-gray-600">My Listings</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600">
                  <i class="fas fa-envelope text-xl"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold">${stats.messages}</h3>
                  <p class="text-gray-600">Messages</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md">
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-red-100 text-red-600">
                  <i class="fas fa-heart text-xl"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold">${stats.saved}</h3>
                  <p class="text-gray-600">Saved Cars</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-lg shadow-md">
            <div class="p-6 border-b">
              <h3 class="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div class="p-6">
              ${activity.length > 0 ? `
                <div class="space-y-4">
                  ${activity.map(item => `
                    <div class="flex items-center">
                      <div class="p-2 rounded-full ${item.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}">
                        <i class="fas fa-${item.type === 'message' ? 'envelope' : 'car'} text-sm"></i>
                      </div>
                      <div class="ml-3">
                        <p class="text-sm font-medium">${item.description}</p>
                        <p class="text-xs text-gray-500">${Utils.formatRelativeTime(item.created_at)}</p>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p class="text-gray-500 text-center py-8">No recent activity</p>
              `}
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/sell" class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <i class="fas fa-plus text-2xl text-gray-400 mb-2"></i>
                <span class="text-sm font-medium">List New Car</span>
              </a>
              <button onclick="Dashboard.loadTab('messages')" class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <i class="fas fa-envelope text-2xl text-gray-400 mb-2"></i>
                <span class="text-sm font-medium">View Messages</span>
              </button>
              <a href="/browse" class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <i class="fas fa-search text-2xl text-gray-400 mb-2"></i>
                <span class="text-sm font-medium">Browse Cars</span>
              </a>
              <button onclick="Dashboard.loadTab('profile')" class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <i class="fas fa-user-cog text-2xl text-gray-400 mb-2"></i>
                <span class="text-sm font-medium">Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error loading overview:', error);
      Utils.showError('dashboard-content', 'Failed to load dashboard overview');
    }
  },

  async loadListings(container) {
    try {
      const response = await axios.get('/cars/my/listings');
      const cars = response.data.data || [];

      container.innerHTML = `
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">My Car Listings</h2>
            <a href="/sell" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-plus mr-2"></i>Add New Car
            </a>
          </div>
          
          ${cars.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${cars.map(car => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                  <div class="aspect-video bg-gray-200 relative">
                    <img src="${car.featured_image || '/static/images/car-placeholder.jpg'}" 
                         alt="${car.title}" 
                         class="w-full h-full object-cover">
                    <div class="absolute top-2 right-2">
                      <span class="px-2 py-1 rounded-full text-xs font-semibold ${car.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${car.status}
                      </span>
                    </div>
                  </div>
                  <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${car.title}</h3>
                    <p class="text-2xl font-bold text-green-600 mb-2">${Utils.formatPrice(car.price)}</p>
                    <div class="flex justify-between text-sm text-gray-600 mb-4">
                      <span>${car.year}</span>
                      <span>${Utils.formatNumber(car.mileage)} miles</span>
                      <span>${car.views || 0} views</span>
                    </div>
                    <div class="flex space-x-2">
                      <a href="/car/${car.id}" class="flex-1 bg-blue-100 text-blue-800 py-2 px-3 rounded text-center text-sm font-medium hover:bg-blue-200">
                        View
                      </a>
                      <a href="/sell?edit=${car.id}" class="flex-1 bg-gray-100 text-gray-800 py-2 px-3 rounded text-center text-sm font-medium hover:bg-gray-200">
                        Edit
                      </a>
                      <button onclick="Dashboard.deleteCar(${car.id})" class="flex-1 bg-red-100 text-red-800 py-2 px-3 rounded text-sm font-medium hover:bg-red-200">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-12">
              <i class="fas fa-car text-4xl text-gray-400 mb-4"></i>
              <h3 class="text-lg font-semibold text-gray-600 mb-2">No listings yet</h3>
              <p class="text-gray-500 mb-6">Create your first car listing to get started</p>
              <a href="/sell" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                <i class="fas fa-plus mr-2"></i>List Your Car
              </a>
            </div>
          `}
        </div>
      `;
    } catch (error) {
      console.error('Error loading listings:', error);
      Utils.showError('dashboard-content', 'Failed to load car listings');
    }
  },

  async deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/cars/${carId}`);
      
      if (response.data.success) {
        Utils.showToast('Car listing deleted successfully', 'success');
        this.loadTab('listings'); // Reload listings
      } else {
        Utils.showToast(response.data.error, 'error');
      }
    } catch (error) {
      Utils.showToast('Failed to delete car listing', 'error');
    }
  }
};

// Sell Car Functions
const SellCar = {
  editingCarId: null,

  async init() {
    if (!AppState.user) {
      window.location.href = '/login';
      return;
    }

    // Check if editing
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
      this.editingCarId = parseInt(editId);
      await this.loadCarForEditing(this.editingCarId);
    }

    this.setupForm();
  },

  setupForm() {
    const container = document.getElementById('sell-car-form-container');
    if (!container) return;

    container.innerHTML = this.renderForm();
    
    // Setup form handlers
    this.setupMakeModelDependency();
    this.setupFormSubmission();
    this.setupImageUpload();
  },

  renderForm() {
    return `
      <form id="sell-car-form" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">Basic Information</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input type="text" name="title" required 
                     class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     placeholder="e.g., 2020 Ford Fiesta ST-Line">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                <select name="make" required id="sell-make-select"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Make</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                <select name="model" required id="sell-model-select"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Model</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <input type="number" name="year" required min="1900" max="${new Date().getFullYear() + 1}"
                       class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Mileage</label>
                <input type="number" name="mileage" min="0"
                       class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Price (£) *</label>
              <input type="number" name="price" required min="0" step="0.01"
                     class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>

            <div class="flex items-center">
              <input type="checkbox" name="is_negotiable" id="is_negotiable"
                     class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <label for="is_negotiable" class="ml-2 block text-sm text-gray-900">
                Price is negotiable
              </label>
            </div>
          </div>

          <!-- Technical Details -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">Technical Details</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fuel Type *</label>
                <select name="fuel_type" required
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Fuel Type</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Transmission *</label>
                <select name="transmission" required
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Transmission</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
                <select name="body_type"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Body Type</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="saloon">Saloon</option>
                  <option value="estate">Estate</option>
                  <option value="suv">SUV</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="mpv">MPV</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Doors</label>
                <select name="doors"
                        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select Doors</option>
                  <option value="2">2 doors</option>
                  <option value="3">3 doors</option>
                  <option value="4">4 doors</option>
                  <option value="5">5 doors</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Engine Size</label>
                <input type="text" name="engine_size" placeholder="e.g., 2.0L"
                       class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input type="text" name="color" placeholder="e.g., Magnetic Grey"
                       class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Location</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Location *</label>
              <select name="location" required
                      class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Location</option>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
              <input type="text" name="postcode" placeholder="e.g., PO30"
                     class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
        </div>

        <!-- MOT and Service -->
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-4">MOT & Service History</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">MOT Expiry</label>
              <input type="date" name="mot_expiry"
                     class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service History</label>
              <select name="service_history"
                      class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select Service History</option>
                <option value="full">Full Service History</option>
                <option value="partial">Partial Service History</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea name="description" rows="4" 
                    class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your car in detail. Include any special features, condition notes, or selling points..."></textarea>
        </div>

        <!-- Features -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Features</label>
          <div id="features-container" class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            <!-- Features will be populated by JavaScript -->
          </div>
          <div class="flex gap-2">
            <input type="text" id="custom-feature" placeholder="Add custom feature"
                   class="flex-1 p-2 border border-gray-300 rounded-md">
            <button type="button" onclick="SellCar.addCustomFeature()" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add
            </button>
          </div>
        </div>

        <!-- Condition Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Condition Notes</label>
          <textarea name="condition_notes" rows="3"
                    class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any issues, damage, or specific condition notes..."></textarea>
        </div>

        <!-- Car Images -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Car Images</label>
          <div class="space-y-4">
            <!-- Image Upload Drop Zone -->
            <div id="image-drop-zone" 
                 class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <div class="space-y-2">
                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                <div class="text-lg font-medium text-gray-700">Upload Car Images</div>
                <div class="text-sm text-gray-500">
                  Drag and drop images here, or click to select files<br>
                  <span class="font-medium">Maximum 8 images, 5MB per image</span><br>
                  Supported formats: JPEG, PNG, WebP
                </div>
              </div>
              <input type="file" id="image-files" multiple accept="image/*" class="hidden">
            </div>

            <!-- Image Counter -->
            <div class="flex justify-between items-center text-sm text-gray-600">
              <span id="image-counter">0/8 images</span>
              <span class="text-xs">First image will be set as featured image</span>
            </div>

            <!-- Uploaded Images Grid -->
            <div id="uploaded-images" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Uploaded images will appear here -->
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-4">
          <button type="button" onclick="window.history.back()" 
                  class="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" 
                  class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>
            ${this.editingCarId ? 'Update Listing' : 'Create Listing'}
          </button>
        </div>
      </form>
    `;
  },

  setupMakeModelDependency() {
    const makeSelect = document.getElementById('sell-make-select');
    const modelSelect = document.getElementById('sell-model-select');
    
    if (makeSelect && modelSelect) {
      // Load car makes
      Cars.loadCarMakes().then(() => {
        Cars.populateCarMakeDropdowns();
      });
      
      makeSelect.addEventListener('change', () => {
        Cars.populateModelDropdown(makeSelect, modelSelect);
      });
    }
  },

  setupFormSubmission() {
    const form = document.getElementById('sell-car-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
      submitBtn.disabled = true;

      try {
        // Collect form data
        const carData = {
          title: formData.get('title'),
          description: formData.get('description'),
          make: formData.get('make'),
          model: formData.get('model'),
          year: parseInt(formData.get('year')),
          mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : null,
          fuel_type: formData.get('fuel_type'),
          transmission: formData.get('transmission'),
          body_type: formData.get('body_type'),
          engine_size: formData.get('engine_size'),
          doors: formData.get('doors') ? parseInt(formData.get('doors')) : null,
          color: formData.get('color'),
          price: Math.round(parseFloat(formData.get('price')) * 100), // Convert to pence
          is_negotiable: formData.get('is_negotiable') === 'on',
          location: formData.get('location'),
          postcode: formData.get('postcode'),
          mot_expiry: formData.get('mot_expiry'),
          service_history: formData.get('service_history'),
          condition_notes: formData.get('condition_notes'),
          features: this.getSelectedFeatures()
        };

        let response;
        if (this.editingCarId) {
          response = await axios.put(`/cars/${this.editingCarId}`, carData);
        } else {
          response = await axios.post('/cars', carData);
        }

        if (response.data.success) {
          const carId = response.data.data.id;
          
          // If this is a new car (not editing), set up image upload with the new car ID
          if (!this.editingCarId) {
            ImageUpload.carId = carId;
          }
          
          Utils.showToast(`Car listing ${this.editingCarId ? 'updated' : 'created'} successfully!`, 'success');
          
          // Check if there are images to upload for new cars
          const hasImages = document.querySelectorAll('#image-files')[0]?.files?.length > 0;
          
          if (!this.editingCarId && hasImages) {
            Utils.showToast('Now uploading your images...', 'info');
            // Delay redirect to allow image uploads to complete
            setTimeout(() => {
              window.location.href = `/car/${carId}`;
            }, 3000);
          } else {
            setTimeout(() => {
              window.location.href = `/car/${carId}`;
            }, 1000);
          }
        } else {
          throw new Error(response.data.error);
        }
      } catch (error) {
        console.error('Error saving car:', error);
        Utils.showToast(error.response?.data?.error || 'Failed to save car listing', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  },

  getSelectedFeatures() {
    const checkboxes = document.querySelectorAll('#features-container input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  },

  addCustomFeature() {
    const input = document.getElementById('custom-feature');
    const feature = input.value.trim();
    
    if (feature) {
      this.addFeatureCheckbox(feature, true);
      input.value = '';
    }
  },

  setupImageUpload() {
    // Initialize image upload with car ID if editing
    ImageUpload.init(this.editingCarId);
  }
};

// Image Upload Functions
const ImageUpload = {
  maxFiles: 8,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],

  init(carId = null) {
    this.carId = carId;
    this.setupDropZone();
    this.setupFileInput();
    if (carId) {
      this.loadExistingImages(carId);
    }
  },

  setupDropZone() {
    const dropZone = document.getElementById('image-drop-zone');
    if (!dropZone) return;

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
      
      const files = Array.from(e.dataTransfer.files);
      this.handleFiles(files);
    });

    dropZone.addEventListener('click', () => {
      document.getElementById('image-files').click();
    });
  },

  setupFileInput() {
    const fileInput = document.getElementById('image-files');
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleFiles(files);
    });
  },

  async handleFiles(files) {
    const validFiles = this.validateFiles(files);
    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      await this.uploadFile(file);
    }
  },

  validateFiles(files) {
    const currentImages = document.querySelectorAll('.uploaded-image').length;
    const validFiles = [];

    for (const file of files) {
      // Check file count limit
      if (currentImages + validFiles.length >= this.maxFiles) {
        showToast('Maximum 8 images allowed per listing', 'error');
        break;
      }

      // Check file type
      if (!this.allowedTypes.includes(file.type)) {
        showToast(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP images are allowed.`, 'error');
        continue;
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        showToast(`File too large: ${file.name}. Maximum size is 5MB.`, 'error');
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  },

  async uploadFile(file) {
    if (!this.carId) {
      showToast('Car ID is required for image upload', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    const imagePreview = this.createImagePreview(file);
    const container = document.getElementById('uploaded-images');
    container.appendChild(imagePreview);

    try {
      const response = await axios.post(`/api/images/upload/car/${this.carId}`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const progressBar = imagePreview.querySelector('.upload-progress');
          if (progressBar) {
            progressBar.style.width = `${percentCompleted}%`;
          }
        }
      });

      if (response.data.success) {
        this.updateImagePreview(imagePreview, response.data.data);
        showToast('Image uploaded successfully', 'success');
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      imagePreview.remove();
      showToast(error.response?.data?.error || 'Failed to upload image', 'error');
    }
  },

  createImagePreview(file) {
    const div = document.createElement('div');
    div.className = 'uploaded-image relative bg-gray-100 rounded-lg overflow-hidden';
    
    const reader = new FileReader();
    reader.onload = (e) => {
      div.innerHTML = `
        <div class="aspect-video relative">
          <img src="${e.target.result}" alt="Preview" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div class="text-white text-center">
              <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div class="text-sm">Uploading...</div>
              <div class="w-24 h-1 bg-gray-300 rounded mt-2">
                <div class="upload-progress h-full bg-blue-500 rounded transition-all duration-300" style="width: 0%"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    };
    reader.readAsDataURL(file);

    return div;
  },

  updateImagePreview(preview, imageData) {
    const currentImages = document.querySelectorAll('.uploaded-image').length;
    const isFeatured = currentImages === 1; // First image is featured by default

    preview.innerHTML = `
      <div class="aspect-video relative group">
        <img src="${imageData.url}" alt="Car image" class="w-full h-full object-cover">
        ${isFeatured ? '<div class="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">Featured</div>' : ''}
        <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          ${!isFeatured ? '<button onclick="ImageUpload.setFeatured(\'' + imageData.key + '\')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Set Featured</button>' : ''}
          <button onclick="ImageUpload.deleteImage('${imageData.key}', this)" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
        </div>
      </div>
    `;

    preview.dataset.imageKey = imageData.key;
  },

  async loadExistingImages(carId) {
    try {
      const response = await axios.get(`/api/images/car/${carId}`);
      if (response.data.success) {
        const container = document.getElementById('uploaded-images');
        container.innerHTML = '';

        response.data.data.images.forEach(image => {
          const preview = document.createElement('div');
          preview.className = 'uploaded-image relative bg-gray-100 rounded-lg overflow-hidden';
          preview.dataset.imageKey = image.key;
          
          preview.innerHTML = `
            <div class="aspect-video relative group">
              <img src="${image.url}" alt="Car image" class="w-full h-full object-cover">
              ${image.isFeatured ? '<div class="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">Featured</div>' : ''}
              <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                ${!image.isFeatured ? '<button onclick="ImageUpload.setFeatured(\'' + image.key + '\')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Set Featured</button>' : ''}
                <button onclick="ImageUpload.deleteImage('${image.key}', this)" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
              </div>
            </div>
          `;
          
          container.appendChild(preview);
        });

        this.updateImageCounter();
      }
    } catch (error) {
      console.error('Error loading existing images:', error);
    }
  },

  async setFeatured(imageKey) {
    if (!this.carId) return;

    try {
      const response = await axios.put(`/api/images/car/${this.carId}/featured`, {
        imageKey: imageKey
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Update UI to show new featured image
        document.querySelectorAll('.uploaded-image').forEach(img => {
          const featuredBadge = img.querySelector('.bg-yellow-500');
          const setFeaturedBtn = img.querySelector('button[onclick*="setFeatured"]');
          
          if (img.dataset.imageKey === imageKey) {
            // Add featured badge to this image
            if (!featuredBadge) {
              const imgContainer = img.querySelector('.aspect-video');
              const badge = document.createElement('div');
              badge.className = 'absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium';
              badge.textContent = 'Featured';
              imgContainer.appendChild(badge);
            }
            // Remove set featured button
            if (setFeaturedBtn) setFeaturedBtn.remove();
          } else {
            // Remove featured badge from other images
            if (featuredBadge) featuredBadge.remove();
            // Add set featured button if not exists
            if (!setFeaturedBtn) {
              const buttonContainer = img.querySelector('.group-hover\\:opacity-100');
              const button = document.createElement('button');
              button.onclick = () => this.setFeatured(img.dataset.imageKey);
              button.className = 'bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm';
              button.textContent = 'Set Featured';
              buttonContainer.insertBefore(button, buttonContainer.firstChild);
            }
          }
        });

        showToast('Featured image updated', 'success');
      }
    } catch (error) {
      console.error('Error setting featured image:', error);
      showToast('Failed to set featured image', 'error');
    }
  },

  async deleteImage(imageKey, buttonElement) {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await axios.delete(`/api/images/${imageKey}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const imageElement = buttonElement.closest('.uploaded-image');
        imageElement.remove();
        this.updateImageCounter();
        showToast('Image deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Failed to delete image', 'error');
    }
  },

  updateImageCounter() {
    const count = document.querySelectorAll('.uploaded-image').length;
    const counter = document.getElementById('image-counter');
    if (counter) {
      counter.textContent = `${count}/${this.maxFiles} images`;
    }
  }
};

// Messages Functions
const Messages = {
  async loadConversations() {
    try {
      const response = await axios.get('/messages');
      if (response.data.success) {
        this.renderConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  },

  renderConversations(messages) {
    const container = document.getElementById('conversations-list');
    if (!container) return;

    // Group messages by conversation
    const conversations = {};
    messages.forEach(msg => {
      const key = `${msg.car_id}-${msg.sender_id === AppState.user.id ? msg.recipient_id : msg.sender_id}`;
      if (!conversations[key]) {
        conversations[key] = {
          carId: msg.car_id,
          otherUserId: msg.sender_id === AppState.user.id ? msg.recipient_id : msg.sender_id,
          otherUserName: msg.sender_id === AppState.user.id ? msg.recipient_name : msg.sender_name,
          latestMessage: msg,
          unreadCount: 0
        };
      }
      if (!msg.is_read && msg.recipient_id === AppState.user.id) {
        conversations[key].unreadCount++;
      }
    });

    const conversationList = Object.values(conversations);
    
    container.innerHTML = conversationList.length > 0 ? 
      conversationList.map(conv => `
        <div class="conversation-item p-4 hover:bg-gray-50 cursor-pointer" 
             onclick="Messages.loadConversation(${conv.carId}, ${conv.otherUserId})">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h4 class="font-semibold text-sm">${conv.otherUserName}</h4>
              <p class="text-xs text-gray-600 truncate">${conv.latestMessage.subject}</p>
              <p class="text-xs text-gray-500">${Utils.formatRelativeTime(conv.latestMessage.created_at)}</p>
            </div>
            ${conv.unreadCount > 0 ? `
              <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">${conv.unreadCount}</span>
            ` : ''}
          </div>
        </div>
      `).join('') :
      '<div class="p-4 text-center text-gray-500">No messages yet</div>';
  },

  async loadConversation(carId, otherUserId) {
    try {
      const response = await axios.get(`/messages/conversation/${carId}/${otherUserId}`);
      if (response.data.success) {
        this.renderConversation(response.data.data);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  },

  renderConversation(messages) {
    const container = document.getElementById('message-thread');
    if (!container) return;

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <i class="fas fa-comments text-4xl mb-4"></i>
            <p>No messages in this conversation</p>
          </div>
        </div>
      `;
      return;
    }

    const car = messages[0].car;
    
    container.innerHTML = `
      <div class="flex flex-col h-96">
        <!-- Header -->
        <div class="p-4 border-b bg-gray-50">
          <h3 class="font-semibold">${car.title}</h3>
          <p class="text-sm text-gray-600">${car.year} ${car.make} ${car.model}</p>
        </div>
        
        <!-- Messages -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          ${messages.map(msg => `
            <div class="flex ${msg.sender_id === AppState.user.id ? 'justify-end' : 'justify-start'}">
              <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.sender_id === AppState.user.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }">
                <p class="text-sm">${msg.message}</p>
                <p class="text-xs ${msg.sender_id === AppState.user.id ? 'text-blue-100' : 'text-gray-500'} mt-1">
                  ${Utils.formatRelativeTime(msg.created_at)}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Reply Form -->
        <div class="p-4 border-t">
          <form onsubmit="Messages.sendReply(event, ${car.id}, ${messages[0].sender_id === AppState.user.id ? messages[0].recipient_id : messages[0].sender_id})">
            <div class="flex space-x-2">
              <input type="text" name="message" required placeholder="Type your reply..." 
                     class="flex-1 p-2 border border-gray-300 rounded-md">
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async sendReply(event, carId, recipientId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const message = formData.get('message');
    
    if (!message.trim()) return;

    try {
      const response = await axios.post('/messages', {
        car_id: carId,
        recipient_id: recipientId,
        message: message.trim()
      });

      if (response.data.success) {
        form.reset();
        this.loadConversation(carId, recipientId); // Reload conversation
        Utils.showToast('Reply sent successfully', 'success');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      Utils.showToast('Failed to send reply', 'error');
    }
  }
};

// Saved Cars Functions
const SavedCars = {
  async loadSavedCars() {
    const container = document.getElementById('saved-cars-grid');
    if (!container) return;

    Utils.showLoading('saved-cars-grid');

    try {
      const response = await axios.get('/cars/my/saved');
      
      if (response.data.success) {
        this.renderSavedCars(response.data.data, container);
      } else {
        Utils.showError('saved-cars-grid', response.data.error);
      }
    } catch (error) {
      console.error('Error loading saved cars:', error);
      Utils.showError('saved-cars-grid', 'Failed to load saved cars');
    }
  },

  renderSavedCars(cars, container) {
    if (cars.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-heart text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-600 mb-2">No saved cars yet</h3>
          <p class="text-gray-500 mb-6">Start browsing cars and save your favorites</p>
          <a href="/browse" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            <i class="fas fa-search mr-2"></i>Browse Cars
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = cars.map(car => `
      <div class="bg-white rounded-lg shadow-md overflow-hidden car-card">
        <div class="aspect-video bg-gray-200 relative">
          <img src="${car.featured_image || '/static/images/car-placeholder.jpg'}" 
               alt="${car.title}" 
               class="w-full h-full object-cover">
          ${car.is_featured ? '<div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">Featured</div>' : ''}
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-lg mb-2">${car.title}</h3>
          <p class="text-2xl font-bold text-green-600 mb-3">${Utils.formatPrice(car.price)}</p>
          
          <div class="flex justify-between text-sm text-gray-600 mb-3">
            <span><i class="fas fa-calendar mr-1"></i>${car.year}</span>
            <span><i class="fas fa-road mr-1"></i>${Utils.formatNumber(car.mileage)} mi</span>
            <span><i class="fas fa-map-marker-alt mr-1"></i>${car.location}</span>
          </div>
          
          <div class="flex justify-between text-xs text-gray-500 mb-4">
            <span>${Utils.formatRelativeTime(car.created_at)}</span>
            <span>${car.views || 0} views</span>
          </div>
          
          <div class="flex space-x-2">
            <a href="/car/${car.id}" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-center font-medium hover:bg-blue-700">
              View Details
            </a>
            <button onclick="SavedCars.unsaveCar(${car.id})" class="flex-1 bg-red-100 text-red-800 py-2 px-4 rounded font-medium hover:bg-red-200">
              <i class="fas fa-heart-broken mr-1"></i>Unsave
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  async unsaveCar(carId) {
    try {
      const response = await axios.post(`/cars/${carId}/save`);
      
      if (response.data.success) {
        Utils.showToast('Car removed from favorites', 'success');
        this.loadSavedCars(); // Reload saved cars
      }
    } catch (error) {
      console.error('Error unsaving car:', error);
      Utils.showToast('Failed to remove car from favorites', 'error');
    }
  }
};

// User Profile Functions
const UserProfile = {
  async loadProfile(userId) {
    const container = document.getElementById('user-profile-container');
    if (!container) return;

    Utils.showLoading('user-profile-container');

    try {
      const response = await axios.get(`/users/profile/${userId}`);
      
      if (response.data.success) {
        this.renderProfile(response.data.data, container);
      } else {
        Utils.showError('user-profile-container', response.data.error);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Utils.showError('user-profile-container', 'Failed to load user profile');
    }
  },

  renderProfile(data, container) {
    const { user, cars } = data;
    
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <!-- Profile Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div class="flex items-center">
            <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold mr-6">
              ${user.full_name.charAt(0)}
            </div>
            <div>
              <h1 class="text-2xl font-bold">${user.full_name}</h1>
              <p class="opacity-90">${user.location}</p>
              <div class="flex space-x-2 mt-2">
                ${user.is_verified ? '<span class="bg-green-500 bg-opacity-80 px-3 py-1 rounded-full text-xs font-semibold">Verified</span>' : ''}
                ${user.is_dealer ? '<span class="bg-yellow-500 bg-opacity-80 px-3 py-1 rounded-full text-xs font-semibold">Dealer</span>' : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Stats -->
        <div class="p-6 border-b">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-600">${cars.length}</div>
              <div class="text-sm text-gray-600">Active Listings</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">${Utils.formatRelativeTime(user.created_at)}</div>
              <div class="text-sm text-gray-600">Member Since</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-600">${user.is_verified ? 'Yes' : 'No'}</div>
              <div class="text-sm text-gray-600">Verified</div>
            </div>
          </div>
        </div>

        <!-- User's Cars -->
        <div class="p-6">
          <h2 class="text-xl font-bold mb-6">${user.full_name}'s Cars</h2>
          
          ${cars.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${cars.map(car => `
                <div class="bg-gray-50 rounded-lg overflow-hidden">
                  <div class="aspect-video bg-gray-200">
                    <img src="${car.featured_image || '/static/images/car-placeholder.jpg'}" 
                         alt="${car.title}" 
                         class="w-full h-full object-cover">
                  </div>
                  <div class="p-4">
                    <h3 class="font-semibold mb-2">${car.title}</h3>
                    <p class="text-lg font-bold text-green-600 mb-2">${Utils.formatPrice(car.price)}</p>
                    <div class="flex justify-between text-sm text-gray-600">
                      <span>${car.year}</span>
                      <span>${car.views || 0} views</span>
                    </div>
                    <a href="/car/${car.id}" class="block mt-3 bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700">
                      View Details
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-12 text-gray-500">
              <i class="fas fa-car text-4xl mb-4"></i>
              <p>No active listings</p>
            </div>
          `}
        </div>
      </div>
    `;
  }
};

// Page Initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('WightCars app initializing...');
  
  // Initialize authentication state
  await Auth.checkAuth();
  
  // Load car makes for all dropdowns
  await Cars.loadCarMakes();
  
  // Setup navigation
  Navigation.setupMobileMenu();
  Navigation.setupUserMenu();
  
  // Page-specific initialization
  const path = window.location.pathname;
  
  try {
    if (path === '/') {
      // Homepage initialization
      Cars.loadFeaturedCars();
      Forms.setupHomepageSearch();
    } else if (path === '/browse') {
      // Browse page initialization  
      Cars.searchCars();
      Forms.setupBrowseFilters();
    } else if (path.startsWith('/car/')) {
      // Car details page
      const carId = path.split('/')[2];
      if (carId) {
        await CarDetails.loadCarDetails(carId);
      }
    } else if (path === '/dashboard') {
      // Dashboard page
      await Dashboard.init();
    } else if (path === '/sell') {
      // Sell car page
      await SellCar.init();
    } else if (path === '/messages') {
      // Messages page
      if (AppState.user) {
        await Messages.loadConversations();
      } else {
        window.location.href = '/login';
      }
    } else if (path === '/saved') {
      // Saved cars page
      if (AppState.user) {
        await SavedCars.loadSavedCars();
      } else {
        window.location.href = '/login';
      }
    } else if (path.startsWith('/profile/')) {
      // User profile page
      const userId = path.split('/')[2];
      if (userId) {
        await UserProfile.loadProfile(userId);
      }
    } else if (path === '/login') {
      // Login page
      Forms.setupLogin();
    } else if (path === '/register') {
      // Register page
      Forms.setupRegister();
    }
  } catch (error) {
    console.error('Error during page initialization:', error);
    Utils.showToast('Something went wrong during page initialization', 'error');
  }
  
  console.log('WightCars app initialized successfully');
});

// Make functions available globally  
window.searchCars = searchCars;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.Utils = Utils;
window.Auth = Auth;
window.Cars = Cars;
window.CarDetails = CarDetails;
window.Dashboard = Dashboard;
window.SellCar = SellCar;
window.Messages = Messages;
window.SavedCars = SavedCars;
window.UserProfile = UserProfile;