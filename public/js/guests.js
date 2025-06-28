// guests.js

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

document.addEventListener("DOMContentLoaded", () => {
	const tableBody = document.querySelector("#guestsTable tbody");
	const form = document.getElementById("guestForm");

	const idInput = document.getElementById("guestId");
	const nameInput = document.getElementById("guestName");
	const emailInput = document.getElementById("guestEmail");
	const phoneInput = document.getElementById("guestPhone");
	const addressInput = document.getElementById("guestAddress");

	const searchInput = document.createElement("input");
	searchInput.className = "form-control mb-3";
	searchInput.placeholder = "Search guests...";
	document
		.querySelector("main")
		.insertBefore(searchInput, document.querySelector("main").firstChild);

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
		toast.setAttribute("aria-live", "assertive");
		toast.setAttribute("aria-atomic", "true");
		toast.innerHTML = `
		  <div class="d-flex">
			<div class="toast-body">${message}</div>
			<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
		  </div>
		`;
		toastContainer.appendChild(toast);
		setTimeout(() => toast.remove(), 4000);
	}
	let isLoading = false;
	function setLoading(loading) {
		isLoading = loading;
		const spinner = document.getElementById("loadingSpinner");
		if (spinner) spinner.style.display = loading ? "block" : "none";
		if (form) form.querySelector("button[type='submit']").disabled = loading;
	}

	async function fetchGuests() {
		setLoading(true);
		try {
			const res = await fetch("/api/guests");
			if (!res.ok) throw new Error("Failed to fetch guests");
			return await res.json();
		} catch (err) {
			console.error(err);
			showToast("Failed to fetch guests", "danger");
			return [];
		} finally {
			setLoading(false);
		}
	}

	async function renderGuests(filter = "") {
		tableBody.innerHTML = "";
		const guests = await fetchGuests();
		guests
			.filter(
				(g) =>
					g.FullName.toLowerCase().includes(filter.toLowerCase()) ||
					g.Email?.toLowerCase().includes(filter.toLowerCase()) ||
					g.Phone?.toLowerCase().includes(filter.toLowerCase())
			)
			.forEach((g, index) => {
				const tr = document.createElement("tr");
				tr.innerHTML = `
				  <td>${index + 1}</td>
				  <td><a href="#" class="text-primary fw-bold" onclick="showGuestDetails(${g.GuestID});return false;">${g.FullName}</a></td>
				  <td>${g.Email || "-"}</td>
				  <td>${g.Phone || "-"}</td>
				  <td>${g.Country || "-"}</td>
				  <td>
					<button class="btn btn-sm btn-warning me-1" onclick="editGuest(${g.GuestID})"><i class="bi bi-pencil"></i></button>
					<button class="btn btn-sm btn-danger" onclick="deleteGuest(${g.GuestID})"><i class="bi bi-trash"></i></button>
				  </td>
				`;
				tableBody.appendChild(tr);
			});
	}

	window.editGuest = async function (id) {
		setLoading(true);
		try {
			const res = await fetch(`/api/guests`);
			const guests = await res.json();
			const g = guests.find((x) => x.GuestID == id);
			if (!g) return;
			idInput.value = g.GuestID;
			nameInput.value = g.FullName;
			emailInput.value = g.Email || "";
			phoneInput.value = g.Phone || "";
			addressInput.value = g.Country || "";
			new bootstrap.Modal(document.getElementById("guestModal")).show();
		} catch (err) {
			console.error("Failed to load guest", err);
			showToast("Failed to load guest", "danger");
		} finally {
			setLoading(false);
		}
	};

	window.deleteGuest = async function (id) {
		if (!confirm("Are you sure you want to delete this guest?")) return;
		setLoading(true);
		try {
			await fetch(`/api/guests/${id}`, {
				method: "DELETE",
			});
			showToast("Guest deleted.");
			renderGuests(searchInput.value);
		} catch (err) {
			console.error("Delete failed", err);
			showToast("Delete failed", "danger");
		} finally {
			setLoading(false);
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
		setLoading(true);

		let valid = true;
		let firstInvalid = null;

		const nameVal = nameInput.value.trim();
		const emailVal = emailInput.value.trim();
		const phoneVal = phoneInput.value.trim();
		const countryVal = addressInput.value.trim();

		if (!nameVal || nameVal.length < 2) {
			setFieldError(nameInput, "Full name is required and must be at least 2 characters.");
			valid = false;
			firstInvalid = firstInvalid || nameInput;
		} else {
			setFieldError(nameInput, "");
		}
		if (!emailVal || !/^\S+@\S+\.\S+$/.test(emailVal)) {
			setFieldError(emailInput, "A valid email is required.");
			valid = false;
			firstInvalid = firstInvalid || emailInput;
		} else {
			setFieldError(emailInput, "");
		}
		if (!phoneVal || !/^\+?[0-9\-\s]{7,20}$/.test(phoneVal)) {
			setFieldError(phoneInput, "A valid phone number is required (7-20 digits, may include +, -, or spaces).");
			valid = false;
			firstInvalid = firstInvalid || phoneInput;
		} else {
			setFieldError(phoneInput, "");
		}
		if (countryVal.length > 50) {
			setFieldError(addressInput, "Country must be under 50 characters.");
			valid = false;
			firstInvalid = firstInvalid || addressInput;
		} else {
			setFieldError(addressInput, "");
		}

		if (!valid) {
			setLoading(false);
			if (firstInvalid) firstInvalid.focus();
			return;
		}

		const guest = {
			FullName: nameVal,
			Email: emailVal,
			Phone: phoneVal,
			Country: countryVal,
		};
		const id = idInput.value;
		try {
			const res = await fetch(
				`/api/guests${id ? "/" + id : ""}`,
				{
					method: id ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(guest),
				}
			);
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				showToast(data.error || "Save failed", "danger");
				setLoading(false);
				return;
			}
			bootstrap.Modal.getInstance(document.getElementById("guestModal")).hide();
			form.reset();
			idInput.value = "";
			showToast("Guest saved successfully.");
			renderGuests(searchInput.value);
		} catch (err) {
			showToast("Save failed", "danger");
		} finally {
			setLoading(false);
		}
	});

	[nameInput, emailInput, phoneInput, addressInput].forEach(input => {
		input.addEventListener('input', () => setFieldError(input, ''));
	});

	searchInput.addEventListener("input", () => renderGuests(searchInput.value));
	renderGuests();

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

	window.showGuestDetails = async function(guestId) {
		const guests = await fetchGuests();
		const g = guests.find(x => x.GuestID == guestId);
		if (!g) return;
		let modal = document.getElementById('guestDetailModal');
		if (!modal) {
			modal = document.createElement('div');
			modal.className = 'modal fade';
			modal.id = 'guestDetailModal';
			modal.innerHTML = `<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Guest Details</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="guestDetailBody"></div></div></div>`;
			document.body.appendChild(modal);
		}
		document.getElementById('guestDetailBody').innerHTML = `
			<strong>Name:</strong> ${g.FullName}<br>
			<strong>Email:</strong> ${g.Email || '-'}<br>
			<strong>Phone:</strong> ${g.Phone || '-'}<br>
			<strong>Country:</strong> ${g.Country || '-'}<br>
		`;
		new bootstrap.Modal(modal).show();
	}
});
