-- Reset the demo administrator passwords after importing HotelAir.sql.
-- Change the value below before using this in a real deployment.
UPDATE UserAccount
SET PasswordHash = 'admin123'
WHERE Username IN ('Superadmin', 'admin');

-- Verify the result:
SELECT UserID, Username, PasswordHash, Role, StaffID
FROM UserAccount
WHERE Username IN ('Superadmin', 'admin');
