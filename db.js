// db.js - Database configuration for online SQL Server
// Updated: Connected to online SQL Server instead of localhost
// Server: den1.mssql8.gear.host
// Database: HotelAir
// Username: hotelair

const sql = require("mssql");

const config = {
	user: "hotelair",
	password: "Zs4x_nd?mm06",
	server: "den1.mssql8.gear.host",
	database: "HotelAir",
	options: { 
		trustServerCertificate: true,
		encrypt: true,
		enableArithAbort: true
	},
};

module.exports = config; 