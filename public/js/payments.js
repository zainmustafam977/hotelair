// payments.js

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

const BASE_URL = "http://localhost:3000";

function showToast(message, type = "success") {
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

document.addEventListener("DOMContentLoaded", async () => {
	const tableBody = document.querySelector("#paymentsTable tbody");
	const form = document.getElementById("paymentForm");
	const summaryBox = document.createElement("div");
	const searchInput = document.createElement("input");
	const dateFrom = document.createElement("input");
	const dateTo = document.createElement("input");
	const chartToggle = document.createElement("select");

	summaryBox.className =
		"alert alert-info d-flex justify-content-between align-items-center";
	summaryBox.id = "summaryBox";
	summaryBox.style.marginBottom = "1rem";
	summaryBox.innerHTML = `<strong>Total Received:</strong> <span id="totalAmount">$0.00</span>`;

	searchInput.className = "form-control mb-2";
	searchInput.placeholder = "Search payments by guest, method or note...";

	const filterRow = document.createElement("div");
	filterRow.className = "d-flex gap-2 mb-3 align-items-center";
	
	// Date inputs for payments filtering
	dateFrom.type = dateTo.type = "date";
	dateFrom.className = dateTo.className = "form-control";
	dateFrom.id = "filterFrom";
	dateTo.id = "filterTo";
	dateFrom.placeholder = "From";
	dateTo.placeholder = "To";

	// Add labels for date filters
	const fromLabel = document.createElement("label");
	fromLabel.className = "form-label mb-0 me-2";
	fromLabel.textContent = "From:";
	fromLabel.setAttribute("for", "filterFrom");
	
	const toLabel = document.createElement("label");
	toLabel.className = "form-label mb-0 me-2";
	toLabel.textContent = "To:";
	toLabel.setAttribute("for", "filterTo");
	
	filterRow.append(searchInput, fromLabel, dateFrom, toLabel, dateTo);

	chartToggle.className = "form-select w-auto ms-auto mb-2";
	chartToggle.innerHTML = `
    <option value="bar">Bar Chart</option>
    <option value="pie">Pie Chart</option>
    <option value="doughnut">Doughnut Chart</option>
  `;

	const chartControls = document.createElement("div");
	chartControls.className =
		"d-flex justify-content-end align-items-center gap-2 mb-2";
	chartControls.appendChild(chartToggle);

	const main = document.querySelector("main");
	main.insertBefore(summaryBox, main.querySelector(".table-responsive"));
	main.insertBefore(chartControls, summaryBox);
	main.insertBefore(filterRow, chartControls);

	const idInput = document.getElementById("paymentId");
	const guestInput = document.getElementById("paymentGuest");
	const amountInput = document.getElementById("paymentAmount");
	const dateInput = document.getElementById("paymentDate");
	const methodInput = document.getElementById("paymentMethod");
	const noteInput = document.getElementById("paymentNote");

	let paymentChart;
	let allPayments = [];
	let allGuests = [];

	async function fetchGuests() {
		try {
			const res = await fetch(`${BASE_URL}/api/guests`);
			if (!res.ok) throw new Error("Failed to fetch guests");
			allGuests = await res.json();
			setGuestDropdown();
		} catch (err) {
			showToast("Failed to load guests", "danger");
		}
	}

	function setGuestDropdown(selectedId = "") {
		guestInput.innerHTML = `<option value="">Select Guest</option>` +
			allGuests.map(g => `<option value="${g.GuestID}" ${g.GuestID == selectedId ? "selected" : ""}>${g.FullName}</option>`).join("");
	}

	async function fetchPayments() {
		try {
			const res = await fetch(`${BASE_URL}/api/payments`);
			if (!res.ok) throw new Error("Failed to fetch payments");
			allPayments = await res.json();
			renderPayments();
		} catch (err) {
			showToast("Failed to load payments", "danger");
		}
	}

	function renderChart(payments, type = chartToggle.value) {
		const totals = {};
		payments.forEach((p) => {
			if (!totals[p.Method]) totals[p.Method] = 0;
			totals[p.Method] += parseFloat(p.Amount);
		});
		const labels = Object.keys(totals);
		const data = Object.values(totals);

		if (paymentChart) paymentChart.destroy();

		const chartCanvas = document.getElementById('paymentChart');
		if (!chartCanvas) return;

		if (labels.length === 0) {
			chartCanvas.style.display = 'none';
			return;
		} else {
			chartCanvas.style.display = '';
		}

		paymentChart = new Chart(chartCanvas, {
			type,
			data: {
				labels,
				datasets: [
					{
						label: "Total by Method ($)",
						data,
						backgroundColor: ["#0d6efd", "#20c997", "#ffc107", "#6f42c1"],
					},
				],
			},
			options: {
				plugins: {
					legend: { display: type !== "bar" },
					tooltip: { callbacks: { label: (ctx) => `$${ctx.raw}` } },
				},
				scales: type === "bar" ? { y: { beginAtZero: true } } : {},
				maintainAspectRatio: false,
			},
		});
	}

	function renderPayments(filter = "") {
		const from = dateFrom.value;
		const to = dateTo.value;

		tableBody.innerHTML = "";
		const payments = allPayments.filter((p) => {
			const matchText =
				(p.GuestName || "").toLowerCase().includes(filter.toLowerCase()) ||
				(p.Method || "").toLowerCase().includes(filter.toLowerCase()) ||
				(p.Note && p.Note.toLowerCase().includes(filter.toLowerCase()));
			const matchDate = (!from || p.Date >= from) && (!to || p.Date <= to);
			return matchText && matchDate;
		});

		let total = 0;
		payments.forEach((p, index) => {
			total += parseFloat(p.Amount);
			const tr = document.createElement("tr");
			tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${p.GuestName}</td>
        <td>$${p.Amount}</td>
        <td>${p.Date}</td>
        <td>${capitalizeMethod(p.Method)}</td>
        <td>${p.Note || "-"}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editPayment('${p.PaymentID}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deletePayment('${p.PaymentID}')"><i class="bi bi-trash"></i></button>
        </td>
      `;
			tableBody.appendChild(tr);
		});
		document.getElementById("totalAmount").textContent = `$${total.toFixed(2)}`;
		renderChart(payments);
	}

	function capitalizeMethod(method) {
		if (!method) return "";
		if (method.toLowerCase() === "card") return "Credit Card";
		if (method.toLowerCase() === "cash") return "Cash";
		if (method.toLowerCase() === "online") return "Online";
		return method.charAt(0).toUpperCase() + method.slice(1);
	}

	window.editPayment = function (id) {
		const p = allPayments.find((x) => x.PaymentID == id);
		if (!p) return;
		idInput.value = p.PaymentID;
		setGuestDropdown(p.GuestID);
		amountInput.value = p.Amount;
		dateInput.value = p.Date;
		methodInput.value = capitalizeMethod(p.Method);
		noteInput.value = p.Note || "";
		new bootstrap.Modal(document.getElementById("paymentModal")).show();
	};

	window.deletePayment = async function (id) {
		if (!confirm("Are you sure you want to delete this payment?")) return;
		try {
			const res = await fetch(`${BASE_URL}/api/payments/${id}`, { method: "DELETE" });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				showToast(data.error || "Delete failed", "danger");
				return;
			}
			showToast("Payment deleted.");
			await fetchPayments();
		} catch (err) {
			showToast("Delete failed", "danger");
		}
	};

	function setFieldError(input, message) {
		const errorDiv = document.getElementById(input.id + 'Error');
		if (message) {
			input.classList.add('is-invalid');
			errorDiv.textContent = message;
		} else {
			input.classList.remove('is-invalid');
			errorDiv.textContent = '';
		}
	}

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		let valid = true;
		let firstInvalid = null;

		const guestVal = guestInput.value.trim();
		const amountVal = parseFloat(amountInput.value);
		const dateVal = dateInput.value;
		const methodVal = methodInput.value;
		const noteVal = noteInput.value.trim();

		if (!guestVal) {
			setFieldError(guestInput, "Guest is required.");
			valid = false;
			firstInvalid = firstInvalid || guestInput;
		} else {
			setFieldError(guestInput, "");
		}
		if (isNaN(amountVal) || amountVal <= 0) {
			setFieldError(amountInput, "Enter a valid positive amount.");
			valid = false;
			firstInvalid = firstInvalid || amountInput;
		} else {
			setFieldError(amountInput, "");
		}
		if (!dateVal) {
			setFieldError(dateInput, "Date is required.");
			valid = false;
			firstInvalid = firstInvalid || dateInput;
		} else {
			setFieldError(dateInput, "");
		}
		if (!methodVal) {
			setFieldError(methodInput, "Method is required.");
			valid = false;
			firstInvalid = firstInvalid || methodInput;
		} else {
			setFieldError(methodInput, "");
		}
		if (noteVal.length > 255) {
			setFieldError(noteInput, "Note must be under 255 characters.");
			valid = false;
			firstInvalid = firstInvalid || noteInput;
		} else {
			setFieldError(noteInput, "");
		}

		if (!valid) {
			if (firstInvalid) firstInvalid.focus();
			return;
		}

		const PaymentID = idInput.value;
		const GuestID = guestInput.value;
		const Amount = parseFloat(amountInput.value);
		const DateVal = dateInput.value;
		const Method = methodInput.value.toLowerCase().replace("credit card", "card");
		const Note = noteInput.value;
		const validMethods = ["cash", "card", "online"];
		if (!GuestID || isNaN(Amount) || Amount <= 0 || !DateVal || !validMethods.includes(Method)) {
			showToast("Please fill all required fields with valid values.", "danger");
			return;
		}
		const payment = { GuestID, Amount, Method, Date: DateVal, Note };
		try {
			let res;
			if (PaymentID) {
				res = await fetch(`${BASE_URL}/api/payments/${PaymentID}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payment),
				});
			} else {
				res = await fetch(`${BASE_URL}/api/payments`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payment),
				});
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				showToast(data.error || "Save failed", "danger");
				return;
			}
			showToast(PaymentID ? "Payment updated." : "Payment added.");
			bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
			form.reset();
			idInput.value = "";
			await fetchPayments();
		} catch (err) {
			showToast("Save failed", "danger");
		}
	});

	[searchInput, dateFrom, dateTo, chartToggle].forEach((input) => {
		input.addEventListener("input", () => renderPayments(searchInput.value));
	});

	[guestInput, amountInput, dateInput, methodInput, noteInput].forEach(input => {
		input.addEventListener('input', () => setFieldError(input, ''));
	});

	await fetchGuests();
	await fetchPayments();
});

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
