# HotelAir Setup Guide

This guide explains how to set up and run the HotelAir project from the beginning.

## 1. Prerequisites

Before starting, make sure you have the following installed:

- Node.js LTS
- npm
- Microsoft SQL Server
- SQL Server Management Studio or Azure Data Studio (recommended)
- A web browser

## 2. Download and Open the Project

Clone or download the project and open it in your terminal or VS Code.

```bash
cd hotelair
```

## 3. Install Dependencies

Run:

```bash
npm install
```

This installs the project dependencies.

## 4. Configure the Database

The project uses SQL Server. Open `HotelAir.sql` and execute it to create the necessary tables and initial data.

Then update the database credentials in `db.js` if needed:

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

## 5. Start the Server

From the project root, run:

```bash
node server.js
```

If the server starts successfully, it will run on:

```text
http://localhost:3000
```

## 6. Open the Website

Open your browser and go to:

```text
http://localhost:3000/
```

You should see the login page.

## 7. Login Access

Use valid credentials from your database or application setup. If the login does not work, check whether the admin data exists in the database and whether the API logic matches the database schema.

## 8. Troubleshooting

### Database errors
- Verify SQL Server is running
- Confirm the database name is correct
- Confirm username/password are valid
- Check SQL port access

### Server errors
- Run `npm install` again
- Make sure no other application is using port 3000
- Check terminal messages for missing modules or syntax errors

### Frontend issues
- Ensure the app is being opened through the running Node server
- Check console errors in the browser

## 9. Final Notes

The project is meant to be easy to understand and run for academic learning. If you are presenting it, ensure the database is connected and all routes are working before the final demo.
