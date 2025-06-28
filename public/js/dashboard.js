// dashboard.js

// --- LOGIN CHECK ---
if (!localStorage.getItem("sessionUser")) {
	window.location.href = "index.html";
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

const BASE_URL = "";

function showToast(message, type = "danger") {
	const toastContainer =
		document.getElementById("toastContainer") ||
		(() => {
			const div = document.createElement("div");
			div.id = "toastContainer";
			div.className = "toast-container position-fixed bottom-0 end-0 p-3 z-3";
			document.body.appendChild(div);
			return div;
		})();
	const toast = document.createElement("div");
	toast.className = `toast align-items-center text-bg-${type} border-0 show`;
	toast.setAttribute("role", "alert");
	toast.innerHTML = `
		<div class="d-flex">
			<div class="toast-body">${message}</div>
			<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
		</div>
	`;
	toastContainer.appendChild(toast);
	setTimeout(() => toast.remove(), 4000);
}

function showModal(html, onShow) {
	let modal = document.getElementById('dashboardQuickModal');
	if (!modal) {
		modal = document.createElement('div');
		modal.className = 'modal fade';
		modal.id = 'dashboardQuickModal';
		modal.tabIndex = -1;
		modal.innerHTML = `<div class="modal-dialog"><div class="modal-content"></div></div>`;
		document.body.appendChild(modal);
	}
	modal.querySelector('.modal-content').innerHTML = html;
	const bsModal = new bootstrap.Modal(modal);
	bsModal.show();
	if (onShow) onShow(modal, bsModal);
}

function setupQuickActions() {
	// Tooltips
	const tooltipTriggerList = [].slice.call(document.querySelectorAll('#quickActions [data-bs-toggle="tooltip"]'));
	tooltipTriggerList.forEach(function (tooltipTriggerEl) {
		new bootstrap.Tooltip(tooltipTriggerEl);
	});

	document.getElementById('quickAddGuest').onclick = () => {
		showModal(`
			<form id="quickGuestForm">
				<div class="modal-header"><h5 class="modal-title">Add Guest</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
				<div class="modal-body">
					<div class="mb-2"><label>Full Name</label><input class="form-control" name="FullName" required></div>
					<div class="mb-2"><label>Email</label><input type="email" class="form-control" name="Email"></div>
					<div class="mb-2"><label>Phone</label><input class="form-control" name="Phone"></div>
					<div class="mb-2"><label>Country</label><input class="form-control" name="Country"></div>
				</div>
				<div class="modal-footer"><button type="submit" class="btn btn-primary">Add</button></div>
			</form>
		`, (modal, bsModal) => {
			modal.querySelector('#quickGuestForm').onsubmit = async (e) => {
				e.preventDefault();
				const form = e.target;
				const data = Object.fromEntries(new FormData(form));
				try {
					const res = await fetch(`${BASE_URL}/api/guests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
					if (!res.ok) throw await res.json();
					showToast('Guest added!', 'success');
					bsModal.hide();
					await fetchAll();
					loadKPIs();
					renderRecentBookings();
					renderPerformanceChart();
				} catch (err) {
					showToast(err.error || 'Failed to add guest', 'danger');
				}
			};
		});
	};
}

let allRooms = [], allBookings = [], allPayments = [], allGuests = [], allStaff = [];

async function fetchAll() {
	try {
		const [rooms, bookings, payments, guests, staff] = await Promise.all([
			fetch(`${BASE_URL}/api/rooms`).then(r => r.json()),
			fetch(`${BASE_URL}/api/bookings`).then(r => r.json()),
			fetch(`${BASE_URL}/api/payments`).then(r => r.json()),
			fetch(`${BASE_URL}/api/guests`).then(r => r.json()),
			fetch(`${BASE_URL}/api/staff`).then(r => r.json()),
		]);
		allRooms = rooms;
		allBookings = bookings;
		allPayments = payments;
		allGuests = guests;
		allStaff = staff;
	} catch (err) {
		showToast("Failed to load dashboard data", "danger");
	}
}

function filterByDate(arr, dateField) {
	// Date filtering removed for mobile optimization
	return arr;
}

function animateCounter(el, to) {
	const duration = 800;
	const start = 0;
	const step = Math.ceil(to / 30);
	let current = start;
	el.textContent = start;
	const interval = setInterval(() => {
		current += step;
		if (current >= to) {
			el.textContent = to;
			clearInterval(interval);
		} else {
			el.textContent = current;
		}
	}, duration / 30);
}

function loadKPIs() {
	const rooms = allRooms;
	const bookings = filterByDate(allBookings, "CheckIn");
	const payments = filterByDate(allPayments, "Date");
	const guests = allGuests;
	const staff = allStaff;

	const totalRooms = rooms.length;
	const availableRooms = rooms.filter((r) => r.Status === "available").length;
	const bookedRooms = totalRooms - availableRooms;

	const now = new Date();
	const thisMonth = now.getMonth();
	const thisYear = now.getFullYear();
	const revenueThisMonth = payments
		.filter(
			(p) => {
				const d = new Date(p.Date);
				return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
			}
		)
		.reduce((sum, p) => sum + parseFloat(p.Amount), 0);

	// Update main metrics
	animateCounter(totalRoomsEl, totalRooms);
	animateCounter(availableRoomsEl, availableRooms);
	occupancyRateEl.textContent = totalRooms
		? `${Math.round((bookedRooms / totalRooms) * 100)}%`
		: "0%";
	totalRevenueEl.textContent = `$${revenueThisMonth.toFixed(2)}`;

	// Update quick stats
	const totalGuestsEl = document.getElementById("totalGuests");
	const totalStaffEl = document.getElementById("totalStaff");
	const activeBookingsEl = document.getElementById("activeBookings");
	const monthlyRevenueEl = document.getElementById("monthlyRevenue");

	if (totalGuestsEl) animateCounter(totalGuestsEl, guests.length);
	if (totalStaffEl) animateCounter(totalStaffEl, staff.length);
	
	// Active bookings (confirmed + checked-in)
	const activeBookings = bookings.filter(b => 
		b.Status === "confirmed" || b.Status === "checked-in"
	).length;
	if (activeBookingsEl) animateCounter(activeBookingsEl, activeBookings);
	
	if (monthlyRevenueEl) {
		monthlyRevenueEl.textContent = `$${revenueThisMonth.toFixed(2)}`;
	}
}

function renderRecentBookings() {
	const bookings = filterByDate(allBookings, "CheckIn");
	const sorted = bookings
		.sort((a, b) => new Date(b.CheckIn) - new Date(a.CheckIn))
		.slice(0, 5);
	recentBookingsEl.innerHTML = "";
	for (const b of sorted) {
		const row = document.createElement("tr");
		row.innerHTML = `
			<td>${b.GuestName}</td>
			<td>#${b.RoomNumber}</td>
			<td>${b.CheckIn}</td>
			<td>${b.CheckOut}</td>
			<td><span class="badge bg-${statusColor(b.Status)}">${b.Status}</span></td>
		`;
		recentBookingsEl.appendChild(row);
	}
}

function renderPerformanceChart() {
	const bookings = filterByDate(allBookings, "CheckIn");
	const payments = filterByDate(allPayments, "Date");
	const days = [...Array(31).keys()].map((i) => i + 1);
	const today = new Date();
	const month = today.getMonth();
	const year = today.getFullYear();

	const bookingCounts = Array(31).fill(0);
	const dailyRevenue = Array(31).fill(0);

	bookings.forEach((b) => {
		const d = new Date(b.CheckIn);
		if (d.getMonth() === month && d.getFullYear() === year) {
			bookingCounts[d.getDate() - 1]++;
		}
	});

	payments.forEach((p) => {
		const d = new Date(p.Date);
		if (d.getMonth() === month && d.getFullYear() === year) {
			dailyRevenue[d.getDate() - 1] += parseFloat(p.Amount);
		}
	});

	const canvas = document.getElementById("performanceChart");
	if (!canvas) return;

	// Modern color palette
	const colors = {
		primary: ['#667eea', '#764ba2'],
		success: ['#11998e', '#38ef7d'],
		warning: ['#f093fb', '#f5576c'],
		info: ['#4facfe', '#00f2fe']
	};

	// Create gradient functions
	function createGradient(ctx, colorStops, startY = 0, endY = 400) {
		const gradient = ctx.createLinearGradient(0, startY, 0, endY);
		colorStops.forEach((stop, index) => {
			gradient.addColorStop(index / (colorStops.length - 1), stop);
		});
		return gradient;
	}

	const ctx = canvas.getContext('2d');
	const bookingGradient = createGradient(ctx, colors.primary);
	const revenueGradient = createGradient(ctx, colors.success);

	new Chart(canvas, {
		type: "line",
		data: {
			labels: days,
			datasets: [
				{
					label: "Daily Bookings",
					data: bookingCounts,
					borderColor: colors.primary[0],
					backgroundColor: bookingGradient,
					borderWidth: 2,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: colors.primary[0],
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 3,
					pointHoverRadius: 5,
					pointHoverBorderWidth: 2,
					yAxisID: 'y'
				},
				{
					label: "Daily Revenue ($)",
					data: dailyRevenue,
					borderColor: colors.success[0],
					backgroundColor: revenueGradient,
					borderWidth: 2,
					fill: true,
					tension: 0.4,
					pointBackgroundColor: colors.success[0],
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 3,
					pointHoverRadius: 5,
					pointHoverBorderWidth: 2,
					yAxisID: 'y1'
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: 'index',
				intersect: false,
			},
			plugins: {
				tooltip: {
					backgroundColor: 'rgba(0,0,0,0.8)',
					titleColor: '#fff',
					bodyColor: '#fff',
					borderColor: 'rgba(255,255,255,0.1)',
					borderWidth: 1,
					cornerRadius: 8,
					displayColors: true,
					callbacks: {
						label: function(context) {
							if (context.dataset.label.includes('Revenue')) {
								return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
							}
							return `${context.dataset.label}: ${context.parsed.y}`;
						}
					}
				},
				legend: {
					position: "top",
					labels: {
						padding: 10,
						usePointStyle: true,
						pointStyle: 'circle',
						font: {
							size: 11,
							weight: '600'
						}
					}
				},
			},
			scales: {
				x: {
					title: {
						display: true,
						text: "Day of Month",
						font: {
							size: 11,
							weight: '600'
						}
					},
					grid: {
						color: 'rgba(0,0,0,0.1)',
						drawBorder: false
					},
					ticks: {
						font: {
							size: 10
						},
						maxTicksLimit: 15
					}
				},
				y: {
					type: 'linear',
					display: true,
					position: 'left',
					title: {
						display: true,
						text: "Bookings",
						font: {
							size: 11,
							weight: '600'
						}
					},
					grid: {
						color: 'rgba(0,0,0,0.1)',
						drawBorder: false
					},
					ticks: {
						font: {
							size: 10
						},
						maxTicksLimit: 6
					}
				},
				y1: {
					type: 'linear',
					display: true,
					position: 'right',
					title: {
						display: true,
						text: "Revenue ($)",
						font: {
							size: 11,
							weight: '600'
						}
					},
					grid: {
						drawOnChartArea: false,
					},
					ticks: {
						callback: function(value) {
							return '$' + value.toLocaleString();
						},
						font: {
							size: 10
						},
						maxTicksLimit: 6
					}
				}
			},
			animation: {
				duration: 1500,
				easing: 'easeOutQuart'
			},
			layout: {
				padding: {
					top: 10,
					bottom: 10
				}
			}
		},
	});
}

function statusColor(status) {
	return status === "confirmed"
		? "primary"
		: status === "checked-in"
		? "success"
		: status === "checked-out"
		? "secondary"
		: status === "cancelled"
		? "danger"
		: "info";
}

function exportToPDF(data, columns, title) {
	// Create a new window with a table for printing
	const win = window.open('', '', 'width=900,height=700');
	win.document.write('<html><head><title>' + title + '</title>');
	win.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />');
	win.document.write('</head><body>');
	win.document.write('<h3 class="mb-3">' + title + '</h3>');
	win.document.write('<table class="table table-bordered"><thead><tr>' + columns.map(col => '<th>' + col.header + '</th>').join('') + '</tr></thead><tbody>');
	for (const row of data) {
		win.document.write('<tr>' + columns.map(col => '<td>' + (row[col.key] ?? '') + '</td>').join('') + '</tr>');
	}
	win.document.write('</tbody></table>');
	win.document.write('</body></html>');
	win.document.close();
	setTimeout(() => { win.print(); win.close(); }, 500);
}

function setupExportButtons() {
	const bookingsCols = [
		{ header: 'Guest', key: 'GuestName' },
		{ header: 'Room', key: 'RoomNumber' },
		{ header: 'Check-in', key: 'CheckIn' },
		{ header: 'Check-out', key: 'CheckOut' },
		{ header: 'Status', key: 'Status' },
	];

	document.getElementById('exportBookingsPDF')?.addEventListener('click', () => {
		const bookings = filterByDate(allBookings, 'CheckIn');
		exportToPDF(bookings, bookingsCols, 'Recent Bookings Report');
	});
	
	// Enable tooltips for export buttons
	const tooltipTriggerList = [].slice.call(document.querySelectorAll('#exportButtons [data-bs-toggle="tooltip"]'));
	tooltipTriggerList.forEach(function (tooltipTriggerEl) {
		new bootstrap.Tooltip(tooltipTriggerEl);
	});
}

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

// --- NOTIFICATIONS ---
let notifications = [];
let lastNotificationId = null;
async function fetchNotifications() {
	try {
		const res = await fetch(`${BASE_URL}/api/notifications`);
		notifications = await res.json();
		updateNotificationUI();
	} catch {}
}
function updateNotificationUI() {
	const bell = document.getElementById('notificationBell');
	const badge = document.getElementById('notificationBadge');
	const dropdown = document.getElementById('notificationDropdown');
	if (!bell || !badge || !dropdown) return;
	const unread = notifications.filter(n => !n.IsRead);
	badge.textContent = unread.length;
	badge.style.display = unread.length ? 'inline-block' : 'none';
	dropdown.innerHTML = notifications.length ? notifications.map(n => `
		<div class="dropdown-item d-flex align-items-start gap-2 ${n.IsRead ? '' : 'fw-bold'}" style="white-space:normal;">
			<i class="bi bi-${n.Type === 'info' ? 'info-circle' : n.Type === 'success' ? 'check-circle' : n.Type === 'warning' ? 'exclamation-triangle' : 'bell'} me-2"></i>
			<div>
				<div>${n.Title}</div>
				<small class="text-muted">${n.Message}</small>
				<div class="text-muted small">${new Date(n.CreatedAt).toLocaleString()}</div>
			</div>
		</div>`).join('') : '<div class="dropdown-item text-muted">No notifications</div>';
}
document.getElementById('notificationBell')?.addEventListener('click', () => {
	const dropdown = document.getElementById('notificationDropdown');
	if (!dropdown) return;
	dropdown.classList.toggle('show');
	// Mark all as read
	const unread = notifications.filter(n => !n.IsRead);
	unread.forEach(n => fetch(`${BASE_URL}/api/notifications/${n.NotificationID}`, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({IsRead:true})}));
	notifications.forEach(n => n.IsRead = true);
	updateNotificationUI();
});
// Poll for new notifications every 30s
setInterval(async () => {
	const prev = notifications[0]?.NotificationID;
	await fetchNotifications();
	const latest = notifications[0];
	if (latest && latest.NotificationID !== prev && !latest.IsRead) {
		showToast(latest.Title + ': ' + latest.Message, latest.Type === 'success' ? 'success' : latest.Type === 'warning' ? 'warning' : 'info');
	}
}, 30000);
// Initial load
fetchNotifications();

// --- ANALYTICS CHARTS ---
async function renderAnalyticsCharts() {
	// Modern color palette
	const colors = {
		primary: ['#667eea', '#764ba2'],
		success: ['#11998e', '#38ef7d'],
		warning: ['#f093fb', '#f5576c'],
		info: ['#4facfe', '#00f2fe']
	};

	// Create gradient functions
	function createGradient(ctx, colorStops) {
		const gradient = ctx.createLinearGradient(0, 0, 0, 400);
		colorStops.forEach((stop, index) => {
			gradient.addColorStop(index / (colorStops.length - 1), stop);
		});
		return gradient;
	}

	// Room Status Chart
	const occRes = await fetch(`${BASE_URL}/api/analytics/occupancy`);
	const occData = await occRes.json();
	const occLabels = occData.map(d => d.Status.charAt(0).toUpperCase() + d.Status.slice(1));
	const occCounts = occData.map(d => d.Count);
	const roomStatusChartEl = document.getElementById('roomStatusChart');
	
	if (roomStatusChartEl) {
		const ctx = roomStatusChartEl.getContext('2d');
		new Chart(roomStatusChartEl, {
			type: 'doughnut',
			data: {
				labels: occLabels,
				datasets: [{
					data: occCounts,
					backgroundColor: [
						createGradient(ctx, colors.success),
						createGradient(ctx, colors.primary),
						createGradient(ctx, colors.warning)
					],
					borderWidth: 0,
					hoverBorderWidth: 3,
					hoverBorderColor: '#fff',
					hoverOffset: 10
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							padding: 15,
							usePointStyle: true,
							pointStyle: 'circle',
							font: {
								size: 11,
								weight: '600'
							}
						}
					},
					tooltip: {
						backgroundColor: 'rgba(0,0,0,0.8)',
						titleColor: '#fff',
						bodyColor: '#fff',
						borderColor: 'rgba(255,255,255,0.1)',
						borderWidth: 1,
						cornerRadius: 8,
						displayColors: true,
						callbacks: {
							label: function(context) {
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = ((context.parsed / total) * 100).toFixed(1);
								return `${context.label}: ${context.parsed} (${percentage}%)`;
							}
						}
					}
				},
				cutout: '65%',
				animation: {
					animateRotate: true,
					animateScale: true,
					duration: 2000,
					easing: 'easeOutQuart'
				}
			}
		});
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	// Add spinner
	const spinner = document.createElement("div");
	spinner.className = "text-center my-3";
	spinner.id = "dashboardSpinner";
	spinner.innerHTML = '<div class="spinner-border text-primary"></div>';
	document.querySelector("main").prepend(spinner);

	// Set up references for metrics and filters
	window.totalRoomsEl = document.getElementById("totalRooms");
	window.availableRoomsEl = document.getElementById("availableRooms");
	window.occupancyRateEl = document.getElementById("occupancyRate");
	window.totalRevenueEl = document.getElementById("totalRevenue");
	window.recentBookingsEl = document.querySelector("#recentBookings tbody");
	window.metrics = document.getElementById("dashboardMetrics");

	await fetchAll();
	loadKPIs();
	renderRecentBookings();
	renderPerformanceChart();
	renderAnalyticsCharts();
	spinner.remove();
	setupExportButtons();
	setupQuickActions();

	document.getElementById('auditLogBtn')?.addEventListener('click', async () => {
		try {
			const res = await fetch(`${BASE_URL}/api/audit-log`);
			if (!res.ok) throw new Error('Failed to fetch audit log');
			const logs = await res.json();
			const tbody = document.querySelector('#auditLogTable tbody');
			tbody.innerHTML = '';
			logs.forEach(log => {
				const tr = document.createElement('tr');
				tr.innerHTML = `
					<td>${new Date(log.CreatedAt).toLocaleString()}</td>
					<td>${log.UserID || 'System'}</td>
					<td>${log.Action}</td>
					<td>${log.Entity || '-'}</td>
					<td>${log.EntityID || '-'}</td>
					<td>${log.Details || '-'}</td>
				`;
				tbody.appendChild(tr);
			});
			new bootstrap.Modal(document.getElementById('auditLogModal')).show();
		} catch (err) {
			showToast('Failed to load audit log', 'danger');
		}
	});
});
