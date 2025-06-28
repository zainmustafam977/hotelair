// db.js - Database configuration
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