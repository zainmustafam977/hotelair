# <img src="public/favicon.png" width="32" style="vertical-align:middle;"> HotelAir - Hotel Management System

![Project Badge](https://img.shields.io/badge/HotelAir-Modern%20Hotel%20Management-blueviolet?style=for-the-badge&logo=vercel)

---

## ✨ About Us

**HotelAir** is a modern, full-featured hotel management system built as an academic project for the University of Management and Technology (UMT), Lahore.

- **Course:** IT310 - Web Technologies (Section V4)
- **Professor:** Muhammad Jawad Farooq
- **Semester:** Spring 2024
- **Team:**
  - Muhammad Zain (F2023266257) — _ZACODEC_ ([zacodec@umt.edu.pk](mailto:f2023266257@umt.edu.pk))
  - Moeen Ahmad Butt (F2021266469)
  - M. Yasir (F2022266665)

---

## 🚀 Features

| Feature                | Description                                      |
|-----------------------|--------------------------------------------------|
| 🏨 Room Management    | Add, edit, and manage hotel rooms and types      |
| 📅 Booking Management | Create, update, and track guest bookings         |
| 👥 Guest Directory    | Manage guest profiles and contact info           |
| 👨‍💼 Staff Directory  | Manage staff roles and details                   |
| 💳 Payments           | Track payments, methods, and analytics           |
| 📊 Dashboard         | Visual analytics, KPIs, and quick stats          |
| 🗓️ Calendar View      | Interactive calendar for bookings                |
| ⚙️ Settings           | App, hotel, and user preferences                 |
| 🌙 Dark Mode          | Modern UI with dark/light mode                   |
| 📱 Responsive Design  | Mobile-friendly, sidebar overlay, touch support  |
| 🔒 Secure Auth        | User login and session management                |
| 🔔 Notifications      | Alerts, audit logs, and activity tracking        |

---

## 🖼️ Screenshots

> _Add screenshots of the dashboard, bookings, calendar, and mobile view here for a visual overview._

---

## 🛠️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=flat-square&logo=microsoftsqlserver&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-563D7C?style=flat-square&logo=bootstrap&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)
![FullCalendar](https://img.shields.io/badge/FullCalendar-1976d2?style=flat-square)

---

## 📦 Project Structure

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
│   ├── about.html         # About Us page
│   ├── js/                # JavaScript files
│   ├── css/               # CSS files
│   └── assets/            # Images, icons, etc.
└── HotelAir.sql           # Database schema
```

---

## ⚡ Quick Start

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Start the API Server**
```bash
node server.js
```
API server runs at `http://localhost:3000`

### 3. **Start the Web Server**
- **Option A:** VS Code Live Server (recommended)
- **Option B:**
  ```bash
  npx serve public
  ```
- **Option C:**
  ```bash
  cd public
  python -m http.server 5500
  ```

### 4. **Access the Application**
- **Frontend:** `http://localhost:5500` (or your chosen port)
- **API:** `http://localhost:3000/api/...`

---

## 🗄️ Database Configuration

- **Server:** den1.mssql8.gear.host
- **Database:** HotelAir
- **Username:** hotelair
- **Password:** (see `db.js`)

---

## 📚 Documentation

- All code is thoroughly commented for easy understanding.
- See the [About Us](public/about.html) page for team, academic, and contact info.
- For schema details, see `HotelAir.sql`.

---

## 📬 Contact

- **Lead:** Muhammad Zain (ZACODEC) — [f2023266257@umt.edu.pk](mailto:f2023266257@umt.edu.pk)
- **Phone:** +92 302 2389814
- **University:** [UMT Lahore](https://www.umt.edu.pk/)

---

## 🙏 Acknowledgements

- Special thanks to our professor, Muhammad Jawad Farooq, for guidance and support.
- Inspired by real-world hotel management needs and modern web design best practices.

---

> _HotelAir — Making hotel management modern, efficient, and fun!_ 
