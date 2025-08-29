# 🚗 WightCars - Isle of Wight Car Marketplace

The premier car classified ads website for the Isle of Wight, connecting local buyers and sellers with a modern, mobile-first platform.

## 🏝️ Project Overview

**WightCars** is a specialized car marketplace designed exclusively for the Isle of Wight community. Built with modern web technologies and deployed on Cloudflare's global edge network for lightning-fast performance.

### Key Features
- ✅ **Local Focus**: Exclusively for Isle of Wight residents
- ✅ **Mobile-First Design**: Optimized for smartphones and tablets
- ✅ **Verified Sellers**: User verification system for trust and safety
- ✅ **Advanced Search**: Filter by make, model, price, location, and more
- ✅ **Direct Messaging**: Secure communication between buyers and sellers
- ✅ **Saved Cars**: Favorites/watchlist functionality
- ✅ **Dealer Accounts**: Special accounts for car dealers
- ✅ **Real-time Updates**: Instant notifications and updates

## 🌐 URLs

### Development
- **Local Development**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health
- **API Documentation**: http://localhost:3000/api (Interactive endpoints)

### Production
- **Production Site**: *[Will be set after deployment]*
- **API Base URL**: *[Will be set after deployment]/api*

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework**: Hono with JSX rendering
- **Styling**: Tailwind CSS with custom Isle of Wight theming
- **Icons**: Font Awesome 6
- **JavaScript**: Vanilla JS with Axios for API calls
- **State Management**: Local storage + in-memory state

### Backend
- **Runtime**: Cloudflare Workers (Edge computing)
- **Framework**: Hono (Fast, lightweight, built for edge)
- **Authentication**: JWT tokens with secure HTTP-only approach
- **API**: RESTful endpoints with comprehensive error handling

### Database & Storage
- **Database**: Cloudflare D1 (Distributed SQLite)
- **File Storage**: Cloudflare R2 (S3-compatible) *[Ready for implementation]*
- **Caching**: Cloudflare KV Store *[Ready for implementation]*
- **CDN**: Cloudflare global network

### Data Models

#### Users
```typescript
interface User {
  id: number
  email: string
  full_name: string
  phone?: string
  location?: string
  is_dealer: boolean
  is_verified: boolean
  avatar_url?: string
  created_at: string
}
```

#### Cars
```typescript
interface Car {
  id: number
  user_id: number
  title: string
  description?: string
  make: string
  model: string
  year: number
  mileage?: number
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  transmission: 'manual' | 'automatic'
  body_type: string
  price: number // in pence
  location: string
  images?: string[]
  featured_image?: string
  status: 'active' | 'sold' | 'withdrawn'
  views: number
  created_at: string
}
```

#### Messages
```typescript
interface Message {
  id: number
  car_id: number
  sender_id: number
  recipient_id: number
  subject?: string
  message: string
  is_read: boolean
  created_at: string
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .dev.vars.template .dev.vars
   # Edit .dev.vars with your configuration
   ```

4. **Initialize database**
   ```bash
   # Create D1 database (first time only)
   npm run db:create
   
   # Apply migrations
   npm run db:migrate:local
   
   # Seed with test data
   npm run db:seed
   ```

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Start development server**
   ```bash
   # Clean any existing processes on port 3000
   npm run clean-port
   
   # Start with PM2
   pm2 start ecosystem.config.cjs
   
   # Check status
   pm2 list
   ```

7. **Access the application**
   - Open http://localhost:3000
   - Check API health: http://localhost:3000/api/health

## 📋 Available Scripts

### Development
```bash
npm run dev                 # Vite dev server (not recommended for this project)
npm run dev:sandbox        # Wrangler pages dev server (recommended)
npm run build              # Build for production
npm run preview            # Preview production build
```

### Database Management
```bash
npm run db:create          # Create D1 database (first time)
npm run db:migrate:local   # Apply migrations (local)
npm run db:migrate:prod    # Apply migrations (production)
npm run db:seed            # Seed with test data
npm run db:reset           # Reset local database
npm run db:console:local   # SQLite console (local)
npm run db:console:prod    # SQLite console (production)
```

### Deployment
```bash
npm run deploy             # Deploy to Cloudflare Pages
npm run deploy:prod        # Deploy to production with project name
```

### Utility
```bash
npm run clean-port         # Kill processes on port 3000
npm run test              # Test HTTP connection
npm run git:status        # Git status
npm run git:commit "msg"  # Git add & commit
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/verify` - Verify JWT token

### Admin API ✅ **FULLY IMPLEMENTED**
- `GET /api/admin/dashboard` - Admin dashboard data and statistics
- `GET /api/admin/users` - User management with filters and pagination
- `POST /api/admin/users/:id/verify` - Verify user account
- `POST /api/admin/users/:id/suspend` - Suspend user account
- `POST /api/admin/users/:id/unsuspend` - Unsuspend user account
- `GET /api/admin/moderation/cars` - Car listing moderation queue
- `POST /api/admin/moderation/cars/:id/approve` - Approve car listing
- `POST /api/admin/moderation/cars/:id/reject` - Reject car listing
- `POST /api/admin/moderation/cars/:id/flag` - Flag car listing for review
- `GET /api/admin/reports` - User reports and flags management
- `POST /api/admin/reports/:id/resolve` - Resolve user report
- `POST /api/admin/reports/:id/dismiss` - Dismiss user report
- `GET /api/admin/analytics` - Site analytics and metrics
- `GET /api/admin/settings` - Site settings configuration
- `POST /api/admin/settings` - Update site settings
- `POST /api/admin/settings/reset` - Reset settings to defaults
- `GET /api/admin/logs` - Activity logs with filtering and pagination
- `GET /api/admin/logs/export` - Export activity logs as CSV

### Cars
- `GET /api/cars` - List cars with filters and pagination
- `GET /api/cars/featured` - Get featured cars for homepage
- `GET /api/cars/:id` - Get single car details
- `POST /api/cars` - Create new car listing (auth required)
- `GET /api/cars/my/listings` - Get user's car listings (auth required)
- `POST /api/cars/:id/save` - Save/unsave car to favorites (auth required)
- `GET /api/cars/my/saved` - Get user's saved cars (auth required)
- `GET /api/cars/data/makes` - Get car makes and models data

### Users
- `GET /api/users/dashboard/stats` - Get user dashboard statistics (auth required)
- `GET /api/users/dashboard/activity` - Get user recent activity (auth required)
- `GET /api/users/profile/:id` - Get public user profile
- `GET /api/users/:id/cars` - Get user's car listings
- `PUT /api/users/profile` - Update user profile (auth required)
- `PUT /api/users/password` - Change user password (auth required)
- `GET /api/users/admin/stats` - Get admin site statistics (auth required)
- `GET /api/users/admin/users` - Get admin user list (auth required)

### Messages
- `GET /api/messages` - Get user's messages (auth required)
- `POST /api/messages` - Send message about a car (auth required)
- `PUT /api/messages/:id/read` - Mark message as read (auth required)
- `GET /api/messages/conversation/:carId/:otherUserId` - Get conversation (auth required)

### System
- `GET /api/health` - API health check and database status

## 🎨 UI Features & Components

### Currently Implemented
1. **Homepage**
   - Hero section with Isle of Wight branding
   - Quick search form with 40+ car makes and 500+ models
   - Featured cars grid with real database data
   - Features showcase and call-to-action sections

2. **Authentication System** ✅ **FULLY IMPLEMENTED**
   - User registration with email validation
   - Secure JWT-based login/logout
   - Password hashing with SHA-256 + salt
   - Automatic navigation state updates
   - Token persistence in localStorage
   - Protected API endpoints
   - User profile management
   - Dealer account support

3. **Car Browsing & Search**
   - Browse page with comprehensive filters sidebar
   - Car cards with seller information and badges
   - Pagination system with real database queries
   - Advanced search by make, model, price, year, fuel type
   - Location-based filtering (Isle of Wight areas)
   - Sort by price, year, date posted

4. **Database & API**
   - Cloudflare D1 SQLite database with full schema
   - Real car listings with 6 sample cars
   - User authentication and profiles
   - RESTful API with comprehensive error handling
   - Database fallback system for development

5. **Navigation & UX**
   - Responsive navigation with mobile menu
   - Dynamic user dropdown with dealer badges
   - Authentication state management
   - Toast notifications for user feedback
   - Mobile-first responsive design

### 🔜 Features Not Yet Implemented

#### High Priority
1. **Car Details Page** (`/car/:id`)
   - Full car information display
   - Image gallery
   - Seller contact information
   - Save/unsave functionality
   - Message seller form

2. **User Dashboard** (`/dashboard`)
   - User profile management
   - My listings overview
   - Messages inbox
   - Saved cars list
   - Account statistics

3. **Car Listing Management**
   - Create new listing form (`/sell`)
   - Edit existing listings
   - Upload/manage car images
   - Listing status management

4. **Messaging System**
   - Messages inbox (`/messages`)
   - Conversation threads
   - Real-time message notifications
   - Message status indicators

#### Medium Priority
5. **Advanced Search** (`/search`)
   - Saved search alerts
   - Advanced filter combinations
   - Search result sorting
   - Location-based search

6. **User Profiles** (`/profile/:id`)
   - Public seller profiles
   - Seller verification badges
   - Seller's other listings
   - Reviews and ratings

7. **Admin Panel System** ✅ **FULLY IMPLEMENTED**
   - **Dashboard**: Real-time metrics and site statistics
   - **User Management**: User verification, suspension, and profile management
   - **Listing Moderation**: Car listing approval, rejection, and flagging system
   - **Reports Management**: User report handling and investigation workflows
   - **Analytics Dashboard**: Comprehensive site analytics with KPIs and charts
   - **Site Settings**: Complete configuration management interface
   - **Activity Logs**: Detailed system activity monitoring with filtering and export
   - **Role-based Access**: Secure admin authentication with JWT tokens

#### Low Priority
8. **Additional Features**
   - Finance calculator
   - Insurance quotes integration
   - Comparison tools
   - Social media sharing
   - Email notifications

## 🛠️ Development Workflow

### Local Development
1. Make code changes
2. Wrangler automatically rebuilds and reloads
3. Test in browser at http://localhost:3000
4. Check API with curl or browser dev tools

### Database Changes
1. Create new migration file in `migrations/`
2. Run `npm run db:migrate:local`
3. Update TypeScript interfaces in `src/types/index.ts`
4. Test with sample data

### Adding New Features
1. Define API endpoints in appropriate route files
2. Add frontend JavaScript in `public/static/app.js`
3. Create/update page templates in `src/index.tsx`
4. Add styling in `public/static/styles.css`

## 🚢 Deployment

### Prerequisites
- Cloudflare account
- Wrangler CLI configured
- D1 database created

### Production Deployment
1. **Create production database**
   ```bash
   npx wrangler d1 create wightcars-production
   # Copy database ID to wrangler.jsonc
   ```

2. **Apply migrations to production**
   ```bash
   npm run db:migrate:prod
   ```

3. **Deploy to Cloudflare Pages**
   ```bash
   npm run deploy:prod
   ```

4. **Set environment variables**
   ```bash
   npx wrangler pages secret put JWT_SECRET --project-name wightcars
   ```

### Deployment Status
- **Platform**: Cloudflare Pages
- **Status**: 🟡 Ready for deployment
- **Last Updated**: Initial setup completed

## 🎯 Recommended Next Steps

1. **Complete Car Details Page** - Essential for user experience
2. **Implement User Dashboard** - Core functionality for users
3. **Add Image Upload System** - Critical for car listings
4. **Build Messaging Interface** - Enable buyer-seller communication
5. **Create Sell Car Form** - Allow users to list their cars
6. **Add Mobile App PWA Features** - Enhance mobile experience
7. **Implement Search Alerts** - Keep users engaged
8. **Add Admin Panel** - Content and user management

## 👥 User Guide

### For Buyers
1. **Browse Cars**: Visit homepage or /browse to see available cars
2. **Search**: Use filters to find specific cars
3. **Save Favorites**: Create account and save interesting cars
4. **Contact Sellers**: Send messages through the platform
5. **Stay Updated**: Set up search alerts for new listings

### For Sellers
1. **Create Account**: Register with your Isle of Wight location
2. **List Your Car**: Provide detailed information and photos
3. **Manage Listings**: Edit, pause, or mark as sold
4. **Respond to Enquiries**: Communicate with potential buyers
5. **Verify Account**: Get verified badge for increased trust

### For Dealers
1. **Dealer Account**: Register as a dealer for special features
2. **Multiple Listings**: Manage inventory efficiently
3. **Professional Profile**: Showcase your dealership
4. **Enhanced Features**: Access dealer-specific tools

## 🔑 Test Users & Login Credentials

**All test users use password: `password123`**

| Email | Name | Type | Location | Verified |
|-------|------|------|----------|----------|
| john.smith@wightcars.com | John Smith | Private Seller | Newport | ✅ |
| sarah.jones@dealer.com | Sarah Jones | **Dealer** | Cowes | ✅ |
| mike.wilson@email.com | Mike Wilson | Private Seller | Ryde | ❌ |
| emma.brown@wightcars.com | Emma Brown | Private Seller | Sandown | ✅ |

### How to Test Authentication
1. **Visit Login Page**: Navigate to `/login` 
2. **Use Test Credentials**: Try any email above with password `password123`
3. **Check Navigation**: User menu appears with name and dealer badge (if applicable)
4. **Test Logout**: Click user menu → Sign Out
5. **Test Registration**: Create new account at `/register`

## 🔒 Security & Privacy

- **Data Protection**: All user data encrypted and stored securely
- **Authentication**: JWT tokens with secure expiration (7 days)
- **Password Security**: SHA-256 hashing with salt for password protection
- **Input Validation**: All user inputs validated and sanitized
- **HTTPS Only**: All traffic encrypted in transit
- **Local Focus**: Isle of Wight only - reduces spam and fraud
- **Verification System**: User verification for trusted transactions

## 📱 Mobile Experience

- **Mobile-First Design**: Optimized for smartphones
- **Touch-Friendly**: Large tap targets and intuitive gestures
- **Fast Loading**: Optimized images and minimal JavaScript
- **Offline Support**: *[Ready for PWA implementation]*
- **App-Like Experience**: Full-screen mobile experience

## 🌟 Isle of Wight Integration

- **Local Locations**: All Isle of Wight towns and areas supported
- **Island-Specific Features**: Designed for Island car market
- **Community Focus**: Connect local buyers and sellers
- **Cultural Integration**: Isle of Wight themed design elements
- **Local SEO**: Optimized for Isle of Wight searches

---

**Made with ❤️ for the Isle of Wight community**

*Last Updated: August 2024*