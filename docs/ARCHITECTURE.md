# Architecture Overview - HotelAir

## 📐 System Architecture

HotelAir is built with a modern full-stack architecture designed for scalability, maintainability, and performance. This document outlines the system design, components, and data flow.

## Table of Contents
- [Technology Stack](#technology-stack)
- [Architecture Diagram](#architecture-diagram)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)

## Technology Stack

### Frontend
- **Framework:** React.js
- **Build Tool:** Vite
- **Styling:** CSS3, Tailwind CSS
- **State Management:** Redux / Context API
- **HTTP Client:** Axios
- **UI Components:** Custom components + Bootstrap

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** JavaScript

### Database
- **Primary:** PostgreSQL / MySQL
- **Caching:** Redis (optional)
- **ORM:** Sequelize / Mongoose

### DevOps & Infrastructure
- **Version Control:** Git
- **CI/CD:** GitHub Actions
- **Deployment:** Render.com
- **Monitoring:** Error tracking and logging

### Additional Tools
- **Authentication:** JWT tokens
- **API Documentation:** Swagger/OpenAPI
- **Testing:** Jest, Mocha
- **Code Quality:** ESLint, Prettier

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   React      │  │   Redux      │  │  Axios HTTP    │   │
│  │  Components  │  │  Store       │  │  Client        │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API Calls
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Express.js Server                          │   │
│  │  ┌────────────┐ ┌────────────┐ ┌──────────────────┐ │   │
│  │  │ Routing    │ │ Middleware │ │ Authentication   │ │   │
│  │  └────────────┘ └────────────┘ └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐  ┌────▼──────────┐
│ Business   │  │ Cache Layer   │
│ Logic      │  │ (Redis)       │
│ Services   │  └───────────────┘
└───┬────────┘
    │
┌───▼────────────────────────────────────────────────────────┐
│              Data Access Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ORM (Sequelize/Mongoose)                            │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │  │
│  │  │ Models      │ │ Validators  │ │ Migrations   │  │  │
│  │  └─────────────┘ └─────────────┘ └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└───┬────────────────────────────────────────────────────────┘
    │
┌───▼────────────────────────────────────────────────────────┐
│           Database Layer                                    │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  PostgreSQL      │  │  MySQL           │               │
│  │  (Primary DB)    │  │  (Alternative)   │               │
│  └──────────────────┘  └──────────────────┘               │
└────────────────────────────────────────────────────────────┘
```

## System Components

### 1. Frontend Components

#### Authentication Module
- User login/logout
- Token management
- Permission checking
- Session handling

#### Dashboard
- Overview statistics
- Quick actions
- Real-time updates
- Analytics preview

#### Room Management
- Room listing
- Add/edit rooms
- Category management
- Availability control

#### Booking System
- Reservation management
- Guest information
- Payment integration
- Confirmation handling

#### Staff Management
- Employee records
- Department assignment
- Shift scheduling
- Performance tracking

#### Analytics
- Occupancy reports
- Revenue analysis
- Trend visualization
- Data export

### 2. Backend Services

#### Authentication Service
- User credential verification
- JWT token generation
- Token validation
- Role-based access control (RBAC)

#### Room Service
- Room CRUD operations
- Availability management
- Pricing calculations
- Room category management

#### Booking Service
- Reservation creation
- Availability checking
- Booking modification
- Cancellation handling

#### Payment Service
- Payment processing
- Transaction recording
- Invoice generation
- Refund handling

#### Staff Service
- Employee management
- Shift scheduling
- Attendance tracking
- Performance recording

#### Analytics Service
- Data aggregation
- Report generation
- Trend analysis
- Export functionality

#### Notification Service
- Email notifications
- SMS alerts (optional)
- In-app notifications
- Reminder scheduling

### 3. Database Schema

#### Core Tables
- **Users** - System users and authentication
- **Rooms** - Hotel room inventory
- **Bookings** - Guest reservations
- **Guests** - Guest information
- **Staff** - Employee records
- **Departments** - Department configuration
- **Payments** - Payment transactions
- **Analytics** - Historical data for reports

#### Supporting Tables
- **Room Categories** - Room types and classifications
- **Amenities** - Room facilities and features
- **Shifts** - Staff shift templates
- **Notifications** - Notification logs
- **Audit Logs** - System activity tracking

## Data Flow

### Booking Creation Flow

```
User Interface
     │
     ▼
React Component (Booking Form)
     │
     ▼
Redux Store (State Management)
     │
     ▼
Axios HTTP Request (POST /api/bookings)
     │
     ▼
Express Server
     │
     ├─ Authentication Middleware
     │
     ├─ Validation Middleware
     │
     ▼
Booking Controller
     │
     ├─ Check room availability
     │
     ├─ Calculate total amount
     │
     ▼
Booking Service
     │
     ▼
Database ORM
     │
     ▼
PostgreSQL Database
     │
     ▼
Response Back to Client
     │
     ▼
Update Redux Store
     │
     ▼
Display Confirmation to User
```

### Data Retrieval Flow

```
User Requests Data
     │
     ▼
Frontend Makes API Call
     │
     ▼
Express Server Routes Request
     │
     ▼
Check Cache (Redis)
     │
     ├─ Hit: Return cached data
     │
     ├─ Miss: Query Database
     │       │
     │       ▼
     │   Process Data
     │       │
     │       ▼
     │   Store in Cache
     │       │
     │       ▼
     │   Return to Client
     │
     ▼
Frontend Updates UI
```

## Performance Optimization

### Caching Strategy
- **Frontend Caching:** Browser localStorage for user preferences
- **Backend Caching:** Redis for frequently accessed data
- **Database Query Optimization:** Indexed columns, query optimization
- **API Response Caching:** ETags and conditional requests

### Code Splitting
- Lazy loading of routes
- Dynamic component imports
- Separate chunks for different sections

### Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling
- Query optimization and analysis
- Pagination for large datasets

### Frontend Performance
- Minification and compression
- Image optimization
- CSS/JS bundling
- CDN for static assets

### Load Balancing
- Horizontal scaling with multiple server instances
- Load balancer distribution
- Session persistence

## Security Considerations

### Authentication & Authorization
- **JWT Tokens:** Secure token-based authentication
- **HTTPS Only:** All communications encrypted
- **CORS:** Configured for authorized domains
- **RBAC:** Role-based access control
- **Permission Validation:** Every API endpoint validates permissions

### Data Protection
- **Password Hashing:** Bcrypt for password security
- **SQL Injection Prevention:** Parameterized queries
- **XSS Protection:** Input sanitization
- **CSRF Protection:** CSRF tokens for state-changing operations

### API Security
- **Rate Limiting:** Prevent abuse and DoS attacks
- **Input Validation:** Strict validation of all inputs
- **Output Encoding:** Proper encoding of responses
- **API Keys:** For third-party integrations

### Infrastructure Security
- **Environment Variables:** Sensitive config in env files
- **Firewall Rules:** Restricted port access
- **Database Credentials:** Secured and rotated regularly
- **Audit Logging:** Track all system activities

### Data Privacy
- **Personal Data Protection:** GDPR compliance
- **Data Encryption:** At rest and in transit
- **Secure Deletion:** Proper data cleanup
- **Access Logs:** Monitor who accesses what

## Deployment Architecture

### Development Environment
- Local development server
- Hot reload enabled
- Detailed logging

### Staging Environment
- Pre-production testing
- Performance testing
- Load testing
- Security scanning

### Production Environment
- Render.com hosting
- SSL/TLS encryption
- Database backups
- Monitoring and alerts
- Auto-scaling capabilities

---

**Created by:** Muhammad Zain  
**Last Updated:** June 2026  
**Version:** 1.0
