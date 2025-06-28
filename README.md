# HotelAir - Hotel Management System

A modern hotel management system built with Node.js, Express, and SQL Server.

## Project Structure

```
HOTELAIR/
├── server.js              # Backend API server
├── db.js                  # Database configuration
├── package.json           # Node.js dependencies
├── public/                # Frontend files
│   ├── index.html         # Login page
│   ├── dashboard.html     # Dashboard
│   ├── bookings.html      # Bookings management
│   ├── calendar.html      # Calendar view
│   ├── guests.html        # Guest management
│   ├── rooms.html         # Room management
│   ├── staff.html         # Staff management
│   ├── payments.html      # Payment management
│   ├── settings.html      # Settings
│   ├── js/                # JavaScript files
│   ├── css/               # CSS files
│   └── assets/            # Images, icons, etc.
└── HotelAir.sql           # Database schema
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the API Server
```bash
node server.js
```
The API server will run on `http://localhost:3000`

### 3. Start the Web Server
You have several options:

#### Option A: VS Code Live Server
1. Right-click on the `public/` folder in VS Code
2. Select "Open with Live Server"
3. Your app will open at `http://localhost:5500`

#### Option B: Node.js Serve
```bash
npx serve public
```

#### Option C: Python HTTP Server
```bash
cd public
python -m http.server 5500
```

### 4. Access the Application
- **Frontend**: `http://localhost:5500` (or your chosen port)
- **API**: `http://localhost:3000/api/...`

## Database Configuration

The application is configured to connect to an online SQL Server:
- **Server**: den1.mssql8.gear.host
- **Database**: HotelAir
- **Username**: hotelair

## Features

- ✅ User authentication
- ✅ Dashboard with analytics
- ✅ Room management
- ✅ Booking management
- ✅ Guest management
- ✅ Staff management
- ✅ Payment tracking
- ✅ Calendar view
- ✅ Settings management
- ✅ Dark mode support
- ✅ Responsive design

## Deployment

This project is organized for easy deployment:
- Frontend files are in the `public/` directory
- Backend files are in the root directory
- Database configuration is separate in `db.js`

## Technologies Used

- **Backend**: Node.js, Express, SQL Server
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Database**: Microsoft SQL Server
- **Charts**: Chart.js
- **Icons**: Bootstrap Icons 