# HotelAir - Hotel Management System

A full-featured hotel management system designed for managing rooms, bookings, guests, staff, payments, and admin operations. This project is built as a student academic project and has been updated to reflect the current team details and project information.

## Project Information

- Course: Web Engineering
- Professor: Sir Adeen Riaz
- University: Khwaja Fareed University of Engineering & Information Technology (KFUEIT)
- Group Members:
  - Laiba Noreen — ID: INFT231101091
  - Eman Rashid — ID: INFT231101100

Dear Professor Sir Adeen Riaz,

If you need any information, feel free to ask us.

---

## Project Overview

HotelAir is a modern hotel management dashboard created to streamline hotel operations. It supports:

- Room management
- Booking management
- Guest records
- Staff management
- Payment tracking
- Dashboard analytics
- Calendar scheduling
- Settings and system preferences
- User login and session handling

---

## Features

- Dashboard with analytics and KPIs
- Room inventory and status updates
- Booking creation and status tracking
- Guest directory management
- Staff member management
- Payment history and reporting
- Calendar-based booking view
- Secure login workflow
- Dark mode support
- Responsive HTML-based front-end
- REST-style backend interaction using Express and Node.js

---

## Tech Stack

- Frontend: HTML, JavaScript
- Backend: Node.js, Express
- Database: Microsoft SQL Server
- Libraries: mssql, Chart.js, FullCalendar, and lightweight browser APIs

---

## Project Structure

```text
HOTELAIR/
├── db.js                 # Database connection configuration
├── HotelAir.sql          # SQL schema and initial data
├── package.json          # Project dependencies and scripts
├── server.js             # Backend server and API routes
├── public/               # Frontend pages
│   ├── about.html
│   ├── bookings.html
│   ├── calendar.html
│   ├── dashboard.html
│   ├── guests.html
│   ├── index.html
│   ├── js/
│   ├── payments.html
│   ├── rooms.html
│   ├── settings.html
│   ├── staff.html
│   └── favicon.png
├── docs/
│   ├── setup-guide.md
│   └── viva-guide.md
├── README.md
└── package-lock.json
```

---

## Step-by-Step Setup Guide for Beginners

### 1. Install Node.js

Download and install Node.js LTS from:

https://nodejs.org/

Verify installation:

```bash
node -v
npm -v
```

If the commands work, your environment is ready.

### 2. Install Project Dependencies

Open the project folder in terminal and run:

```bash
npm install
```

This installs all modules required by the app.

### 3. Prepare the Database

This project uses Microsoft SQL Server.

#### Option A: Local SQL Server

1. Install SQL Server or SQL Server Express.
2. Create a database named `HotelAir`.
3. Open `HotelAir.sql` in SQL Server Management Studio or Azure Data Studio.
4. Execute the script to create tables and sample data.

#### Option B: Remote SQL Server

If your database is hosted remotely, update the connection details in `db.js`:

```js
const config = {
  user: 'your_username',
  password: 'your_password',
  server: 'your_server_name',
  database: 'HotelAir',
  options: {
    trustServerCertificate: true,
    encrypt: true,
    enableArithAbort: true
  }
};
```

### 4. Start the Backend Server

From the project root, run:

```bash
node server.js
```

The server should start on:

```text
http://localhost:3000
```

### 5. Open the App

Open the browser and visit:

```text
http://localhost:3000/
```

or serve the public folder with a local static server if needed:

```bash
npx serve public
```

Then open the given local URL.

### 6. Login

Use the login screen to access the dashboard.

If no credentials were created yet, check the server logic and database users or add a valid admin record to the database.

---

## Database Configuration Notes

The main database connection file is:

```text
db.js
```

It contains the SQL Server credentials and connection settings for the application. If you are running on a different machine, update the server details, username, password, and database name in that file.

---

## Common Troubleshooting

### Problem: Server does not start

Check:

- Node.js is installed
- dependencies were installed using `npm install`
- no port conflict is blocking port 3000
- database credentials are valid

### Problem: Database connection fails

Check:

- SQL Server is running
- database exists
- username/password are correct
- firewall or network access allows the connection
- `trustServerCertificate` and `encrypt` settings match your environment

### Problem: Pages do not load

Check:

- server is running
- public folder files exist
- browser is opened to correct URL
- app routes match the frontend page names

---

## Viva/Presentation Guide

This project is designed to be explained clearly in a viva. Use the following points to present it confidently.

### 1. Problem Statement
The project solves the problem of manually managing hotel operations such as room booking, guest information, payment tracking, staff records, and dashboard reporting.

### 2. Objectives
- automate manual hotel management tasks
- maintain room and booking records efficiently
- store guest and staff data centrally
- monitor hotel performance using dashboard analytics
- simplify front-office operations

### 3. Scope
The system covers:

- room management
- booking management
- guest records
- staff directory
- payment tracking
- calendar view
- administrative settings
- login-based access control

### 4. System Flow
1. User opens the login page.
2. User logs in to access the system.
3. Admin accesses dashboard and management pages.
4. Records are read/written to SQL Server.
5. Data is displayed in tables, charts, and calendar views.

### 5. Modules of the System
- Authentication module
- Dashboard module
- Room management module
- Booking management module
- Guest management module
- Staff management module
- Payment management module
- Settings module
- About page

### 6. Important Project Details
- Backend is built using Node.js and Express.
- Application data is stored in SQL Server.
- HTML pages are used for the user interface.
- JavaScript is used to handle client-side logic.
- The app is structured for simplicity and academic demonstration.

### 7. Defense Questions You Should Be Ready For

Be prepared to answer:

- What problem does this project solve?
- Why choose Node.js and SQL Server?
- How is data stored and accessed?
- What are the main modules in the project?
- How does login work?
- How do you handle room and booking records?
- What are the challenges in the project?
- How would you improve the system in future versions?

### 8. Suggested Viva Summary Script

> This project is a hotel management system designed to automate and simplify daily hotel operations. It helps users manage rooms, bookings, guests, staff, and payments in one place. The application uses Node.js and Express for backend logic, SQL Server for database storage, and HTML/JavaScript for the interface. The dashboard provides key insights and operational visibility to hotel administrators. The overall goal is to improve efficiency, reduce manual effort, and create a professional management system for use in hotel operations.

---

## Academic Team Information

- Group members:
  - Laiba Noreen — INFT231101091
  - Eman Rashid — INFT231101100
- Course: Web Engineering
- Professor: Sir Adeen Riaz
- University: Khwaja Fareed University of Engineering & Information Technology (KFUEIT)

---

## Final Notes

This project is structured for learning, demonstration, and academic evaluation. It is designed to be understandable for beginners while still demonstrating the logic and flow of a complete hotel management system.

For any clarifications, contact the group or ask the supervisor directly.

---

## License

This project is intended for academic and educational use.
