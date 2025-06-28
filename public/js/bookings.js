// bookings.js — SQL Server integrated version + conflict toast UX

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
	toast.setAttribute("aria-live", "assertive");
	toast.setAttribute("aria-atomic", "true");
	toast.innerHTML = `
	  <div class="d-flex">
		<div class="toast-body">${message}</div>
		<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
	  </div>
	`;
	toastContainer.appendChild(toast);
	setTimeout(() => toast.remove(), 5000);
}

document.addEventListener("DOMContentLoaded", () => {
	const tableBody = document.querySelector("#bookingsTable tbody");
	const form = document.getElementById("bookingForm");

	const idInput = document.getElementById("bookingId");
	const guestInput = document.getElementById("guestName");
	const roomSelect = document.getElementById("roomSelect");
	const checkinInput = document.getElementById("checkin");
	const checkoutInput = document.getElementById("checkout");
	const statusInput = document.getElementById("bookingStatus");

	const guestInfoBox = document.createElement("div");
	guestInfoBox.className = "mb-2 text-muted small";
	guestInput.parentElement.appendChild(guestInfoBox);

	let allGuests = [];
	let allBookings = [];
	let allRooms = [];
	let isLoading = false;

	const main = document.querySelector("main");
	const filterRow = document.createElement("div");
	filterRow.className = "d-flex gap-2 mb-3 align-items-center";

	const searchInput = document.createElement("input");
	searchInput.className = "form-control";
	searchInput.placeholder = "Search by guest, room, status...";

	const filterStatus = document.createElement("select");
	filterStatus.className = "form-select w-auto";
	filterStatus.innerHTML = `
    <option value="">All Statuses</option>
    <option value="confirmed">Confirmed</option>
    <option value="checked-in">Checked-in</option>
    <option value="checked-out">Checked-out</option>
    <option value="cancelled">Cancelled</option>
  `;

	// Create label and input wrapper for check-in date
	const checkinWrapper = document.createElement("div");
	checkinWrapper.className = "d-flex flex-column";
	const checkinLabel = document.createElement("label");
	checkinLabel.className = "form-label small mb-1";
	checkinLabel.textContent = "Check-in From:";
	const filterFrom = document.createElement("input");
	filterFrom.type = "date";
	filterFrom.className = "form-control";
	checkinWrapper.appendChild(checkinLabel);
	checkinWrapper.appendChild(filterFrom);

	// Create label and input wrapper for check-out date
	const checkoutWrapper = document.createElement("div");
	checkoutWrapper.className = "d-flex flex-column";
	const checkoutLabel = document.createElement("label");
	checkoutLabel.className = "form-label small mb-1";
	checkoutLabel.textContent = "Check-in To:";
	const filterTo = document.createElement("input");
	filterTo.type = "date";
	filterTo.className = "form-control";
	checkoutWrapper.appendChild(checkoutLabel);
	checkoutWrapper.appendChild(filterTo);

	filterRow.append(searchInput, filterStatus, checkinWrapper, checkoutWrapper);
	main.insertBefore(filterRow, main.querySelector(".table-responsive"));

	const summary = document.createElement("div");
	summary.id = "bookingSummary";
	summary.className =
		"alert alert-light border mb-3 d-flex justify-content-around";
	main.insertBefore(summary, filterRow);

	function setLoading(loading) {
		isLoading = loading;
		const spinner = document.getElementById("loadingSpinner");
		if (spinner) spinner.style.display = loading ? "block" : "none";
		if (form) form.querySelector("button[type='submit']").disabled = loading;
	}

	async function loadGuests() {
		setLoading(true);
		const res = await fetch(`${BASE_URL}/api/guests`);
		allGuests = await res.json();
		const names = allGuests.map((g) => g.FullName);
		let datalist = document.getElementById("guestList");
		if (!datalist) {
			datalist = document.createElement("datalist");
			datalist.id = "guestList";
			document.body.appendChild(datalist);
		}
		guestInput.setAttribute("list", "guestList");
		datalist.innerHTML = names.map((n) => `<option value="${n}">`).join("");

		guestInput.addEventListener("input", () => {
			const match = allGuests.find((g) => g.FullName === guestInput.value);
			guestInfoBox.textContent = match
				? `${match.Email || ""} ${match.Phone || ""}`.trim()
				: "";
		});
		setLoading(false);
	}

	async function loadBookings() {
		setLoading(true);
		const res = await fetch(`${BASE_URL}/api/bookings`);
		allBookings = await res.json();
		renderBookings();
		setLoading(false);
	}

	async function loadRooms(checkIn = null, checkOut = null, currentRoomId = null) {
		setLoading(true);
		const res = await fetch(`${BASE_URL}/api/rooms`);
		allRooms = await res.json();
		if (checkIn && checkOut) {
			// Filter rooms that are available for the selected dates
			const bookingsRes = await fetch(`${BASE_URL}/api/bookings`);
			const bookings = await bookingsRes.json();
			const unavailableRoomIds = new Set(
				bookings
					.filter(
						(b) =>
							b.Status === "confirmed" || b.Status === "checked-in"
					)
					.filter(
						(b) =>
							!(b.CheckOut <= checkIn || b.CheckIn >= checkOut)
					)
					.map((b) => b.RoomID)
			);
			allRooms = allRooms.filter(
				(room) =>
					!unavailableRoomIds.has(room.RoomID) || room.RoomID === currentRoomId
			);
		}
		loadRoomOptions();
		setLoading(false);
	}

	function renderSummary(filtered) {
		const total = filtered.length;
		const count = (status) =>
			filtered.filter((b) => b.Status === status).length;
		
		// Mobile-friendly summary layout
		const isMobile = window.innerWidth <= 767.98;
		
		if (isMobile) {
			summary.innerHTML = `
				<div class="row g-2">
					<div class="col-6"><strong>Total:</strong> ${total}</div>
					<div class="col-6"><strong>Confirmed:</strong> ${count("confirmed")}</div>
					<div class="col-6"><strong>Checked-in:</strong> ${count("checked-in")}</div>
					<div class="col-6"><strong>Checked-out:</strong> ${count("checked-out")}</div>
					<div class="col-6"><strong>Cancelled:</strong> ${count("cancelled")}</div>
				</div>
			`;
		} else {
		summary.innerHTML = `
			<div>Total: <strong>${total}</strong></div>
			<div>Confirmed: <strong>${count("confirmed")}</strong></div>
			<div>Checked-in: <strong>${count("checked-in")}</strong></div>
			<div>Checked-out: <strong>${count("checked-out")}</strong></div>
			<div>Cancelled: <strong>${count("cancelled")}</strong></div>
		`;
		}
	}

	function renderBookings() {
		tableBody.innerHTML = "";
		const keyword = searchInput.value.toLowerCase();
		const status = filterStatus.value;
		const from = filterFrom.value;
		const to = filterTo.value;

		const filtered = allBookings.filter((b) => {
			const matchesText =
				b.GuestName.toLowerCase().includes(keyword) ||
				b.RoomNumber.toLowerCase().includes(keyword) ||
				b.Status.toLowerCase().includes(keyword);
			const matchesStatus = status ? b.Status === status : true;
			const matchesDate =
				(!from || b.CheckIn >= from) && (!to || b.CheckIn <= to);
			return matchesText && matchesStatus && matchesDate;
		});

		filtered.forEach((b, i) => {
			const guest = allGuests.find(g => g.GuestID === b.GuestID);
			const room = allRooms.find(r => r.RoomID === b.RoomID);
			const tr = document.createElement("tr");
			tr.innerHTML = `
				<td>${i + 1}</td>
				<td><a href="#" class="text-primary fw-bold" onclick="showGuestDetails(${b.GuestID});return false;">${b.GuestName}</a></td>
				<td><a href="#" class="text-primary fw-bold" onclick="showRoomDetails(${b.RoomID});return false;">#${b.RoomNumber}</a></td>
				<td>${b.CheckIn}</td>
				<td>${b.CheckOut}</td>
				<td><span class="badge bg-${statusBadge(b.Status)}">${b.Status}</span></td>
				<td>
					<button class="btn btn-sm btn-warning me-1" onclick="editBooking(${b.BookingID})"><i class="bi bi-pencil"></i></button>
					<button class="btn btn-sm btn-danger" onclick="deleteBooking(${b.BookingID})"><i class="bi bi-trash"></i></button>
				</td>`;
			tableBody.appendChild(tr);
		});
		renderSummary(filtered);
	}

	function statusBadge(status) {
		return status === "confirmed"
			? "success"
			: status === "checked-in"
			? "primary"
			: status === "checked-out"
			? "dark"
			: "secondary";
	}

	function loadRoomOptions() {
		roomSelect.innerHTML = "";
		allRooms.forEach((room) => {
			const opt = document.createElement("option");
			opt.value = room.RoomID;
			opt.textContent = `#${room.RoomNumber} — ${room.RoomType}`;
			roomSelect.appendChild(opt);
		});
	}

	window.editBooking = function (id) {
		const b = allBookings.find((x) => x.BookingID === id);
		if (!b) return;
		idInput.value = b.BookingID;
		guestInput.value = b.GuestName;
		checkinInput.value = b.CheckIn;
		checkoutInput.value = b.CheckOut;
		statusInput.value = b.Status;
		// Load rooms, always include the currently booked room
		loadRooms(b.CheckIn, b.CheckOut, b.RoomID).then(() => {
			roomSelect.value = b.RoomID;
			bootstrap.Modal.getOrCreateInstance(
				document.getElementById("bookingModal")
			).show();
		});
	};

	window.deleteBooking = async function (id) {
		if (!confirm("Are you sure you want to delete this booking?")) return;
		await fetch(`${BASE_URL}/api/bookings/${id}`, { method: "DELETE" });
		await loadBookings();
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
		const guestName = guestInput.value.trim();
		const guest = allGuests.find((g) => g.FullName === guestName);
		if (!guest) {
			setLoading(false);
			return showToast("Select a valid guest from the list.", "warning");
		}
		const booking = {
			GuestID: guest.GuestID,
			RoomID: parseInt(roomSelect.value),
			CheckIn: checkinInput.value,
			CheckOut: checkoutInput.value,
			Status: statusInput.value,
		};
		const method = idInput.value ? "PUT" : "POST";
		const endpoint = idInput.value
			? `/api/bookings/${idInput.value}`
			: "/api/bookings";
		const res = await fetch(BASE_URL + endpoint, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(booking),
		});
		if (!res.ok) {
			setLoading(false);
			const data = await res.json().catch(() => ({}));
			return showToast(data.error || "Save failed", "danger");
		}
		form.reset();
		idInput.value = "";
		await loadBookings();
		setLoading(false);
		bootstrap.Modal.getOrCreateInstance(
			document.getElementById("bookingModal")
		).hide();
	});

	const todayStr = new Date().toISOString().split("T")[0];
	checkinInput.min = todayStr;
	checkinInput.addEventListener("input", () => {
		checkoutInput.min = checkinInput.value;
		if (checkoutInput.value <= checkinInput.value) checkoutInput.value = "";
	});

	[searchInput, filterStatus, filterFrom, filterTo].forEach((el) =>
		el.addEventListener("input", renderBookings)
	);

	// Update available rooms when check-in/check-out changes (for new bookings)
	function updateAvailableRoomsForNewBooking() {
		if (!idInput.value && checkinInput.value && checkoutInput.value) {
			loadRooms(checkinInput.value, checkoutInput.value);
		}
	}
	checkinInput.addEventListener("input", () => {
		checkoutInput.min = checkinInput.value;
		if (checkoutInput.value <= checkinInput.value) checkoutInput.value = "";
		updateAvailableRoomsForNewBooking();
	});
	checkoutInput.addEventListener("input", updateAvailableRoomsForNewBooking);

	// Initial load
	setLoading(true);
	loadGuests().then(() => setLoading(false));
	loadRooms().then(() => setLoading(false));
	loadBookings().then(() => setLoading(false));

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
		const res = await fetch(`http://localhost:3000/api/guests`);
		const guests = await res.json();
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
	window.showRoomDetails = async function(roomId) {
		const res = await fetch(`http://localhost:3000/api/rooms`);
		const rooms = await res.json();
		const room = rooms.find(r => r.RoomID == roomId);
		if (!room) return;
		let modal = document.getElementById('roomDetailModal');
		if (!modal) {
			modal = document.createElement('div');
			modal.className = 'modal fade';
			modal.id = 'roomDetailModal';
			modal.innerHTML = `<div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Room Details</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="roomDetailBody"></div></div></div>`;
			document.body.appendChild(modal);
		}
		document.getElementById('roomDetailBody').innerHTML = `
			<strong>Room #:</strong> ${room.RoomNumber}<br>
			<strong>Type:</strong> ${room.RoomType}<br>
			<strong>Price:</strong> $${room.Price}<br>
			<strong>Capacity:</strong> ${room.Capacity}<br>
			<strong>Status:</strong> ${room.Status}<br>
			<strong>Description:</strong> ${room.Description || '-'}<br>
		`;
		new bootstrap.Modal(modal).show();
	}
});
