# Database Schema

Complete database schema for HotelAir hotel management system, including table definitions, relationships, and SQL structure.

## Table of Contents
1. [Overview](#overview)
2. [Users Table](#users-table)
3. [Rooms Table](#rooms-table)
4. [Amenities Table](#amenities-table)
5. [Room Amenities](#room-amenities)
6. [Bookings Table](#bookings-table)
7. [Staff Table](#staff-table)
8. [Schedule Table](#schedule-table)
9. [Payments Table](#payments-table)
10. [Invoices Table](#invoices-table)
11. [Database Indexes](#database-indexes)
12. [Relationships Diagram](#relationships-diagram)

## Overview

HotelAir uses PostgreSQL as its primary database. The schema is designed for:
- ACID compliance and data integrity
- Efficient query performance
- Scalability for hotel operations
- Support for complex business logic

**Database Name:** `hotelair_db`

## Users Table

Stores user accounts and authentication information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'guest', -- admin, manager, staff, guest
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, suspended
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT check_valid_role CHECK (role IN ('admin', 'manager', 'staff', 'guest'));
ALTER TABLE users ADD CONSTRAINT check_valid_status CHECK (status IN ('active', 'inactive', 'suspended'));
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `email`: User email (Unique)
- `password_hash`: Bcrypt hashed password
- `first_name`: User's first name
- `last_name`: User's last name
- `phone`: Contact phone number
- `address`: Street address
- `city`: City name
- `country`: Country name
- `postal_code`: Postal/ZIP code
- `role`: User role for access control
- `status`: Account status
- `email_verified`: Email verification status
- `last_login`: Last login timestamp
- `created_at`: Record creation time
- `updated_at`: Last update time

## Rooms Table

Stores hotel room inventory information.

```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) UNIQUE NOT NULL,
  floor INT NOT NULL,
  room_type VARCHAR(50) NOT NULL, -- Single, Double, Suite, Deluxe
  capacity INT NOT NULL CHECK (capacity > 0),
  bed_type VARCHAR(50), -- Single, Double, Queen, King
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price > 0),
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'available', -- available, occupied, maintenance, cleaning
  last_maintenance_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints
ALTER TABLE rooms ADD CONSTRAINT check_valid_room_type CHECK (room_type IN ('Single', 'Double', 'Suite', 'Deluxe'));
ALTER TABLE rooms ADD CONSTRAINT check_valid_status CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning'));
ALTER TABLE rooms ADD CONSTRAINT check_valid_floor CHECK (floor > 0);
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `room_number`: Room number (Unique)
- `floor`: Floor number
- `room_type`: Type of room
- `capacity`: Maximum guests
- `bed_type`: Type of bed(s)
- `base_price`: Nightly rate
- `description`: Room description
- `status`: Current room status
- `last_maintenance_date`: Last maintenance date
- `created_at`: Record creation time
- `updated_at`: Last update time

## Amenities Table

Stores available room amenities.

```sql
CREATE TABLE amenities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  category VARCHAR(50), -- bathroom, bedroom, kitchen, entertainment, other
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `name`: Amenity name (Unique)
- `description`: Detailed description
- `icon`: Icon reference (Font Awesome, Material Icons)
- `category`: Amenity category
- `created_at`: Record creation time
- `updated_at`: Last update time

**Example Amenities:**
```sql
INSERT INTO amenities (name, description, icon, category) VALUES
('WiFi', 'High-speed wireless internet', 'wifi', 'entertainment'),
('Air Conditioning', 'Central air conditioning', 'snowflake', 'bedroom'),
('TV', 'Flat-screen television', 'tv', 'entertainment'),
('Mini Bar', 'In-room mini bar', 'wine-glass-alt', 'kitchen'),
('Desk', 'Work desk', 'desk', 'bedroom'),
('Safe', 'In-room safe', 'lock', 'bedroom');
```

## Room Amenities

Junction table for many-to-many relationship between rooms and amenities.

```sql
CREATE TABLE room_amenities (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  amenity_id INT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (room_id, amenity_id)
);

CREATE INDEX idx_room_amenities_room_id ON room_amenities(room_id);
CREATE INDEX idx_room_amenities_amenity_id ON room_amenities(amenity_id);
```

## Bookings Table

Stores guest booking records.

```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booking_reference VARCHAR(20) UNIQUE NOT NULL,
  guest_id INT NOT NULL REFERENCES users(id),
  room_id INT NOT NULL REFERENCES rooms(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INT NOT NULL CHECK (number_of_guests > 0),
  number_of_rooms INT NOT NULL DEFAULT 1 CHECK (number_of_rooms > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, checked_in, checked_out, cancelled
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, partial, paid, refunded
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (check_out_date > check_in_date),
  CHECK (final_price = total_price - discount_amount)
);

CREATE INDEX idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_check_in ON bookings(check_in_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `booking_reference`: Human-readable booking ID
- `guest_id`: Reference to guest (Users table)
- `room_id`: Reference to room (Rooms table)
- `check_in_date`: Check-in date
- `check_out_date`: Check-out date
- `number_of_guests`: Number of guests
- `number_of_rooms`: Number of rooms booked
- `total_price`: Price before discount
- `discount_amount`: Discount applied
- `final_price`: Price after discount
- `status`: Booking status
- `payment_status`: Payment status
- `special_requests`: Special guest requests
- `created_at`: Record creation time
- `updated_at`: Last update time

## Staff Table

Stores employee information.

```sql
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL, -- Reception, Housekeeping, Management, Kitchen, etc.
  position VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL,
  salary DECIMAL(10, 2),
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, on_leave
  manager_id INT REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_staff_manager_id ON staff(manager_id);
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `user_id`: Reference to user account
- `employee_id`: Employee ID number
- `department`: Department name
- `position`: Job position
- `hire_date`: Employment start date
- `salary`: Monthly salary
- `status`: Employment status
- `manager_id`: Reference to manager (self-join)
- `created_at`: Record creation time
- `updated_at`: Last update time

## Schedule Table

Stores employee work schedules.

```sql
CREATE TABLE schedule (
  id SERIAL PRIMARY KEY,
  staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type VARCHAR(50), -- morning, afternoon, night
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (end_time > start_time)
);

CREATE INDEX idx_schedule_staff_id ON schedule(staff_id);
CREATE INDEX idx_schedule_date ON schedule(shift_date);
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `staff_id`: Reference to staff member
- `shift_date`: Date of shift
- `shift_type`: Type of shift
- `start_time`: Shift start time
- `end_time`: Shift end time
- `status`: Shift status
- `notes`: Additional notes
- `created_at`: Record creation time
- `updated_at`: Last update time

## Payments Table

Stores payment transaction records.

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(50) UNIQUE NOT NULL,
  booking_id INT NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50), -- card, bank_transfer, cash, check
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded
  stripe_charge_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `transaction_id`: Unique transaction reference
- `booking_id`: Reference to booking
- `amount`: Payment amount
- `payment_method`: Method of payment
- `payment_status`: Transaction status
- `stripe_charge_id`: Stripe charge ID (if applicable)
- `processed_at`: Payment processing timestamp
- `created_at`: Record creation time
- `updated_at`: Last update time

## Invoices Table

Stores generated invoices.

```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(20) UNIQUE NOT NULL,
  booking_id INT NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  due_date DATE,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

**Columns:**
- `id`: Unique identifier (Primary Key)
- `invoice_number`: Invoice number
- `booking_id`: Reference to booking
- `amount`: Invoice amount
- `status`: Invoice status
- `due_date`: Payment due date
- `sent_at`: Date invoice was sent
- `paid_at`: Date invoice was paid
- `created_at`: Record creation time
- `updated_at`: Last update time

## Database Indexes

```sql
-- User Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Room Indexes
CREATE INDEX idx_rooms_room_number ON rooms(room_number);
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_rooms_status ON rooms(status);

-- Booking Indexes (already defined above)

-- Staff Indexes (already defined above)

-- Schedule Indexes (already defined above)

-- Payment Indexes (already defined above)

-- Invoice Indexes (already defined above)

-- Composite Indexes for common queries
CREATE INDEX idx_bookings_guest_check_in ON bookings(guest_id, check_in_date);
CREATE INDEX idx_bookings_room_dates ON bookings(room_id, check_in_date, check_out_date);
CREATE INDEX idx_payments_booking_status ON payments(booking_id, payment_status);
```

## Relationships Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Users (1)                         │
│  ────────────────────────────────────────────────── │
│  id | email | password_hash | role | ...            │
└────────────┬────────────────────────────┬────────────┘
             │ (1)                        │ (1)
             │                            │
             ├──(N) Bookings              │
             │                            │
             └──(1) Staff                 │
                                          │
┌─────────────────────────────────────────────────────┐
│                   Rooms (1)                          │
│  ────────────────────────────────────────────────── │
│  id | room_number | type | capacity | price | ...  │
└────────────┬────────────────────────────────────────┘
             │ (1)
             │
             ├──(N) Bookings
             │
             └──(M) Room_Amenities ──── (N) Amenities


┌─────────────────────────────────────────────────────┐
│                 Bookings (1)                         │
│  ────────────────────────────────────────────────── │
│  id | guest_id | room_id | check_in | check_out    │
└────────────┬────────────────────────────────────────┘
             │ (1)
             │
             ├──(N) Payments
             │
             └──(N) Invoices


┌─────────────────────────────────────────────────────┐
│                   Staff (1)                          │
│  ────────────────────────────────────────────────── │
│  id | user_id | employee_id | department | ...     │
└────────────┬────────────────────────────────────────┘
             │ (1)
             │
             └──(N) Schedule
```

## Data Integrity Constraints

### Foreign Key Constraints
- Bookings → Users (guest_id)
- Bookings → Rooms (room_id)
- Staff → Users (user_id)
- Staff → Staff (manager_id - self-referencing)
- Room_Amenities → Rooms (room_id)
- Room_Amenities → Amenities (amenity_id)
- Payments → Bookings (booking_id)
- Invoices → Bookings (booking_id)
- Schedule → Staff (staff_id)

### Cascade Delete Rules
- Delete User: Bookings remain (integrity) - manual cleanup
- Delete Room: Room_Amenities deleted, Bookings updated
- Delete Staff: Schedule deleted
- Delete Amenity: Room_Amenities deleted

### Check Constraints
- Email format validation
- Capacity > 0
- Prices > 0
- Check-out date > Check-in date
- End time > Start time
- Calculated fields match requirements

## Sample Queries

### Find Available Rooms for Date Range
```sql
SELECT r.id, r.room_number, r.room_type, r.capacity, r.base_price
FROM rooms r
WHERE r.id NOT IN (
  SELECT DISTINCT room_id FROM bookings
  WHERE status != 'cancelled'
  AND check_in_date < '2026-07-05'
  AND check_out_date > '2026-07-01'
)
AND r.status = 'available'
ORDER BY r.base_price;
```

### Get Guest Booking History
```sql
SELECT b.id, b.booking_reference, r.room_number, b.check_in_date, 
       b.check_out_date, b.final_price, b.status
FROM bookings b
JOIN rooms r ON b.room_id = r.id
WHERE b.guest_id = 5
ORDER BY b.check_in_date DESC;
```

### Calculate Monthly Revenue
```sql
SELECT 
  DATE_TRUNC('month', b.check_in_date)::DATE as month,
  COUNT(*) as total_bookings,
  SUM(b.final_price) as total_revenue,
  AVG(b.final_price) as avg_booking_value
FROM bookings b
WHERE b.status = 'completed'
GROUP BY DATE_TRUNC('month', b.check_in_date)
ORDER BY month DESC;
```

---

**Related Documentation:**
- [Architecture Overview](./ARCHITECTURE.md) - System design
- [API Documentation](./API.md) - API endpoints
- [Getting Started Guide](./GETTING_STARTED.md) - Setup instructions

