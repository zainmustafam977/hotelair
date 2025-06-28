// rooms.js - Room management with deployment fixes
// Fixed: Changed from localhost:3000 to relative URLs for mobile compatibility
// Fixed: Changed from login.html to index.html for navigation

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
	const tableBody = document.querySelector("#roomsTable tbody");
	const form = document.getElementById("roomForm");
	const idInput = document.getElementById("roomId");
	const numberInput = document.getElementById("roomNumber");
	const typeInput = document.getElementById("roomType");
	const priceInput = document.getElementById("roomPrice");
	const capInput = document.getElementById("roomCapacity");
	const descInput = document.getElementById("roomDesc");
	const saveBtn = form.querySelector("button[type='submit']");
	const spinner = document.getElementById("loadingSpinner");
	const toastContainer = document.getElementById("toastContainer");

	let allRooms = [];
	let roomTypes = [];

	function showToast(message, type = "success") {
		const toast = document.createElement("div");
		toast.className = `toast align-items-center text-white bg-${
			type === "success" ? "success" : "danger"
		} border-0 show mb-2`;
		toast.role = "alert";
		toast.innerHTML = `
			<div class="d-flex">
				<div class="toast-body">${message}</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
			</div>
		`;
		toastContainer.appendChild(toast);
		setTimeout(() => toast.remove(), 4000);
	}

	function setLoading(isLoading) {
		spinner.style.display = isLoading ? "block" : "none";
		saveBtn.disabled = isLoading;
	}

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

	async function fetchRoomTypes() {
		try {
			const res = await fetch("/api/room-types");
			roomTypes = await res.json();
			typeInput.innerHTML = roomTypes
				.map((rt) => `<option value="${rt.TypeID}">${rt.Name}</option>`)
				.join("");
		} catch (err) {
			console.error("Room type loading error:", err);
			showToast("Failed to load room types", "danger");
		}
	}

	async function fetchRooms() {
		setLoading(true);
		try {
			const res = await fetch("/api/rooms");
			allRooms = await res.json();
			renderRooms();
		} catch (err) {
			console.error("Failed to load rooms:", err);
			tableBody.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Error loading rooms</td></tr>`;
			showToast("Error fetching rooms", "danger");
		} finally {
			setLoading(false);
		}
	}

	function renderRooms() {
		tableBody.innerHTML = "";
		allRooms.forEach((room) => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
				<td><a href="#" class="text-primary fw-bold" onclick="showRoomDetails(${room.RoomID});return false;">${room.RoomNumber}</a></td>
				<td>${room.RoomType}</td>
				<td>$${room.Price}</td>
				<td>${room.Capacity}</td>
				<td><span class="badge bg-${statusBadge(room.Status)}">${room.Status}</span></td>
				<td>${room.Description || "-"}</td>
				<td>
					<button class="btn btn-sm btn-warning me-1" onclick="editRoom(${room.RoomID})"><i class="bi bi-pencil"></i></button>
					<button class="btn btn-sm btn-danger" onclick="deleteRoom(${room.RoomID})"><i class="bi bi-trash"></i></button>
				</td>
			`;
			tableBody.appendChild(tr);
		});
	}

	function statusBadge(status) {
		return status === "available"
			? "success"
			: status === "booked"
			? "primary"
			: "secondary";
	}

	window.editRoom = function (roomId) {
		const room = allRooms.find((r) => r.RoomID === roomId);
		if (!room) return;
		idInput.value = room.RoomID;
		numberInput.value = room.RoomNumber;
		typeInput.value =
			roomTypes.find((rt) => rt.Name === room.RoomType)?.TypeID || "";
		priceInput.value = room.Price;
		capInput.value = room.Capacity;
		descInput.value = room.Description;

		const modal = new bootstrap.Modal(document.getElementById("roomModal"));
		modal.show();
		setTimeout(() => numberInput.focus(), 200);
	};

	window.deleteRoom = async function (roomId) {
		if (!confirm("Delete this room?")) return;
		try {
			await fetch(`/api/rooms/${roomId}`, {
				method: "DELETE",
			});
			fetchRooms();
			showToast("Room deleted.");
		} catch (err) {
			showToast("Delete failed: " + err.message, "danger");
		}
	};

	window.showRoomDetails = async function(roomId) {
		const res = await fetch(`/api/rooms`);
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

	form.addEventListener("submit", async (e) => {
		e.preventDefault();
		setLoading(true);

		let valid = true;
		let firstInvalid = null;

		const typeId = parseInt(typeInput.value);
		const roomNumber = numberInput.value.trim();
		const price = parseFloat(priceInput.value);
		const capacity = parseInt(capInput.value);
		const desc = descInput.value.trim();

		// Validation
		if (!roomNumber) {
			setFieldError(numberInput, "Room number is required.");
			valid = false;
			firstInvalid = firstInvalid || numberInput;
		} else {
			setFieldError(numberInput, "");
		}
		if (!typeId) {
			setFieldError(typeInput, "Room type is required.");
			valid = false;
			firstInvalid = firstInvalid || typeInput;
		} else {
			setFieldError(typeInput, "");
		}
		if (isNaN(price) || price <= 0) {
			setFieldError(priceInput, "Enter a valid positive price.");
			valid = false;
			firstInvalid = firstInvalid || priceInput;
		} else {
			setFieldError(priceInput, "");
		}
		if (isNaN(capacity) || capacity <= 0) {
			setFieldError(capInput, "Enter a valid positive capacity.");
			valid = false;
			firstInvalid = firstInvalid || capInput;
		} else {
			setFieldError(capInput, "");
		}
		if (desc.length > 255) {
			setFieldError(descInput, "Description must be under 255 characters.");
			valid = false;
			firstInvalid = firstInvalid || descInput;
		} else {
			setFieldError(descInput, "");
		}

		if (!valid) {
			setLoading(false);
			if (firstInvalid) firstInvalid.focus();
			return;
		}

		const roomData = {
			RoomNumber: roomNumber,
			TypeID: typeId,
			Price: price,
			Capacity: capacity,
			Description: desc,
		};

		if (idInput.value) roomData.RoomID = idInput.value;

		try {
			const method = roomData.RoomID ? "PUT" : "POST";
			const endpoint = roomData.RoomID
				? `/api/rooms/${roomData.RoomID}`
				: "/api/rooms";

			const res = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(roomData),
			});

			if (!res.ok) {
				let msg = "Save failed.";
				try {
					msg = await res.text();
				} catch {}
				showToast(msg, "danger");
				setLoading(false);
				return;
			}

			bootstrap.Modal.getInstance(document.getElementById("roomModal")).hide();
			form.reset();
			idInput.value = "";
			fetchRooms();
			showToast("Room saved successfully.");
		} catch (err) {
			showToast("Save failed: " + err.message, "danger");
		} finally {
			setLoading(false);
		}
	});

	[numberInput, typeInput, priceInput, capInput, descInput].forEach(input => {
		input.addEventListener('input', () => setFieldError(input, ''));
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

	fetchRoomTypes();
	fetchRooms();
});
