// server.js
const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const Joi = require("joi");
const path = require("path");
const config = require("./db.js");
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const handleError = (res, err) => {
	console.error("❌ API Error:", err);
	if (err && err.stack) {
		console.error("❌ Stack Trace:", err.stack);
	}
	res.status(500).json({
		error: "Server error",
		details: err.message,
		stack: err.stack,
		full: err
	});
};

const roomSchema = Joi.object({
	RoomNumber: Joi.string().required(),
	TypeID: Joi.number().integer().required(),
	Price: Joi.number().positive().required(),
	Capacity: Joi.number().integer().positive().required(),
	Description: Joi.string().allow(null, ""),
});

const bookingSchema = Joi.object({
	GuestID: Joi.number().integer().required(),
	RoomID: Joi.number().integer().required(),
	CheckIn: Joi.date().required(),
	CheckOut: Joi.date().greater(Joi.ref("CheckIn")).required(),
	Status: Joi.string()
		.valid("confirmed", "checked-in", "checked-out", "cancelled")
		.required(),
});

const guestSchema = Joi.object({
	FullName: Joi.string().required(),
	Email: Joi.string().email().allow(null, ""),
	Phone: Joi.string().allow(null, ""),
	Country: Joi.string().allow(null, ""),
});

// ------------------------ ROOMS ------------------------
app.get("/api/room-types", async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query("SELECT TypeID, Name FROM RoomType");
		res.json(result.recordset);
	} catch (err) {
		handleError(res, err);
	}
});

app.get("/api/rooms", async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`
      SELECT Room.RoomID, Room.RoomNumber, Room.Price, Room.Capacity, Room.Status, Room.Description, RoomType.Name AS RoomType
      FROM Room JOIN RoomType ON Room.TypeID = RoomType.TypeID`);
		res.json(result.recordset);
	} catch (err) {
		handleError(res, err);
	}
});

app.post("/api/rooms", async (req, res) => {
	const { error, value } = roomSchema.validate(req.body, {
		stripUnknown: true,
	});
	if (error) return res.status(400).send(error.details[0].message);
	const { RoomNumber, TypeID, Price, Capacity, Description } = value;
	try {
		await sql.connect(config);
		const exists = await new sql.Request()
			.input("RoomNumber", sql.NVarChar, RoomNumber)
			.query("SELECT 1 FROM Room WHERE RoomNumber = @RoomNumber");
		if (exists.recordset.length > 0)
			return res.status(409).send("Room number exists");
		await new sql.Request()
			.input("RoomNumber", sql.NVarChar, RoomNumber)
			.input("TypeID", sql.Int, TypeID)
			.input("Price", sql.Money, Price)
			.input("Capacity", sql.Int, Capacity)
			.input("Description", sql.NVarChar, Description || null)
			.query(`INSERT INTO Room (RoomNumber, TypeID, Price, Capacity, Status, Description)
              VALUES (@RoomNumber, @TypeID, @Price, @Capacity, 'available', @Description)`);
		res.sendStatus(201);
	} catch (err) {
		handleError(res, err);
	}
});

app.put("/api/rooms/:id", async (req, res) => {
	const RoomID = req.params.id;
	const { error, value } = roomSchema.validate(req.body, {
		stripUnknown: true,
	});
	if (error) return res.status(400).send(error.details[0].message);
	const { RoomNumber, TypeID, Price, Capacity, Description } = value;
	try {
		await sql.connect(config);
		await new sql.Request()
			.input("RoomID", sql.Int, RoomID)
			.input("RoomNumber", sql.NVarChar, RoomNumber)
			.input("TypeID", sql.Int, TypeID)
			.input("Price", sql.Money, Price)
			.input("Capacity", sql.Int, Capacity)
			.input("Description", sql.NVarChar, Description || null)
			.query(
				`UPDATE Room SET RoomNumber=@RoomNumber, TypeID=@TypeID, Price=@Price, Capacity=@Capacity, Description=@Description WHERE RoomID = @RoomID`
			);
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});

app.delete("/api/rooms/:id", async (req, res) => {
	const RoomID = req.params.id;
	try {
		await sql.connect(config);
		await new sql.Request()
			.input("RoomID", sql.Int, RoomID)
			.query("DELETE FROM Room WHERE RoomID = @RoomID");
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// ------------------------ GUESTS ------------------------
app.get("/api/guests", async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(
			"SELECT PersonID AS GuestID, FullName, Email, Phone, Country FROM Person WHERE PersonType = 'Guest'"
		);
		res.json(result.recordset);
	} catch (err) {
		handleError(res, err);
	}
});

app.post("/api/guests", async (req, res) => {
	// Enhanced validation
	const { error, value } = guestSchema.validate(req.body);
	if (error) return res.status(400).json({ error: error.details[0].message });
	const { FullName, Email, Phone, Country } = value;
	// Additional validation
	if (!FullName || FullName.trim().length < 2) {
		return res.status(400).json({ error: "Full name is required and must be at least 2 characters." });
	}
	if (!Email || !/^\S+@\S+\.\S+$/.test(Email)) {
		return res.status(400).json({ error: "A valid email is required." });
	}
	if (!Phone || !/^\+?[0-9\-\s]{7,20}$/.test(Phone)) {
		return res.status(400).json({ error: "A valid phone number is required (7-20 digits, may include +, -, or spaces)." });
	}
	try {
		await sql.connect(config);
		// Check for duplicate email
		const emailExists = await new sql.Request()
			.input("Email", sql.NVarChar, Email)
			.query("SELECT 1 FROM Person WHERE Email = @Email AND PersonType = 'Guest'");
		if (emailExists.recordset.length > 0) {
			return res.status(409).json({ error: "A guest with this email already exists." });
		}
		// Check for duplicate phone
		const phoneExists = await new sql.Request()
			.input("Phone", sql.NVarChar, Phone)
			.query("SELECT 1 FROM Person WHERE Phone = @Phone AND PersonType = 'Guest'");
		if (phoneExists.recordset.length > 0) {
			return res.status(409).json({ error: "A guest with this phone number already exists." });
		}
		// Insert guest
		const person = await new sql.Request()
			.input("FullName", sql.NVarChar, FullName)
			.input("Email", sql.NVarChar, Email)
			.input("Phone", sql.NVarChar, Phone)
			.input("Country", sql.NVarChar, Country)
			.query(`INSERT INTO Person (FullName, Email, Phone, Country, PersonType)
				OUTPUT INSERTED.PersonID VALUES (@FullName, @Email, @Phone, @Country, 'Guest')`);
		const GuestID = person.recordset[0].PersonID;
		await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.query("INSERT INTO Guest (GuestID) VALUES (@GuestID)");
		res.sendStatus(201);
	} catch (err) {
		handleError(res, err);
	}
});

app.put("/api/guests/:id", async (req, res) => {
	const { error, value } = guestSchema.validate(req.body);
	if (error) return res.status(400).send(error.details[0].message);
	const GuestID = req.params.id;
	const { FullName, Email, Phone, Country } = value;
	try {
		await sql.connect(config);
		await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.input("FullName", sql.NVarChar, FullName)
			.input("Email", sql.NVarChar, Email)
			.input("Phone", sql.NVarChar, Phone)
			.input("Country", sql.NVarChar, Country)
			.query(
				"UPDATE Person SET FullName=@FullName, Email=@Email, Phone=@Phone, Country=@Country WHERE PersonID = @GuestID"
			);
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});

app.delete("/api/guests/:id", async (req, res) => {
	const GuestID = req.params.id;
	try {
		await sql.connect(config);
		// Check for payments
		const payments = await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.query("SELECT 1 FROM Payment WHERE GuestID = @GuestID");
		if (payments.recordset.length > 0) {
			return res.status(409).json({ error: "Cannot delete guest with payment records. Please delete their payments first." });
		}
		await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.query("DELETE FROM Person WHERE PersonID = @GuestID");
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// ------------------------ BOOKINGS ------------------------
app.get("/api/bookings", async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`
      SELECT Booking.BookingID, Booking.GuestID, Booking.RoomID, Booking.CheckIn, Booking.CheckOut, Booking.Status,
             P.FullName AS GuestName, R.RoomNumber
      FROM Booking
      JOIN Guest G ON Booking.GuestID = G.GuestID
      JOIN Person P ON G.GuestID = P.PersonID
      JOIN Room R ON Booking.RoomID = R.RoomID`);
		res.json(result.recordset);
	} catch (err) {
		handleError(res, err);
	}
});

app.post("/api/bookings", async (req, res) => {
	const { error, value } = bookingSchema.validate(req.body, {
		stripUnknown: true,
	});
	if (error) return res.status(400).send(error.details[0].message);
	const { GuestID, RoomID, CheckIn, CheckOut, Status } = value;
	try {
		await sql.connect(config);
		const conflict = await new sql.Request()
			.input("RoomID", sql.Int, RoomID)
			.input("CheckIn", sql.Date, CheckIn)
			.input("CheckOut", sql.Date, CheckOut).query(`SELECT 1 FROM Booking
        WHERE RoomID = @RoomID AND Status IN ('confirmed', 'checked-in')
        AND NOT (CheckOut <= @CheckIn OR CheckIn >= @CheckOut)`);
		if (conflict.recordset.length > 0)
			return res
				.status(409)
				.json({ error: "Room is already booked for selected dates" });

		// Insert booking
		const bookingResult = await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.input("RoomID", sql.Int, RoomID)
			.input("CheckIn", sql.Date, CheckIn)
			.input("CheckOut", sql.Date, CheckOut)
			.input("Status", sql.NVarChar, Status).query(`
        INSERT INTO Booking (GuestID, RoomID, CheckIn, CheckOut, Status)
        OUTPUT INSERTED.BookingID VALUES (@GuestID, @RoomID, @CheckIn, @CheckOut, @Status);
        IF @Status IN ('confirmed', 'checked-in')
          UPDATE Room SET Status = 'booked' WHERE RoomID = @RoomID;`);
		const BookingID = bookingResult.recordset[0].BookingID;

		// Calculate payment amount (Room.Price * nights)
		const roomRes = await new sql.Request()
			.input("RoomID", sql.Int, RoomID)
			.query("SELECT Price FROM Room WHERE RoomID = @RoomID");
		const price = roomRes.recordset[0]?.Price || 0;
		const nights = Math.max(1, Math.ceil((new Date(CheckOut) - new Date(CheckIn)) / (1000 * 60 * 60 * 24)));
		const amount = price * nights;
		// Insert payment
		await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.input("Amount", sql.Money, amount)
			.input("Method", sql.NVarChar, "cash")
			.input("Date", sql.Date, CheckIn)
			.input("Note", sql.NVarChar, `Auto payment for booking #${BookingID}`)
			.query(`INSERT INTO Payment (GuestID, Amount, Method, Date, Note) VALUES (@GuestID, @Amount, @Method, @Date, @Note)`);

		res.sendStatus(201);
	} catch (err) {
		handleError(res, err);
	}
});

app.put("/api/bookings/:id", async (req, res) => {
	const BookingID = req.params.id;
	const { error, value } = bookingSchema.validate(req.body, {
		stripUnknown: true,
	});
	if (error) return res.status(400).send(error.details[0].message);
	const { GuestID, RoomID, CheckIn, CheckOut, Status } = value;
	try {
		await sql.connect(config);
		const conflict = await new sql.Request()
			.input("RoomID", sql.Int, RoomID)
			.input("BookingID", sql.Int, BookingID)
			.input("CheckIn", sql.Date, CheckIn)
			.input("CheckOut", sql.Date, CheckOut).query(`
        SELECT 1 FROM Booking
        WHERE RoomID = @RoomID AND BookingID != @BookingID
        AND Status IN ('confirmed', 'checked-in')
        AND NOT (CheckOut <= @CheckIn OR CheckIn >= @CheckOut)`);
		if (conflict.recordset.length > 0)
			return res
				.status(409)
				.json({ error: "Room is already booked for selected dates" });

		await new sql.Request()
			.input("BookingID", sql.Int, BookingID)
			.input("GuestID", sql.Int, GuestID)
			.input("RoomID", sql.Int, RoomID)
			.input("CheckIn", sql.Date, CheckIn)
			.input("CheckOut", sql.Date, CheckOut)
			.input("Status", sql.NVarChar, Status).query(`
        UPDATE Booking SET GuestID=@GuestID, RoomID=@RoomID, CheckIn=@CheckIn, CheckOut=@CheckOut, Status=@Status
        WHERE BookingID = @BookingID;
        UPDATE Room SET Status =
          CASE WHEN @Status IN ('cancelled', 'checked-out') THEN 'available'
               ELSE 'booked' END
        WHERE RoomID = @RoomID;`);

		// Update payment: find payment for this guest and booking date
		const roomRes = await new sql.Request()
			.input("RoomID", sql.Int, RoomID)
			.query("SELECT Price FROM Room WHERE RoomID = @RoomID");
		const price = roomRes.recordset[0]?.Price || 0;
		const nights = Math.max(1, Math.ceil((new Date(CheckOut) - new Date(CheckIn)) / (1000 * 60 * 60 * 24)));
		const amount = price * nights;
		// Update payment (assume only one auto payment per booking/guest/date)
		await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.input("Date", sql.Date, CheckIn)
			.input("Amount", sql.Money, amount)
			.input("Note", sql.NVarChar, `Auto payment for booking #${BookingID}`)
			.query(`UPDATE Payment SET Amount=@Amount, Date=@Date, Note=@Note WHERE GuestID=@GuestID AND Note LIKE 'Auto payment for booking #%'+CAST(${BookingID} AS VARCHAR)`);

		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});

app.delete("/api/bookings/:id", async (req, res) => {
	const BookingID = req.params.id;
	try {
		await sql.connect(config);
		// Find booking info
		const bookingRes = await new sql.Request()
			.input("BookingID", sql.Int, BookingID)
			.query("SELECT GuestID, CheckIn FROM Booking WHERE BookingID = @BookingID");
		const booking = bookingRes.recordset[0];
		// Delete booking
		await new sql.Request().input("BookingID", sql.Int, BookingID).query(`
      DECLARE @RoomID INT;
      SELECT @RoomID = RoomID FROM Booking WHERE BookingID = @BookingID;
      DELETE FROM Booking WHERE BookingID = @BookingID;
      UPDATE Room SET Status = 'available' WHERE RoomID = @RoomID;`);
		// Delete payment
		if (booking) {
			await new sql.Request()
				.input("GuestID", sql.Int, booking.GuestID)
				.input("Date", sql.Date, booking.CheckIn)
				.query(`DELETE FROM Payment WHERE GuestID=@GuestID AND Date=@Date AND Note LIKE 'Auto payment for booking #%'+CAST(${BookingID} AS VARCHAR)`);
		}
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// ------------------------ STAFF ------------------------
// Get all staff
app.get("/api/staff", async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`
			SELECT S.StaffID, P.FullName, S.Role, P.Email, P.Phone, P.Country
			FROM Staff S
			JOIN Person P ON S.StaffID = P.PersonID
			WHERE P.PersonType = 'Staff'
		`);
		res.json(result.recordset);
	} catch (err) {
		handleError(res, err);
	}
});

// Add new staff
app.post("/api/staff", async (req, res) => {
	const { FullName, Email, Phone, Country, Role } = req.body;
	if (!FullName || !Role) return res.status(400).json({ error: "Full name and role are required." });
	try {
		await sql.connect(config);
		// Check for unique email
		if (Email) {
			const exists = await new sql.Request()
				.input("Email", sql.NVarChar, Email)
				.query("SELECT 1 FROM Person WHERE Email = @Email");
			if (exists.recordset.length > 0) return res.status(409).json({ error: "Email already exists." });
		}
		// Insert into Person
		const person = await new sql.Request()
			.input("FullName", sql.NVarChar, FullName)
			.input("Email", sql.NVarChar, Email || null)
			.input("Phone", sql.NVarChar, Phone || null)
			.input("Country", sql.NVarChar, Country || null)
			.query(`INSERT INTO Person (FullName, Email, Phone, Country, PersonType)
				OUTPUT INSERTED.PersonID VALUES (@FullName, @Email, @Phone, @Country, 'Staff')`);
		const StaffID = person.recordset[0].PersonID;
		// Insert into Staff
		await new sql.Request()
			.input("StaffID", sql.Int, StaffID)
			.input("Role", sql.NVarChar, Role)
			.query("INSERT INTO Staff (StaffID, Role) VALUES (@StaffID, @Role)");
		res.sendStatus(201);
	} catch (err) {
		handleError(res, err);
	}
});

// Update staff
app.put("/api/staff/:id", async (req, res) => {
	const StaffID = req.params.id;
	const { FullName, Email, Phone, Country, Role } = req.body;
	if (!FullName || !Role) return res.status(400).json({ error: "Full name and role are required." });
	try {
		await sql.connect(config);
		// Check for unique email (exclude self)
		if (Email) {
			const exists = await new sql.Request()
				.input("Email", sql.NVarChar, Email)
				.input("StaffID", sql.Int, StaffID)
				.query("SELECT 1 FROM Person WHERE Email = @Email AND PersonID != @StaffID");
			if (exists.recordset.length > 0) return res.status(409).json({ error: "Email already exists." });
		}
		await new sql.Request()
			.input("StaffID", sql.Int, StaffID)
			.input("FullName", sql.NVarChar, FullName)
			.input("Email", sql.NVarChar, Email || null)
			.input("Phone", sql.NVarChar, Phone || null)
			.input("Country", sql.NVarChar, Country || null)
			.query("UPDATE Person SET FullName=@FullName, Email=@Email, Phone=@Phone, Country=@Country WHERE PersonID = @StaffID");
		await new sql.Request()
			.input("StaffID", sql.Int, StaffID)
			.input("Role", sql.NVarChar, Role)
			.query("UPDATE Staff SET Role=@Role WHERE StaffID = @StaffID");
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});

// Delete staff
app.delete("/api/staff/:id", async (req, res) => {
	const StaffID = req.params.id;
	try {
		await sql.connect(config);
		// Prevent deleting staff with a UserAccount
		const user = await new sql.Request()
			.input("StaffID", sql.Int, StaffID)
			.query("SELECT 1 FROM UserAccount WHERE StaffID = @StaffID");
		if (user.recordset.length > 0) {
			return res.status(409).json({ error: "Cannot delete staff with a user account. Delete the user account first." });
		}
		await new sql.Request()
			.input("StaffID", sql.Int, StaffID)
			.query("DELETE FROM Person WHERE PersonID = @StaffID");
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// ------------------------ PAYMENTS ------------------------
// Get all payments (with guest name)
app.get("/api/payments", async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`
			SELECT Payment.PaymentID, Payment.GuestID, Payment.Amount, Payment.Method, Payment.Date, Payment.Note,
				P.FullName AS GuestName
			FROM Payment
			JOIN Guest G ON Payment.GuestID = G.GuestID
			JOIN Person P ON G.GuestID = P.PersonID
		`);
		res.json(result.recordset);
	} catch (err) {
		handleError(res, err);
	}
});

// Add payment
app.post("/api/payments", async (req, res) => {
	const { GuestID, Amount, Method, Date, Note } = req.body;
	const validMethods = ["cash", "card", "online"];
	if (!GuestID || !Amount || !Method || !Date) return res.status(400).json({ error: "All fields except note are required." });
	if (isNaN(Amount) || Amount <= 0) return res.status(400).json({ error: "Amount must be positive." });
	if (!validMethods.includes(Method.toLowerCase())) return res.status(400).json({ error: "Invalid payment method." });
	try {
		await sql.connect(config);
		await new sql.Request()
			.input("GuestID", sql.Int, GuestID)
			.input("Amount", sql.Money, Amount)
			.input("Method", sql.NVarChar, Method.toLowerCase())
			.input("Date", sql.Date, Date)
			.input("Note", sql.NVarChar, Note || null)
			.query(`INSERT INTO Payment (GuestID, Amount, Method, Date, Note)
				VALUES (@GuestID, @Amount, @Method, @Date, @Note)`);
		res.sendStatus(201);
	} catch (err) {
		handleError(res, err);
	}
});

// Update payment
app.put("/api/payments/:id", async (req, res) => {
	const PaymentID = req.params.id;
	const { GuestID, Amount, Method, Date, Note } = req.body;
	const validMethods = ["cash", "card", "online"];
	if (!GuestID || !Amount || !Method || !Date) return res.status(400).json({ error: "All fields except note are required." });
	if (isNaN(Amount) || Amount <= 0) return res.status(400).json({ error: "Amount must be positive." });
	if (!validMethods.includes(Method.toLowerCase())) return res.status(400).json({ error: "Invalid payment method." });
	try {
		await sql.connect(config);
		await new sql.Request()
			.input("PaymentID", sql.Int, PaymentID)
			.input("GuestID", sql.Int, GuestID)
			.input("Amount", sql.Money, Amount)
			.input("Method", sql.NVarChar, Method.toLowerCase())
			.input("Date", sql.Date, Date)
			.input("Note", sql.NVarChar, Note || null)
			.query(`UPDATE Payment SET GuestID=@GuestID, Amount=@Amount, Method=@Method, Date=@Date, Note=@Note WHERE PaymentID = @PaymentID`);
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});

// Delete payment
app.delete("/api/payments/:id", async (req, res) => {
	const PaymentID = req.params.id;
	try {
		await sql.connect(config);
		await new sql.Request()
			.input("PaymentID", sql.Int, PaymentID)
			.query("DELETE FROM Payment WHERE PaymentID = @PaymentID");
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// ------------------------ APP SETTINGS CRUD ------------------------
// Get all settings
app.get('/api/settings', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query('SELECT SettingKey, SettingValue FROM AppSettings');
		const settings = {};
		result.recordset.forEach(row => settings[row.SettingKey] = row.SettingValue);
		res.json(settings);
	} catch (err) {
		handleError(res, err);
	}
});
// Get one setting
app.get('/api/settings/:key', async (req, res) => {
	try {
		await sql.connect(config);
		const { key } = req.params;
		const result = await sql.query(`SELECT SettingValue FROM AppSettings WHERE SettingKey = '${key}'`);
		if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
		res.json({ [key]: result.recordset[0].SettingValue });
	} catch (err) {
		handleError(res, err);
	}
});
// Update one setting
app.put('/api/settings/:key', async (req, res) => {
	const { key } = req.params;
	const { value } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('SettingKey', sql.NVarChar, key)
			.input('SettingValue', sql.NVarChar, value)
			.query('UPDATE AppSettings SET SettingValue = @SettingValue WHERE SettingKey = @SettingKey');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});
// Delete one setting
app.delete('/api/settings/:key', async (req, res) => {
	const { key } = req.params;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('SettingKey', sql.NVarChar, key)
			.query('DELETE FROM AppSettings WHERE SettingKey = @SettingKey');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});
// Delete all settings
app.delete('/api/settings', async (req, res) => {
	try {
		await sql.connect(config);
		await sql.query('DELETE FROM AppSettings');
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// ------------------------ USER PREFERENCES CRUD ------------------------
// Get all preferences for a user
app.get('/api/user-preferences/:userId', async (req, res) => {
	const { userId } = req.params;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('UserID', sql.Int, userId)
			.query('SELECT SettingKey, SettingValue FROM UserPreferences WHERE UserID = @UserID');
		const prefs = {};
		result.recordset.forEach(row => prefs[row.SettingKey] = row.SettingValue);
		res.json(prefs);
	} catch (err) {
		handleError(res, err);
	}
});
// Get one preference for a user
app.get('/api/user-preferences/:userId/:key', async (req, res) => {
	const { userId, key } = req.params;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('UserID', sql.Int, userId)
			.input('SettingKey', sql.NVarChar, key)
			.query('SELECT SettingValue FROM UserPreferences WHERE UserID = @UserID AND SettingKey = @SettingKey');
		if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
		res.json({ [key]: result.recordset[0].SettingValue });
	} catch (err) {
		handleError(res, err);
	}
});
// Upsert multiple preferences for a user
app.post('/api/user-preferences/:userId', async (req, res) => {
	const { userId } = req.params;
	const prefs = req.body;
	try {
		await sql.connect(config);
		for (const key in prefs) {
			await new sql.Request()
				.input('UserID', sql.Int, userId)
				.input('SettingKey', sql.NVarChar, key)
				.input('SettingValue', sql.NVarChar, prefs[key])
				.query(`
					IF EXISTS (SELECT 1 FROM UserPreferences WHERE UserID = @UserID AND SettingKey = @SettingKey)
						UPDATE UserPreferences SET SettingValue = @SettingValue WHERE UserID = @UserID AND SettingKey = @SettingKey
					ELSE
						INSERT INTO UserPreferences (UserID, SettingKey, SettingValue) VALUES (@UserID, @SettingKey, @SettingValue)
				`);
		}
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});
// Update one preference for a user
app.put('/api/user-preferences/:userId/:key', async (req, res) => {
	const { userId, key } = req.params;
	const { value } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('UserID', sql.Int, userId)
			.input('SettingKey', sql.NVarChar, key)
			.input('SettingValue', sql.NVarChar, value)
			.query('UPDATE UserPreferences SET SettingValue = @SettingValue WHERE UserID = @UserID AND SettingKey = @SettingKey');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});
// Delete one preference for a user
app.delete('/api/user-preferences/:userId/:key', async (req, res) => {
	const { userId, key } = req.params;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('UserID', sql.Int, userId)
			.input('SettingKey', sql.NVarChar, key)
			.query('DELETE FROM UserPreferences WHERE UserID = @UserID AND SettingKey = @SettingKey');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});
// Delete all preferences for a user
app.delete('/api/user-preferences/:userId', async (req, res) => {
	const { userId } = req.params;
	try {
		await sql.connect(config);
		await new sql.Request()
			.input('UserID', sql.Int, userId)
			.query('DELETE FROM UserPreferences WHERE UserID = @UserID');
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// --- AdminProfile CRUD ---
// Get latest admin profile
app.get('/api/admin-profile', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query('SELECT TOP 1 * FROM AdminProfile ORDER BY UpdatedAt DESC');
		if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
		res.json(result.recordset[0]);
	} catch (err) {
		handleError(res, err);
	}
});
// Create admin profile
app.post('/api/admin-profile', async (req, res) => {
	const { Name, Email, Role } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('Name', sql.NVarChar, Name)
			.input('Email', sql.NVarChar, Email)
			.input('Role', sql.NVarChar, Role)
			.query('INSERT INTO AdminProfile (Name, Email, Role) OUTPUT INSERTED.* VALUES (@Name, @Email, @Role)');
		res.status(201).json(result.recordset[0]);
	} catch (err) {
		handleError(res, err);
	}
});
// Update admin profile by ID
app.put('/api/admin-profile/:id', async (req, res) => {
	const { id } = req.params;
	const { Name, Email, Role } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('AdminID', sql.Int, id)
			.input('Name', sql.NVarChar, Name)
			.input('Email', sql.NVarChar, Email)
			.input('Role', sql.NVarChar, Role)
			.query('UPDATE AdminProfile SET Name=@Name, Email=@Email, Role=@Role, UpdatedAt=GETDATE() WHERE AdminID=@AdminID');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});
// Delete admin profile by ID
app.delete('/api/admin-profile/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('AdminID', sql.Int, id)
			.query('DELETE FROM AdminProfile WHERE AdminID=@AdminID');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// --- HotelInfo CRUD ---
// Get latest hotel info
app.get('/api/hotel-info', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query('SELECT TOP 1 * FROM HotelInfo ORDER BY UpdatedAt DESC');
		if (result.recordset.length === 0) return res.status(404).json({ error: 'Not found' });
		res.json(result.recordset[0]);
	} catch (err) {
		handleError(res, err);
	}
});
// Create hotel info
app.post('/api/hotel-info', async (req, res) => {
	const { Name, Phone, Email, LogoUrl } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('Name', sql.NVarChar, Name)
			.input('Phone', sql.NVarChar, Phone)
			.input('Email', sql.NVarChar, Email)
			.input('LogoUrl', sql.NVarChar, LogoUrl)
			.query('INSERT INTO HotelInfo (Name, Phone, Email, LogoUrl) OUTPUT INSERTED.* VALUES (@Name, @Phone, @Email, @LogoUrl)');
		res.status(201).json(result.recordset[0]);
	} catch (err) {
		handleError(res, err);
	}
});
// Update hotel info by ID
app.put('/api/hotel-info/:id', async (req, res) => {
	const { id } = req.params;
	const { Name, Phone, Email, LogoUrl } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('HotelID', sql.Int, id)
			.input('Name', sql.NVarChar, Name)
			.input('Phone', sql.NVarChar, Phone)
			.input('Email', sql.NVarChar, Email)
			.input('LogoUrl', sql.NVarChar, LogoUrl)
			.query('UPDATE HotelInfo SET Name=@Name, Phone=@Phone, Email=@Email, LogoUrl=@LogoUrl, UpdatedAt=GETDATE() WHERE HotelID=@HotelID');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(200);
	} catch (err) {
		handleError(res, err);
	}
});
// Delete hotel info by ID
app.delete('/api/hotel-info/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('HotelID', sql.Int, id)
			.query('DELETE FROM HotelInfo WHERE HotelID=@HotelID');
		if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Not found' });
		res.sendStatus(204);
	} catch (err) {
		handleError(res, err);
	}
});

// LOGIN ENDPOINT
app.post("/api/login", async (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) return res.status(400).json({ message: "Username and password required" });
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input("Username", sql.NVarChar, username)
			.query("SELECT * FROM UserAccount WHERE Username = @Username");
		const user = result.recordset[0];
		if (!user) return res.status(401).json({ message: "Invalid credentials" });

		// If using bcrypt:
		// const valid = await bcrypt.compare(password, user.PasswordHash);
		// If not using bcrypt (plain text, not recommended):
		const valid = password === user.PasswordHash;

		if (!valid) return res.status(401).json({ message: "Invalid credentials" });

		// Don't send password hash to client
		delete user.PasswordHash;
		res.json({ user });
	} catch (err) {
		handleError(res, err);
	}
});

// --- Notifications CRUD ---
app.get('/api/notifications', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query('SELECT * FROM Notifications ORDER BY CreatedAt DESC');
		res.json(result.recordset);
	} catch (err) { handleError(res, err); }
});
app.post('/api/notifications', async (req, res) => {
	const { UserID, Title, Message, Type } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('UserID', sql.Int, UserID)
			.input('Title', sql.NVarChar, Title)
			.input('Message', sql.NVarChar, Message)
			.input('Type', sql.NVarChar, Type)
			.query('INSERT INTO Notifications (UserID, Title, Message, Type) OUTPUT INSERTED.* VALUES (@UserID, @Title, @Message, @Type)');
		res.status(201).json(result.recordset[0]);
	} catch (err) { handleError(res, err); }
});
app.put('/api/notifications/:id', async (req, res) => {
	const { id } = req.params;
	const { IsRead } = req.body;
	try {
		await sql.connect(config);
		await new sql.Request()
			.input('NotificationID', sql.Int, id)
			.input('IsRead', sql.Bit, IsRead)
			.query('UPDATE Notifications SET IsRead=@IsRead WHERE NotificationID=@NotificationID');
		res.sendStatus(200);
	} catch (err) { handleError(res, err); }
});
app.delete('/api/notifications/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await sql.connect(config);
		await new sql.Request()
			.input('NotificationID', sql.Int, id)
			.query('DELETE FROM Notifications WHERE NotificationID=@NotificationID');
		res.sendStatus(204);
	} catch (err) { handleError(res, err); }
});

// --- AuditLog CRUD ---
app.get('/api/audit-log', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query('SELECT * FROM AuditLog ORDER BY CreatedAt DESC');
		res.json(result.recordset);
	} catch (err) { handleError(res, err); }
});
app.post('/api/audit-log', async (req, res) => {
	const { UserID, Action, Entity, EntityID, Details } = req.body;
	try {
		await sql.connect(config);
		const result = await new sql.Request()
			.input('UserID', sql.Int, UserID)
			.input('Action', sql.NVarChar, Action)
			.input('Entity', sql.NVarChar, Entity)
			.input('EntityID', sql.Int, EntityID)
			.input('Details', sql.NVarChar, Details)
			.query('INSERT INTO AuditLog (UserID, Action, Entity, EntityID, Details) OUTPUT INSERTED.* VALUES (@UserID, @Action, @Entity, @EntityID, @Details)');
		res.status(201).json(result.recordset[0]);
	} catch (err) { handleError(res, err); }
});

// --- Analytics Endpoints ---
app.get('/api/analytics/occupancy', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`SELECT Status, COUNT(*) AS Count FROM Room GROUP BY Status`);
		res.json(result.recordset);
	} catch (err) { handleError(res, err); }
});
app.get('/api/analytics/revenue', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`SELECT MONTH(Date) AS Month, YEAR(Date) AS Year, SUM(Amount) AS Total FROM Payment GROUP BY YEAR(Date), MONTH(Date) ORDER BY Year, Month`);
		res.json(result.recordset);
	} catch (err) { handleError(res, err); }
});
app.get('/api/analytics/guests', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`SELECT Country, COUNT(*) AS Count FROM Person WHERE PersonType='Guest' GROUP BY Country`);
		res.json(result.recordset);
	} catch (err) { handleError(res, err); }
});
app.get('/api/analytics/bookings', async (req, res) => {
	try {
		await sql.connect(config);
		const result = await sql.query(`SELECT Status, COUNT(*) AS Count FROM Booking GROUP BY Status`);
		res.json(result.recordset);
	} catch (err) { handleError(res, err); }
});

// Root route - serve the main application
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve specific HTML pages for SPA routing
app.get('/dashboard', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/bookings', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'bookings.html'));
});

app.get('/calendar', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

app.get('/guests', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'guests.html'));
});

app.get('/rooms', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'rooms.html'));
});

app.get('/staff', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'staff.html'));
});

app.get('/payments', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'payments.html'));
});

app.get('/settings', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// 404 handler for any other routes
app.use((req, res) => {
	if (req.path.startsWith('/api/')) {
		return res.status(404).json({ error: 'API endpoint not found' });
	}
	// For any other route, serve index.html (SPA fallback)
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000,'0.0.0.0', () =>
	console.log("✅ HotelAir API running at http://localhost:3000")
);
