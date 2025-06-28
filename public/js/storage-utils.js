// storage-utils.js

/**
 * Generate a unique ID using prefix
 * @param {string} prefix
 * @returns {string}
 */
function generateId(prefix = "ID") {
	return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Load data array from localStorage by key
 * @param {string} key
 * @returns {Array}
 */
function loadData(key) {
	try {
		return JSON.parse(localStorage.getItem(key)) || [];
	} catch (e) {
		console.error("Failed to parse storage for key:", key, e);
		return [];
	}
}

/**
 * Save data array to localStorage under key
 * @param {string} key
 * @param {Array} data
 */
function saveData(key, data) {
	localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Update item by ID in array from storage
 * @param {string} key
 * @param {string} id
 * @param {object} updatedItem
 */
function updateItem(key, id, updatedItem) {
	const data = loadData(key);
	const index = data.findIndex((item) => item.id === id);
	if (index !== -1) {
		data[index] = { ...data[index], ...updatedItem };
		saveData(key, data);
	}
}

/**
 * Delete item by ID from storage
 * @param {string} key
 * @param {string} id
 */
function deleteItem(key, id) {
	const data = loadData(key).filter((item) => item.id !== id);
	saveData(key, data);
}

/**
 * Get single item by ID
 * @param {string} key
 * @param {string} id
 * @returns {object|null}
 */
function getItem(key, id) {
	const data = loadData(key);
	return data.find((item) => item.id === id) || null;
}

// --- Mobile Sidebar Toggle Functionality ---
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
		// Remove existing event listeners to prevent duplicates
		toggleBtn.replaceWith(toggleBtn.cloneNode(true));
		const newToggleBtn = document.getElementById('sidebarToggle');
		
		newToggleBtn.onclick = function(e) {
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

// Also setup when the page becomes visible (for better reliability)
document.addEventListener('visibilitychange', () => {
	if (!document.hidden && window.innerWidth <= 767.98) {
		setTimeout(setupMobileSidebar, 100);
	}
});
