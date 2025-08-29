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
        
        // Redirect to dashboard or homepage
        setTimeout(() => {
          window.location.href = '/dashboard';
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
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
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
    
    if (AppState.user) {
      if (userMenu) userMenu.classList.remove('hidden');
      if (authButtons) authButtons.classList.add('hidden');
      if (userName) userName.textContent = AppState.user.full_name;
    } else {
      if (userMenu) userMenu.classList.add('hidden');
      if (authButtons) authButtons.classList.remove('hidden');
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
  const makeSelect = document.getElementById('search-make');
  const modelSelect = document.getElementById('search-model');
  
  if (makeSelect && modelSelect) {
    makeSelect.addEventListener('change', () => {
      Cars.populateModelDropdown(makeSelect, modelSelect);
    });
  }
}

// Global error handler for API calls
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  Utils.showToast('Something went wrong. Please try again.', 'error');
});

// Make functions available globally
window.searchCars = searchCars;
window.Utils = Utils;
window.Auth = Auth;
window.Cars = Cars;