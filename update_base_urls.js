const fs = require('fs');

const jsFiles = [
    'public/js/dashboard.js',
    'public/js/bookings.js',
    'public/js/calendar.js',
    'public/js/guests.js',
    'public/js/rooms.js',
    'public/js/staff.js',
    'public/js/payments.js',
    'public/js/settings.js',
    'public/js/login.js'
];

jsFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Update BASE_URL to use relative URLs for deployment
        content = content.replace(/const BASE_URL = "http:\/\/localhost:3000";/g, 'const BASE_URL = "";');
        
        fs.writeFileSync(filePath, content);
        console.log(`Updated BASE_URL in: ${filePath}`);
    }
});

console.log('All BASE_URL references updated for deployment!'); 