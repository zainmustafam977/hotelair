// settings.js

// preload dark theme before DOM loads (insert this in head of ALL HTML files)
// <script>document.documentElement.classList.toggle('dark-mode', JSON.parse(localStorage.getItem('settings') || '{}')?.prefs?.theme === 'dark');</script>

document.addEventListener("DOMContentLoaded", () => {
	// --- LOGIN CHECK ---
	if (!localStorage.getItem("sessionUser")) {
		window.location.href = "index.html";
		return;
	}
	// Add logout button if not present
	if (!document.getElementById("logoutBtn")) {
		const btn = document.createElement("button");
		btn.className = "btn btn-outline-danger btn-sm ms-2";
		btn.id = "logoutBtn";
		btn.textContent = "Logout";
		const header = document.querySelector("header .navbar-brand");
		if (header) header.parentElement.appendChild(btn);
	}
	document.getElementById("logoutBtn")?.addEventListener("click", () => {
		localStorage.removeItem("sessionUser");
		window.location.href = "index.html";
	});

	const adminForm = document.getElementById("adminForm");
	const hotelForm = document.getElementById("hotelForm");
	let adminId = null;
	let hotelId = null;

	// Load admin profile
	fetch("http://localhost:3000/api/admin-profile")
		.then(res => res.ok ? res.json() : null)
		.then(data => {
			if (data) {
				adminId = data.AdminID;
				document.getElementById("adminName").value = data.Name || "";
				document.getElementById("adminEmail").value = data.Email || "";
				document.getElementById("adminRole").value = data.Role || "admin";
			}
		});
	// Load hotel info
	fetch("http://localhost:3000/api/hotel-info")
		.then(res => res.ok ? res.json() : null)
		.then(data => {
			if (data) {
				hotelId = data.HotelID;
				document.getElementById("hotelName").value = data.Name || "";
				document.getElementById("hotelPhone").value = data.Phone || "";
				document.getElementById("hotelEmail").value = data.Email || "";
				document.getElementById("hotelLogo").value = data.LogoUrl || "";
			}
		});

	function showToast(msg) {
		const toast = document.createElement("div");
		toast.className =
			"toast align-items-center text-white bg-success border-0 show position-fixed bottom-0 end-0 m-4";
		toast.style.zIndex = 1055;
		toast.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
		document.body.appendChild(toast);
		setTimeout(() => toast.remove(), 3000);
	}

	async function saveSettings(settings) {
		try {
			await fetch("http://localhost:3000/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
			});
			localStorage.setItem(settingsKey, JSON.stringify(settings));
			return true;
		} catch {
			localStorage.setItem(settingsKey, JSON.stringify(settings));
			return false;
		}
	}

	adminForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const payload = {
			Name: document.getElementById("adminName").value,
			Email: document.getElementById("adminEmail").value,
			Role: document.getElementById("adminRole").value,
		};
		try {
			if (adminId) {
				await fetch(`http://localhost:3000/api/admin-profile/${adminId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			} else {
				const res = await fetch("http://localhost:3000/api/admin-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await res.json();
				adminId = data.AdminID;
			}
			showToast("Admin profile saved");
		} catch {
			showToast("Failed to save admin profile", "danger");
		}
	});

	hotelForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const payload = {
			Name: document.getElementById("hotelName").value,
			Phone: document.getElementById("hotelPhone").value,
			Email: document.getElementById("hotelEmail").value,
			LogoUrl: document.getElementById("hotelLogo").value,
		};
		try {
			if (hotelId) {
				await fetch(`http://localhost:3000/api/hotel-info/${hotelId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
			} else {
				const res = await fetch("http://localhost:3000/api/hotel-info", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const data = await res.json();
				hotelId = data.HotelID;
			}
			showToast("Hotel info saved");
		} catch {
			showToast("Failed to save hotel info", "danger");
		}
	});

	// --- PREFS FORM LOAD FROM DB ---
	const prefsForm = document.getElementById("prefsForm");
	if (prefsForm) {
		fetch("http://localhost:3000/api/settings")
			.then(res => res.json())
			.then(settings => {
				if (settings.currency) document.getElementById("currency").value = settings.currency;
				if (settings.timezone) document.getElementById("timezone").value = settings.timezone;
				if (settings.dateFormat) document.getElementById("dateFormat").value = settings.dateFormat;
			});
		prefsForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			const settings = {
				currency: document.getElementById("currency").value,
				timezone: document.getElementById("timezone").value,
				dateFormat: document.getElementById("dateFormat").value,
			};
			try {
				await fetch("http://localhost:3000/api/settings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(settings),
				});
				showToast("Preferences saved to database");
			} catch {
				showToast("Failed to save preferences to database", "danger");
			}
		});
	}

	// Backup/Import/Reset Buttons
	const dataTools = document.createElement("div");
	dataTools.className = "mt-5";
	dataTools.innerHTML = `
    <h5>🛠️ Data Management</h5>
    <div class="d-flex gap-3 flex-wrap">
      <button id="exportBtn" class="btn btn-outline-secondary">Export Backup</button>
      <input type="file" id="importFile" style="display:none;" accept="application/json" />
      <button id="importBtn" class="btn btn-outline-primary">Import Backup</button>
      <button id="resetBtn" class="btn btn-outline-danger">Clear All Data</button>
    </div>
  `;
	document.querySelector("main").appendChild(dataTools);

	document.getElementById("exportBtn").onclick = () => {
		const blob = new Blob([JSON.stringify(localStorage, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `hotelair-backup-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	document.getElementById("importBtn").onclick = () => {
		document.getElementById("importFile").click();
	};

	document.getElementById("importFile").addEventListener("change", (e) => {
		const file = e.target.files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const data = JSON.parse(event.target.result);
				for (const key in data) {
					localStorage.setItem(key, data[key]);
				}
				showToast("Data imported. Please reload.");
			} catch {
				alert("Invalid backup file");
			}
		};
		reader.readAsText(file);
	});

	document.getElementById("resetBtn").onclick = () => {
		if (confirm("This will clear ALL app data. Continue?")) {
			localStorage.clear();
			location.reload();
		}
	};

	// --- DARK MODE TOGGLE ---
	function applyTheme() {
		const theme = localStorage.getItem('theme') || 'light';
		document.documentElement.setAttribute('data-theme', theme);
		const btn = document.getElementById('darkModeToggle');
		if (btn) {
			btn.innerHTML = theme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
			btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
		}
	}
	document.getElementById('darkModeToggle')?.addEventListener('click', () => {
		const current = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
		const next = current === 'dark' ? 'light' : 'dark';
		localStorage.setItem('theme', next);
		applyTheme();
	});
	applyTheme();

	// --- USER PREFERENCES LOGIC ---
	const userPrefsForm = document.getElementById("userPrefsForm");
	const sessionUser = JSON.parse(localStorage.getItem("sessionUser") || "null");
	if (userPrefsForm && sessionUser && sessionUser.UserID) {
		// Load user preferences on page load
		fetch(`http://localhost:3000/api/user-preferences/${sessionUser.UserID}`)
			.then(res => res.json())
			.then(prefs => {
				if (prefs.Language || prefs.language) document.getElementById("userLang").value = prefs.Language || prefs.language;
				if (prefs.Notifications || prefs.notifications) document.getElementById("userNotify").value = prefs.Notifications || prefs.notifications;
				if (prefs.Theme || prefs.theme) document.getElementById("userTheme").value = prefs.Theme || prefs.theme;
			})
			.catch(() => {});
		// Save user preferences
		userPrefsForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			const prefs = {
				Language: document.getElementById("userLang").value,
				Notifications: document.getElementById("userNotify").value,
				Theme: document.getElementById("userTheme").value,
			};
			try {
				await fetch(`http://localhost:3000/api/user-preferences/${sessionUser.UserID}`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(prefs),
				});
				showToast("User preferences saved");
			} catch {
				showToast("Failed to save user preferences", "danger");
			}
		});
	}

	// --- MOBILE SIDEBAR SETUP ---
	function setupMobileSidebar() {
		// Remove any existing floating toggle
		const oldToggle = document.getElementById('sidebarToggle');
		if (oldToggle && !oldToggle.closest('.navbar')) oldToggle.remove();

		// Find or create toggle in navbar
		let navbar = document.querySelector('header.navbar, .navbar');
		if (navbar && !navbar.querySelector('.sidebar-toggle')) {
			const toggleBtn = document.createElement('button');
			toggleBtn.id = 'sidebarToggle';
			toggleBtn.className = 'sidebar-toggle btn';
			toggleBtn.innerHTML = '<i class="bi bi-list"></i>';
			toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
			toggleBtn.setAttribute('type', 'button');
			toggleBtn.setAttribute('title', 'Toggle Menu');
			
			// Insert as first element in the navbar's right-side container
			const rightContainer = navbar.querySelector('.d-flex');
			if (rightContainer) {
				rightContainer.insertBefore(toggleBtn, rightContainer.firstChild);
			} else {
				// If no right container, create one
				const newContainer = document.createElement('div');
				newContainer.className = 'd-flex align-items-center gap-2';
				navbar.appendChild(newContainer);
				newContainer.appendChild(toggleBtn);
			}
		}

		// Add overlay for mobile
		let overlay = document.getElementById('sidebarOverlay');
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.id = 'sidebarOverlay';
			overlay.className = 'sidebar-overlay';
			document.body.appendChild(overlay);
		}

		// Setup toggle functionality
		const toggleBtn = document.getElementById('sidebarToggle');
		const sidebar = document.querySelector('.sidebar, nav.bg-dark');
		
		if (toggleBtn && sidebar) {
			toggleBtn.onclick = function(e) {
				e.preventDefault();
				e.stopPropagation();
				sidebar.classList.toggle('show');
				overlay.classList.toggle('show');
				document.body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
			};
			
			// Close sidebar when clicking overlay
			overlay.onclick = function() {
				sidebar.classList.remove('show');
				overlay.classList.remove('show');
				document.body.style.overflow = '';
			};
			
			// Close sidebar on escape key
			document.addEventListener('keydown', function(e) {
				if (e.key === 'Escape' && sidebar.classList.contains('show')) {
					sidebar.classList.remove('show');
					overlay.classList.remove('show');
					document.body.style.overflow = '';
				}
			});
			
			// Close sidebar when clicking on nav links (mobile only)
			const navLinks = sidebar.querySelectorAll('.nav-link');
			navLinks.forEach(link => {
				link.addEventListener('click', () => {
					if (window.innerWidth <= 767.98) {
						sidebar.classList.remove('show');
						overlay.classList.remove('show');
						document.body.style.overflow = '';
					}
				});
			});
		}
	}

	// Initialize mobile sidebar when DOM is loaded
	document.addEventListener('DOMContentLoaded', () => {
		setupMobileSidebar();
	});

	// Re-setup on window resize to handle orientation changes
	window.addEventListener('resize', () => {
		if (window.innerWidth <= 767.98) {
			setupMobileSidebar();
		}
	});

	loadSettings();
});
// End of settings.js
