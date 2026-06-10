# API Documentation

Complete reference for HotelAir REST API endpoints, including request/response formats, authentication, and error handling.

## Table of Contents
1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Request/Response Format](#requestresponse-format)
4. [Error Handling](#error-handling)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Room Management Endpoints](#room-management-endpoints)
7. [Booking Endpoints](#booking-endpoints)
8. [Staff Management Endpoints](#staff-management-endpoints)
9. [Analytics Endpoints](#analytics-endpoints)
10. [Payment Endpoints](#payment-endpoints)

## Base URL

```
Development: http://localhost:5000/api
Production: https://hotelair-server.onrender.com/api
```

## Authentication

### JWT Token
All endpoints (except login and register) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Example Request with Authentication
```bash
curl -X GET http://localhost:5000/api/rooms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Token Expiration
- Tokens expire after 7 days
- Use the refresh endpoint to get a new token
- Store token in localStorage (browser) or secure storage

## Request/Response Format

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <token>
```

### Response Format
All responses are in JSON format:

**Success Response (2xx)**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error Response (4xx, 5xx)**
```json
{
  "success": false,
  "error": "Error code",
  "message": "Human-readable error message",
  "details": { ... }
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Examples

**Missing Authentication**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "No authentication token provided"
}
```

**Invalid Data**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "email": "Invalid email format"
  }
}
```

**Resource Not Found**
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Room with ID 999 not found"
}
```

## Authentication Endpoints

### Register User
Creates a new user account.

```http
POST /auth/register
Content-Type: application/json
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "secure_password_123",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "guest"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "guest"
  },
  "message": "User registered successfully"
}
```

### Login
Authenticates user and returns JWT token.

```http
POST /auth/login
Content-Type: application/json
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "role": "guest"
    }
  },
  "message": "Login successful"
}
```

### Logout
Invalidates the current token.

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Change Password
Updates user password.

```http
PUT /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_secure_password"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Room Management Endpoints

### Get All Rooms
Retrieves paginated list of rooms with optional filters.

```http
GET /rooms?page=1&limit=20&type=double&minPrice=50&maxPrice=200
Authorization: Bearer <token>
```

**Query Parameters**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Room type filter
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `status` (optional): Room status (available, occupied, maintenance)

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": 1,
        "roomNumber": "101",
        "roomType": "Double",
        "capacity": 2,
        "basePrice": 120.00,
        "status": "available",
        "amenities": ["WiFi", "AC", "TV"],
        "createdAt": "2026-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### Get Room by ID
Retrieves detailed information about a specific room.

```http
GET /rooms/:id
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "roomNumber": "101",
    "roomType": "Double",
    "capacity": 2,
    "basePrice": 120.00,
    "status": "available",
    "amenities": [
      { "id": 1, "name": "WiFi" },
      { "id": 2, "name": "AC" }
    ],
    "bookings": [],
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### Create Room (Admin Only)
Adds a new room to the inventory.

```http
POST /rooms
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "roomNumber": "201",
  "roomType": "Suite",
  "capacity": 4,
  "basePrice": 250.00,
  "amenities": [1, 2, 3],
  "description": "Luxury suite with ocean view"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": 51,
    "roomNumber": "201",
    "roomType": "Suite",
    "capacity": 4,
    "basePrice": 250.00,
    "status": "available",
    "createdAt": "2026-06-10T14:22:00Z"
  }
}
```

### Update Room (Admin Only)
Updates room information.

```http
PUT /rooms/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "basePrice": 275.00,
  "status": "maintenance",
  "amenities": [1, 2, 3, 4]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": { ... },
  "message": "Room updated successfully"
}
```

### Delete Room (Admin Only)
Deletes a room from the system.

```http
DELETE /rooms/:id
Authorization: Bearer <token>
```

**Response (204 No Content)**

### Check Availability
Checks room availability for a date range.

```http
GET /rooms/availability?checkIn=2026-07-01&checkOut=2026-07-05&type=double
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "availableRooms": [
      {
        "id": 1,
        "roomNumber": "101",
        "roomType": "Double",
        "basePrice": 120.00
      }
    ],
    "unavailableRooms": [
      {
        "id": 5,
        "roomNumber": "105",
        "reason": "Already booked"
      }
    ]
  }
}
```

## Booking Endpoints

### Get All Bookings
Retrieves user's bookings or all bookings (admin).

```http
GET /bookings?page=1&limit=20&status=confirmed&guestId=5
Authorization: Bearer <token>
```

**Query Parameters**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Booking status (confirmed, cancelled, completed)
- `guestId` (optional): Filter by guest ID (admin only)
- `roomId` (optional): Filter by room ID

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": 1,
        "guestId": 5,
        "guestName": "John Doe",
        "roomId": 1,
        "roomNumber": "101",
        "checkInDate": "2026-07-01",
        "checkOutDate": "2026-07-05",
        "numberOfGuests": 2,
        "totalPrice": 480.00,
        "status": "confirmed",
        "paymentStatus": "paid",
        "createdAt": "2026-06-10T10:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### Get Booking by ID
Retrieves detailed booking information.

```http
GET /bookings/:id
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "guestId": 5,
    "roomId": 1,
    "checkInDate": "2026-07-01",
    "checkOutDate": "2026-07-05",
    "numberOfGuests": 2,
    "totalPrice": 480.00,
    "status": "confirmed",
    "paymentStatus": "paid",
    "specialRequests": "Early check-in if possible",
    "createdAt": "2026-06-10T10:30:00Z"
  }
}
```

### Create Booking
Creates a new booking.

```http
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "roomId": 1,
  "checkInDate": "2026-07-01",
  "checkOutDate": "2026-07-05",
  "numberOfGuests": 2,
  "specialRequests": "Early check-in preferred"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": 125,
    "roomId": 1,
    "checkInDate": "2026-07-01",
    "checkOutDate": "2026-07-05",
    "totalPrice": 480.00,
    "status": "pending",
    "paymentStatus": "pending",
    "bookingReference": "HTA-125-2026"
  }
}
```

### Update Booking
Modifies an existing booking.

```http
PUT /bookings/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "checkOutDate": "2026-07-06",
  "specialRequests": "Late checkout needed"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": { ... },
  "message": "Booking updated successfully"
}
```

### Cancel Booking
Cancels a booking.

```http
POST /bookings/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "reason": "Change of plans",
  "notifyGuest": true
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "refundAmount": 400.00
}
```

## Staff Management Endpoints

### Get All Staff
Retrieves list of staff members.

```http
GET /staff?page=1&limit=20&department=reception
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": 1,
        "userId": 10,
        "name": "Jane Smith",
        "email": "jane@hotelair.com",
        "department": "Reception",
        "position": "Manager",
        "hireDate": "2025-01-15",
        "salary": 3500.00,
        "status": "active"
      }
    ],
    "pagination": { ... }
  }
}
```

### Add Staff Member (Admin Only)
Adds a new staff member.

```http
POST /staff
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@hotelair.com",
  "department": "Reception",
  "position": "Manager",
  "hireDate": "2026-06-01",
  "salary": 3500.00
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": { ... }
}
```

### Update Staff (Admin Only)
Updates staff information.

```http
PUT /staff/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "position": "Senior Manager",
  "salary": 4000.00
}
```

### Delete Staff (Admin Only)
Removes a staff member.

```http
DELETE /staff/:id
Authorization: Bearer <token>
```

## Analytics Endpoints

### Get Dashboard Statistics
Retrieves key metrics and statistics.

```http
GET /analytics/dashboard?startDate=2026-06-01&endDate=2026-06-30
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "totalBookings": 150,
    "totalRevenue": 45000.00,
    "occupancyRate": 85.5,
    "averageRoomPrice": 300.00,
    "newGuestsThisMonth": 120,
    "repeatGuestRate": 15.0
  }
}
```

### Get Occupancy Report
Retrieves occupancy statistics.

```http
GET /analytics/occupancy?startDate=2026-06-01&endDate=2026-06-30&roomType=all
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "averageOccupancy": 82.3,
    "totalNights": 900,
    "occupiedNights": 740,
    "roomTypeBreakdown": {
      "single": 78.5,
      "double": 85.2,
      "suite": 88.0
    }
  }
}
```

### Get Revenue Report
Retrieves revenue analytics.

```http
GET /analytics/revenue?startDate=2026-06-01&endDate=2026-06-30
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 45000.00,
    "averageRevenuePerBooking": 300.00,
    "topRooms": [
      { "roomId": 1, "revenue": 5000.00 },
      { "roomId": 5, "revenue": 4500.00 }
    ],
    "revenueByDay": [ ... ]
  }
}
```

### Export Report
Exports analytics report as PDF or CSV.

```http
GET /analytics/export?type=revenue&format=pdf&startDate=2026-06-01&endDate=2026-06-30
Authorization: Bearer <token>
```

**Response (200 OK - File Download)**

## Payment Endpoints

### Process Payment
Processes a payment for a booking.

```http
POST /payments/process
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**
```json
{
  "bookingId": 1,
  "amount": 480.00,
  "paymentMethod": "card",
  "tokenId": "tok_visa"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_1234567890",
    "bookingId": 1,
    "amount": 480.00,
    "status": "succeeded",
    "message": "Payment processed successfully"
  }
}
```

### Get Payment History
Retrieves payment transaction history.

```http
GET /payments/history?bookingId=1
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "bookingId": 1,
        "amount": 480.00,
        "status": "succeeded",
        "date": "2026-06-10T14:22:00Z",
        "method": "card"
      }
    ]
  }
}
```

### Generate Invoice
Generates and sends invoice for a booking.

```http
POST /payments/invoice/:bookingId
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "invoiceId": "INV-001-2026",
    "bookingId": 1,
    "amount": 480.00,
    "sentTo": "guest@example.com"
  },
  "message": "Invoice generated and sent successfully"
}
```

---

**Related Documentation:**
- [Getting Started Guide](./GETTING_STARTED.md) - Setup instructions
- [Architecture Overview](./ARCHITECTURE.md) - System design
- [Database Schema](./DATABASE.md) - Data structure

