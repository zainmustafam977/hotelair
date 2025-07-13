// calendar.js - Handles booking calendar logic for HotelAir
// Author: Team HotelAir (ZACODEC, Moeen Ahmad Butt, M. Yasir)
// University of Management and Technology (UMT) | IT310 - Web Technologies
//
// This file manages the interactive calendar: fetching bookings, mapping events, rendering, validation, and theme.
//
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

// Utility functions for API
async function fetchBookings() {
	const res = await fetch(`${BASE_URL}/api/bookings`);
	if (!res.ok) throw new Error("Failed to fetch bookings");
	return await res.json();
}
async function fetchRooms() {
	const res = await fetch(`${BASE_URL}/api/rooms`);
	if (!res.ok) throw new Error("Failed to fetch rooms");
	return await res.json();
}
async function fetchGuests() {
	const res = await fetch(`${BASE_URL}/api/guests`);
	if (!res.ok) throw new Error("Failed to fetch guests");
	return await res.json();
}
async function updateBooking(id, data) {
	const res = await fetch(`${BASE_URL}/api/bookings/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw await res.json().catch(() => new Error("Update failed"));
}
async function deleteBooking(id) {
	const res = await fetch(`${BASE_URL}/api/bookings/${id}`, { method: "DELETE" });
	if (!res.ok) throw new Error("Delete failed");
}
async function createBooking(data) {
	const res = await fetch(`${BASE_URL}/api/bookings`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) throw await res.json().catch(() => new Error("Create failed"));
}

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

// Enhanced validation functions
function validateBookingDates(checkIn, checkOut, roomId, bookingId = null) {
	const checkInDate = new Date(checkIn);
	const checkOutDate = new Date(checkOut);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Check if dates are valid
	if (checkInDate >= checkOutDate) {
		return { valid: false, error: "Check-out date must be after check-in date" };
	}

	// Check if check-in is not in the past
	if (checkInDate < today) {
		return { valid: false, error: "Check-in date cannot be in the past" };
	}

	// Check for room conflicts
	const conflictingBooking = allBookings.find(b => {
		if (bookingId && b.BookingID == bookingId) return false;
		if (b.RoomID != roomId) return false;
		if (b.Status === 'cancelled') return false;
		
		const bCheckIn = new Date(b.CheckIn);
		const bCheckOut = new Date(b.CheckOut);
		
		return !(checkOutDate <= bCheckIn || checkInDate >= bCheckOut);
	});

	if (conflictingBooking) {
		const room = allRooms.find(r => r.RoomID == roomId);
		return { 
			valid: false, 
			error: `Room #${room?.RoomNumber} is already booked for these dates` 
		};
	}

	return { valid: true };
}

function formatDate(date) {
	return new Date(date).toISOString().split('T')[0];
}

function calculateNights(checkIn, checkOut) {
	const start = new Date(checkIn);
	const end = new Date(checkOut);
	return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

document.addEventListener("DOMContentLoaded", async function () {
	const calendarEl = document.getElementById("calendar");
	const eventColors = {
		confirmed: "#0d6efd",
		"checked-in": "#198754",
		"checked-out": "#6c757d",
		cancelled: "#dc3545",
	};

	// State
	let allBookings = [];
	let allRooms = [];
	let allGuests = [];
	let filterRoom = "";
	let filterStatus = "";
	let isDragging = false;

	// Enhanced filtering UI
	const filterRow = document.createElement("div");
	filterRow.className = "d-flex gap-3 mb-4 align-items-center flex-wrap";
	
	const roomSelect = document.createElement("select");
	roomSelect.className = "form-select w-auto";
	roomSelect.innerHTML = `<option value="">All Rooms</option>`;
	
	const statusSelect = document.createElement("select");
	statusSelect.className = "form-select w-auto";
	statusSelect.innerHTML = `
    <option value="">All Statuses</option>
    <option value="confirmed">Confirmed</option>
    <option value="checked-in">Checked-in</option>
    <option value="checked-out">Checked-out</option>
    <option value="cancelled">Cancelled</option>
  `;

	const quickActionsDiv = document.createElement("div");
	quickActionsDiv.className = "d-flex gap-2 ms-auto";
	quickActionsDiv.innerHTML = `
		<button class="btn btn-outline-primary btn-sm" id="quickCheckInBtn" title="Quick Check-in">
			<i class="bi bi-box-arrow-in-right"></i> Quick Check-in
		</button>
		<button class="btn btn-outline-success btn-sm" id="quickCheckOutBtn" title="Quick Check-out">
			<i class="bi bi-box-arrow-left"></i> Quick Check-out
		</button>
		<button class="btn btn-outline-warning btn-sm" id="bulkCancelBtn" title="Bulk Cancel">
			<i class="bi bi-x-circle"></i> Bulk Cancel
		</button>
	`;

	filterRow.append(roomSelect, statusSelect, quickActionsDiv);
	calendarEl.parentElement.insertBefore(filterRow, calendarEl);

	// Enhanced modal for event details and CRUD
	const eventModal = document.getElementById("eventModal");
	const eventModalBody = document.getElementById("eventModalBody");
	let currentEvent = null;
	let selectedEvents = [];

	// Load all data
	async function loadAllData() {
		try {
			[allBookings, allRooms, allGuests] = await Promise.all([
				fetchBookings(),
				fetchRooms(),
				fetchGuests(),
			]);
			renderCalendarEvents();
			renderRoomFilter();
		} catch (err) {
			showToast("Failed to load data", "danger");
		}
	}

	function renderRoomFilter() {
		const prev = roomSelect.value;
		roomSelect.innerHTML = `<option value="">All Rooms</option>` +
			allRooms.map(r => `<option value="${r.RoomID}">#${r.RoomNumber} — ${r.RoomType}</option>`).join("");
		roomSelect.value = prev;
	}

	function filterEvents(bookings) {
		return bookings.filter(b => {
			const roomMatch = !filterRoom || b.RoomID == filterRoom;
			const statusMatch = !filterStatus || b.Status === filterStatus;
			return roomMatch && statusMatch;
		});
	}

	function mapBookingToEvent(b) {
		const nights = calculateNights(b.CheckIn, b.CheckOut);
		const room = allRooms.find(r => r.RoomID == b.RoomID);
		const guest = allGuests.find(g => g.GuestID == b.GuestID);
		
		return {
			id: b.BookingID,
			title: `${guest?.FullName || 'Unknown'} (#${room?.RoomNumber || 'N/A'})`,
			start: b.CheckIn,
			end: new Date(new Date(b.CheckOut).getTime() + 86400000).toISOString().split("T")[0],
			color: eventColors[b.Status] || "#0d6efd",
			extendedProps: { 
				...b, 
				nights: nights,
				roomNumber: room?.RoomNumber,
				guestName: guest?.FullName,
				guestEmail: guest?.Email,
				guestPhone: guest?.Phone,
				roomType: room?.RoomType
			},
		};
	}

	let calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: "dayGridMonth",
		height: "auto",
		headerToolbar: {
			left: "prev,next today",
			center: "title",
			right: "dayGridMonth,timeGridWeek,timeGridDay",
		},
		editable: true,
		eventStartEditable: true,
		eventDurationEditable: true,
		selectable: true,
		selectMirror: true,
		dayMaxEvents: true,
		weekends: true,
		events: [],
		eventDisplay: 'block',
		eventTimeFormat: {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		},

		// Enhanced event click with more details
		eventClick: function (info) {
			const b = info.event.extendedProps;
			currentEvent = info.event;
			
			eventModalBody.innerHTML = `
				<div class="row">
					<div class="col-md-6">
						<h6 class="text-primary mb-3">Guest Information</h6>
						<p><strong>Name:</strong> ${b.guestName || 'N/A'}</p>
						<p><strong>Email:</strong> ${b.guestEmail || 'N/A'}</p>
						<p><strong>Phone:</strong> ${b.guestPhone || 'N/A'}</p>
					</div>
					<div class="col-md-6">
						<h6 class="text-primary mb-3">Booking Details</h6>
						<p><strong>Room:</strong> #${b.roomNumber || 'N/A'} (${b.roomType || 'N/A'})</p>
						<p><strong>Check-in:</strong> ${b.CheckIn}</p>
						<p><strong>Check-out:</strong> ${b.CheckOut}</p>
						<p><strong>Nights:</strong> ${b.nights}</p>
						<p><strong>Status:</strong> <span class="badge" style="background:${eventColors[b.Status]}">${b.Status}</span></p>
					</div>
				</div>
				<div class="mt-4">
					<h6 class="text-primary mb-3">Quick Actions</h6>
					<div class="d-flex gap-2 flex-wrap">
						<button class="btn btn-sm btn-primary" id="editBookingBtn">
							<i class="bi bi-pencil"></i> Edit
						</button>
						<button class="btn btn-sm btn-success" id="checkInBtn" ${b.Status === 'checked-in' ? 'disabled' : ''}>
							<i class="bi bi-box-arrow-in-right"></i> Check-in
						</button>
						<button class="btn btn-sm btn-warning" id="checkOutBtn" ${b.Status === 'checked-out' ? 'disabled' : ''}>
							<i class="bi bi-box-arrow-left"></i> Check-out
						</button>
						<button class="btn btn-sm btn-danger" id="deleteBookingBtn">
							<i class="bi bi-trash"></i> Delete
						</button>
					</div>
				</div>
			`;
			
			bootstrap.Modal.getOrCreateInstance(eventModal).show();
			
			setTimeout(() => {
				// Edit button
				document.getElementById("editBookingBtn").onclick = () => openEditModal(b);
				
				// Check-in button
				document.getElementById("checkInBtn").onclick = async () => {
					try {
						await updateBooking(b.BookingID, {
							GuestID: b.GuestID,
							RoomID: b.RoomID,
							CheckIn: b.CheckIn,
							CheckOut: b.CheckOut,
							Status: 'checked-in'
						});
						showToast("Guest checked in successfully");
						await loadAllData();
						bootstrap.Modal.getOrCreateInstance(eventModal).hide();
					} catch (err) {
						showToast(err.error || "Check-in failed", "danger");
					}
				};
				
				// Check-out button
				document.getElementById("checkOutBtn").onclick = async () => {
					try {
						await updateBooking(b.BookingID, {
							GuestID: b.GuestID,
							RoomID: b.RoomID,
							CheckIn: b.CheckIn,
							CheckOut: b.CheckOut,
							Status: 'checked-out'
						});
						showToast("Guest checked out successfully");
						await loadAllData();
						bootstrap.Modal.getOrCreateInstance(eventModal).hide();
					} catch (err) {
						showToast(err.error || "Check-out failed", "danger");
					}
				};
				
				// Delete button
				document.getElementById("deleteBookingBtn").onclick = async () => {
					if (confirm("Are you sure you want to delete this booking?")) {
						try {
							await deleteBooking(b.BookingID);
							showToast("Booking deleted successfully");
							await loadAllData();
							bootstrap.Modal.getOrCreateInstance(eventModal).hide();
						} catch (err) {
							showToast(err.error || "Delete failed", "danger");
						}
					}
				};
			}, 200);
		},

		// Enhanced drag and drop with validation
		eventDrop: async function (info) {
			if (isDragging) return;
			isDragging = true;
			
			const b = info.event.extendedProps;
			const newCheckin = info.event.startStr;
			const newCheckout = new Date(info.event.end);
			newCheckout.setDate(newCheckout.getDate() - 1);
			const formattedCheckout = formatDate(newCheckout);
			
			// Validate the new dates
			const validation = validateBookingDates(newCheckin, formattedCheckout, b.RoomID, b.BookingID);
			if (!validation.valid) {
				showToast(validation.error, "danger");
				info.revert();
				isDragging = false;
				return;
			}
			
			try {
				await updateBooking(b.BookingID, {
					GuestID: b.GuestID,
					RoomID: b.RoomID,
					CheckIn: newCheckin,
					CheckOut: formattedCheckout,
					Status: b.Status,
				});
				showToast("Booking dates updated successfully");
				await loadAllData();
			} catch (err) {
				showToast(err.error || "Update failed", "danger");
				info.revert();
			}
			isDragging = false;
		},

		// Enhanced resize with validation
		eventResize: async function (info) {
			if (isDragging) return;
			isDragging = true;
			
			const b = info.event.extendedProps;
			const newCheckout = new Date(info.event.end);
			newCheckout.setDate(newCheckout.getDate() - 1);
			const formattedCheckout = formatDate(newCheckout);
			
			// Validate the new dates
			const validation = validateBookingDates(b.CheckIn, formattedCheckout, b.RoomID, b.BookingID);
			if (!validation.valid) {
				showToast(validation.error, "danger");
				info.revert();
				isDragging = false;
				return;
			}
			
			try {
				await updateBooking(b.BookingID, {
					GuestID: b.GuestID,
					RoomID: b.RoomID,
					CheckIn: b.CheckIn,
					CheckOut: formattedCheckout,
					Status: b.Status,
				});
				showToast("Booking duration updated successfully");
				await loadAllData();
			} catch (err) {
				showToast(err.error || "Update failed", "danger");
				info.revert();
			}
			isDragging = false;
		},

		// Enhanced selection for creating new bookings
		select: function (info) {
			openCreateModal(info.startStr, info.endStr);
		},

		// Event selection for bulk operations
		eventDidMount: function(info) {
			info.el.addEventListener('click', function(e) {
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					info.el.classList.toggle('selected-event');
					if (info.el.classList.contains('selected-event')) {
						selectedEvents.push(info.event);
					} else {
						selectedEvents = selectedEvents.filter(ev => ev.id !== info.event.id);
					}
					updateBulkActions();
				}
			});
		}
	});

	function renderCalendarEvents() {
		calendar.removeAllEvents();
		filterEvents(allBookings).forEach(b => {
			calendar.addEvent(mapBookingToEvent(b));
		});
		updateStatistics();
	}

	function updateStatistics() {
		const totalBookings = allBookings.length;
		const checkedInCount = allBookings.filter(b => b.Status === 'checked-in').length;
		const confirmedCount = allBookings.filter(b => b.Status === 'confirmed').length;
		const cancelledCount = allBookings.filter(b => b.Status === 'cancelled').length;

		document.getElementById('totalBookings').textContent = totalBookings;
		document.getElementById('checkedInCount').textContent = checkedInCount;
		document.getElementById('confirmedCount').textContent = confirmedCount;
		document.getElementById('cancelledCount').textContent = cancelledCount;
	}

	// Filtering handlers
	roomSelect.addEventListener("change", () => {
		filterRoom = roomSelect.value;
		renderCalendarEvents();
	});
	statusSelect.addEventListener("change", () => {
		filterStatus = statusSelect.value;
		renderCalendarEvents();
	});

	// Quick actions handlers
	document.getElementById("quickCheckInBtn").addEventListener("click", async () => {
		const today = formatDate(new Date());
		const todayBookings = allBookings.filter(b => 
			b.CheckIn === today && b.Status === 'confirmed'
		);
		
		if (todayBookings.length === 0) {
			showToast("No confirmed bookings for today", "info");
			return;
		}
		
		if (confirm(`Check in ${todayBookings.length} guest(s) for today?`)) {
			try {
				await Promise.all(todayBookings.map(b => 
					updateBooking(b.BookingID, {
						GuestID: b.GuestID,
						RoomID: b.RoomID,
						CheckIn: b.CheckIn,
						CheckOut: b.CheckOut,
						Status: 'checked-in'
					})
				));
				showToast(`${todayBookings.length} guest(s) checked in successfully`);
				await loadAllData();
			} catch (err) {
				showToast("Bulk check-in failed", "danger");
			}
		}
	});

	document.getElementById("quickCheckOutBtn").addEventListener("click", async () => {
		const today = formatDate(new Date());
		const todayBookings = allBookings.filter(b => 
			b.CheckOut === today && b.Status === 'checked-in'
		);
		
		if (todayBookings.length === 0) {
			showToast("No guests to check out today", "info");
			return;
		}
		
		if (confirm(`Check out ${todayBookings.length} guest(s) for today?`)) {
			try {
				await Promise.all(todayBookings.map(b => 
					updateBooking(b.BookingID, {
						GuestID: b.GuestID,
						RoomID: b.RoomID,
						CheckIn: b.CheckIn,
						CheckOut: b.CheckOut,
						Status: 'checked-out'
					})
				));
				showToast(`${todayBookings.length} guest(s) checked out successfully`);
				await loadAllData();
			} catch (err) {
				showToast("Bulk check-out failed", "danger");
			}
		}
	});

	document.getElementById("bulkCancelBtn").addEventListener("click", async () => {
		if (selectedEvents.length === 0) {
			showToast("Please select bookings to cancel (Ctrl+Click)", "info");
			return;
		}
		
		if (confirm(`Cancel ${selectedEvents.length} selected booking(s)?`)) {
			try {
				await Promise.all(selectedEvents.map(event => 
					updateBooking(event.id, {
						...event.extendedProps,
						Status: 'cancelled'
					})
				));
				showToast(`${selectedEvents.length} booking(s) cancelled successfully`);
				selectedEvents = [];
				updateBulkActions();
				await loadAllData();
			} catch (err) {
				showToast("Bulk cancellation failed", "danger");
			}
		}
	});

	function updateBulkActions() {
		const bulkBtn = document.getElementById("bulkCancelBtn");
		if (selectedEvents.length > 0) {
			bulkBtn.textContent = `Bulk Cancel (${selectedEvents.length})`;
			bulkBtn.classList.remove("btn-outline-warning");
			bulkBtn.classList.add("btn-warning");
		} else {
			bulkBtn.innerHTML = '<i class="bi bi-x-circle"></i> Bulk Cancel';
			bulkBtn.classList.remove("btn-warning");
			bulkBtn.classList.add("btn-outline-warning");
		}
	}

	// Enhanced Booking Create/Edit Modal
	function openCreateModal(start, end) {
		openBookingForm({
			CheckIn: start,
			CheckOut: new Date(new Date(end).getTime() - 86400000).toISOString().split("T")[0],
			Status: "confirmed",
		});
	}
	
	function openEditModal(b) {
		openBookingForm(b, true);
	}
	
	function setFieldError(input, message) {
		let errorDiv = input.parentElement.querySelector('.invalid-feedback');
		if (!errorDiv) {
			errorDiv = document.createElement('div');
			errorDiv.className = 'invalid-feedback';
			errorDiv.id = input.id + 'Error';
			input.parentElement.appendChild(errorDiv);
		}
		if (message) {
			input.classList.add('is-invalid');
			errorDiv.textContent = message;
		} else {
			input.classList.remove('is-invalid');
			errorDiv.textContent = '';
		}
	}

	function openBookingForm(b, isEdit = false) {
		// Build enhanced modal form
		const modal = document.createElement("div");
		modal.className = "modal fade";
		modal.innerHTML = `
			<div class="modal-dialog modal-lg">
				<form class="modal-content" id="bookingFormModal">
					<div class="modal-header">
						<h5 class="modal-title">
							<i class="bi bi-calendar-plus"></i> ${isEdit ? "Edit" : "New"} Booking
						</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal"></button>
					</div>
					<div class="modal-body">
						<div class="row">
							<div class="col-md-6">
								<div class="mb-3">
									<label class="form-label">Guest *</label>
									<select class="form-select" id="guestSelect" required>
										<option value="">Select Guest</option>
										${allGuests.map(g => `<option value="${g.GuestID}" ${b.GuestID == g.GuestID ? "selected" : ""}>${g.FullName} (${g.Email || 'No email'})</option>`).join("")}
									</select>
								</div>
								<div class="mb-3">
									<label class="form-label">Room *</label>
									<select class="form-select" id="roomSelectModal" required>
										<option value="">Select Room</option>
										${allRooms.map(r => `<option value="${r.RoomID}" ${b.RoomID == r.RoomID ? "selected" : ""}>#${r.RoomNumber} — ${r.RoomType} ($${r.Price}/night)</option>`).join("")}
									</select>
								</div>
								<div class="mb-3">
									<label class="form-label">Status</label>
									<select class="form-select" id="statusInput">
										<option value="confirmed" ${b.Status === "confirmed" ? "selected" : ""}>Confirmed</option>
										<option value="checked-in" ${b.Status === "checked-in" ? "selected" : ""}>Checked-in</option>
										<option value="checked-out" ${b.Status === "checked-out" ? "selected" : ""}>Checked-out</option>
										<option value="cancelled" ${b.Status === "cancelled" ? "selected" : ""}>Cancelled</option>
									</select>
								</div>
							</div>
							<div class="col-md-6">
								<div class="mb-3">
									<label class="form-label">Check-in Date *</label>
									<input type="date" class="form-control" id="checkinInput" value="${b.CheckIn || ""}" required />
								</div>
								<div class="mb-3">
									<label class="form-label">Check-out Date *</label>
									<input type="date" class="form-control" id="checkoutInput" value="${b.CheckOut || ""}" required />
								</div>
								<div class="mb-3">
									<div class="alert alert-info">
										<strong>Booking Summary:</strong><br>
										<span id="nightsDisplay">Nights: 0</span><br>
										<span id="totalCost">Total: $0</span>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="submit" class="btn btn-primary">
							<i class="bi bi-check-circle"></i> Save Booking
						</button>
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
							<i class="bi bi-x-circle"></i> Cancel
						</button>
					</div>
				</form>
			</div>
		`;
		
		document.body.appendChild(modal);
		const bsModal = new bootstrap.Modal(modal);
		bsModal.show();
		
		// Add real-time validation and cost calculation
		const checkinInput = modal.querySelector("#checkinInput");
		const checkoutInput = modal.querySelector("#checkoutInput");
		const roomSelect = modal.querySelector("#roomSelectModal");
		const nightsDisplay = modal.querySelector("#nightsDisplay");
		const totalCost = modal.querySelector("#totalCost");
		
		function updateSummary() {
			const checkIn = checkinInput.value;
			const checkOut = checkoutInput.value;
			const roomId = roomSelect.value;
			
			if (checkIn && checkOut && roomId) {
				const nights = calculateNights(checkIn, checkOut);
				const room = allRooms.find(r => r.RoomID == roomId);
				const cost = nights * (room?.Price || 0);
				
				nightsDisplay.textContent = `Nights: ${nights}`;
				totalCost.textContent = `Total: $${cost.toFixed(2)}`;
				
				// Validate dates
				const validation = validateBookingDates(checkIn, checkOut, roomId, isEdit ? b.BookingID : null);
				if (!validation.valid) {
					checkoutInput.classList.add('is-invalid');
					setFieldError(checkoutInput, validation.error);
				} else {
					checkoutInput.classList.remove('is-invalid');
					setFieldError(checkoutInput, "");
				}
			}
		}
		
		checkinInput.addEventListener('change', updateSummary);
		checkoutInput.addEventListener('change', updateSummary);
		roomSelect.addEventListener('change', updateSummary);
		
		// Initial summary
		updateSummary();
		
		modal.addEventListener("hidden.bs.modal", () => modal.remove());
		
		modal.querySelector("form").onsubmit = async function (e) {
			e.preventDefault();
			
			const GuestID = parseInt(modal.querySelector("#guestSelect").value);
			const RoomID = parseInt(modal.querySelector("#roomSelectModal").value);
			const CheckIn = modal.querySelector("#checkinInput").value;
			const CheckOut = modal.querySelector("#checkoutInput").value;
			const Status = modal.querySelector("#statusInput").value;

			// Enhanced validation
			let valid = true;
			let firstInvalid = null;
			
			const guestInput = modal.querySelector("#guestSelect");
			const roomInput = modal.querySelector("#roomSelectModal");
			const checkinInput = modal.querySelector("#checkinInput");
			const checkoutInput = modal.querySelector("#checkoutInput");

			if (!GuestID) {
				setFieldError(guestInput, "Guest is required.");
				valid = false;
				firstInvalid = firstInvalid || guestInput;
			} else {
				setFieldError(guestInput, "");
			}
			
			if (!RoomID) {
				setFieldError(roomInput, "Room is required.");
				valid = false;
				firstInvalid = firstInvalid || roomInput;
			} else {
				setFieldError(roomInput, "");
			}
			
			if (!CheckIn) {
				setFieldError(checkinInput, "Check-in date is required.");
				valid = false;
				firstInvalid = firstInvalid || checkinInput;
			} else {
				setFieldError(checkinInput, "");
			}
			
			if (!CheckOut) {
				setFieldError(checkoutInput, "Check-out date is required.");
				valid = false;
				firstInvalid = firstInvalid || checkoutInput;
			} else {
				setFieldError(checkoutInput, "");
			}

			// Additional date validation
			if (CheckIn && CheckOut) {
				const validation = validateBookingDates(CheckIn, CheckOut, RoomID, isEdit ? b.BookingID : null);
				if (!validation.valid) {
					setFieldError(checkoutInput, validation.error);
					valid = false;
					firstInvalid = firstInvalid || checkoutInput;
				}
			}

			if (!valid) {
				firstInvalid?.focus();
				return;
			}

			try {
				if (isEdit) {
					await updateBooking(b.BookingID, { GuestID, RoomID, CheckIn, CheckOut, Status });
					showToast("Booking updated successfully");
				} else {
					await createBooking({ GuestID, RoomID, CheckIn, CheckOut, Status });
					showToast("Booking created successfully");
				}
				await loadAllData();
				bsModal.hide();
			} catch (err) {
				showToast(err.error || "Save failed", "danger");
			}
		};
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

	// Initial load
	await loadAllData();
	calendar.render();
});
