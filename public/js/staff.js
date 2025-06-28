// staff.js

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

document.addEventListener("DOMContentLoaded", () => {
	const tableBody = document.querySelector("#staffTable tbody");
	const form = document.getElementById("staffForm");
	const idInput = document.getElementById("staffId");
	const nameInput = document.getElementById("staffName");
	const roleInput = document.getElementById("staffRole");
	const emailInput = document.getElementById("staffEmail");
	const phoneInput = document.getElementById("staffPhone");
	const countryInput = document.getElementById("staffCountry");

	const searchInput = document.createElement("input");
	searchInput.className = "form-control mb-3";
	searchInput.placeholder = "Search staff...";
	document.querySelector("main").insertBefore(searchInput, document.querySelector("main").firstChild);

	const roleOptions = [
		"Manager",
		"Receptionist",
		"Housekeeping",
		"Maintenance",
		"Chef",
		"Security",
		"Other"
	];

	function setRoleDropdown(selected = "") {
		roleInput.innerHTML = roleOptions
			.map(
				(role) => `<option value="${role}" ${role === selected ? "selected" : ""}>${role}</option>`
			)
			.join("");
		if (selected && !roleOptions.includes(selected)) {
			const opt = document.createElement("option");
			opt.value = selected;
			opt.textContent = selected;
			opt.selected = true;
			roleInput.appendChild(opt);
		}
	}

	let allStaff = [];
	let isLoading = false;

	async function fetchStaff() {
		try {
			const res = await fetch(`${BASE_URL}/api/staff`);
			if (!res.ok) throw new Error("Failed to fetch staff");
			allStaff = await res.json();
			renderStaff();
		} catch (err) {
			showToast("Failed to load staff", "danger");
		}
	}

	function renderStaff(filter = "") {
		tableBody.innerHTML = "";
		const filtered = allStaff.filter(
			(s) =>
				s.FullName.toLowerCase().includes(filter.toLowerCase()) ||
				s.Role.toLowerCase().includes(filter.toLowerCase()) ||
				s.Email?.toLowerCase().includes(filter.toLowerCase())
		);
		filtered.forEach((s, index) => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
				<td>${index + 1}</td>
				<td>${s.FullName}</td>
				<td>${s.Role}</td>
				<td>${s.Email || "-"}</td>
				<td>${s.Phone || "-"}</td>
				<td>
					<button class="btn btn-sm btn-warning me-1" onclick="editStaff('${s.StaffID}')"><i class="bi bi-pencil"></i></button>
					<button class="btn btn-sm btn-danger" onclick="deleteStaff('${s.StaffID}')"><i class="bi bi-trash"></i></button>
				</td>
			`;
			tableBody.appendChild(tr);
		});
	}

	window.editStaff = function (id) {
		const s = allStaff.find((x) => x.StaffID == id);
		if (!s) return;
		idInput.value = s.StaffID;
		nameInput.value = s.FullName;
		setRoleDropdown(s.Role);
		emailInput.value = s.Email || "";
		phoneInput.value = s.Phone || "";
		countryInput.value = s.Country || "";
		new bootstrap.Modal(document.getElementById("staffModal")).show();
	};

	window.deleteStaff = async function (id) {
		if (!confirm("Are you sure you want to delete this staff member?")) return;
		try {
			const res = await fetch(`${BASE_URL}/api/staff/${id}`, { method: "DELETE" });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				showToast(data.error || "Delete failed", "danger");
				return;
			}
			showToast("Staff deleted.");
			await fetchStaff();
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

		const nameVal = nameInput.value.trim();
		const roleVal = roleInput.value;
		const countryVal = countryInput.value;
		const emailVal = emailInput.value.trim();
		const phoneVal = phoneInput.value.trim();

		if (!nameVal) {
			setFieldError(nameInput, "Full name is required.");
			valid = false;
			firstInvalid = firstInvalid || nameInput;
		} else {
			setFieldError(nameInput, "");
		}
		if (!roleVal) {
			setFieldError(roleInput, "Role is required.");
			valid = false;
			firstInvalid = firstInvalid || roleInput;
		} else {
			setFieldError(roleInput, "");
		}
		if (!countryVal) {
			setFieldError(countryInput, "Country is required.");
			valid = false;
			firstInvalid = firstInvalid || countryInput;
		} else {
			setFieldError(countryInput, "");
		}
		if (!emailVal || !/^\S+@\S+\.\S+$/.test(emailVal)) {
			setFieldError(emailInput, "Valid email is required.");
			valid = false;
			firstInvalid = firstInvalid || emailInput;
		} else {
			setFieldError(emailInput, "");
		}
		if (!phoneVal) {
			setFieldError(phoneInput, "Phone is required.");
			valid = false;
			firstInvalid = firstInvalid || phoneInput;
		} else {
			setFieldError(phoneInput, "");
		}

		if (!valid) {
			if (firstInvalid) firstInvalid.focus();
			return;
		}

		const StaffID = idInput.value;
		const FullName = nameInput.value.trim();
		const Role = roleInput.value;
		const Email = emailInput.value.trim();
		const Phone = phoneInput.value.trim();
		const Country = countryInput.value;
		const validRoles = [
			"Manager",
			"Receptionist",
			"Housekeeping",
			"Maintenance",
			"Chef",
			"Security",
			"Other"
		];
		if (!FullName || !Role || !Country) {
			showToast("Full name, role, and country are required", "danger");
			return;
		}
		if (!validRoles.includes(Role)) {
			showToast("Invalid role selected", "danger");
			return;
		}
		if (!/^\S+@\S+\.\S+$/.test(Email)) {
			showToast("Valid email is required", "danger");
			return;
		}
		if (!/^\+?[0-9\-\s]{7,20}$/.test(Phone)) {
			showToast("Valid phone number is required", "danger");
			return;
		}
		const staff = { FullName, Role, Email, Phone, Country };
		try {
			let res;
			if (StaffID) {
				res = await fetch(`${BASE_URL}/api/staff/${StaffID}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(staff),
				});
			} else {
				res = await fetch(`${BASE_URL}/api/staff`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(staff),
				});
			}
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				showToast(data.error || "Save failed", "danger");
				return;
			}
			showToast(StaffID ? "Staff updated." : "Staff added.");
			bootstrap.Modal.getInstance(document.getElementById("staffModal")).hide();
			form.reset();
			idInput.value = "";
			await fetchStaff();
		} catch (err) {
			showToast("Save failed", "danger");
		}
	});

	searchInput.addEventListener("input", () => {
		renderStaff(searchInput.value);
	});

	[nameInput, roleInput, countryInput, emailInput, phoneInput].forEach(input => {
		input.addEventListener('input', () => setFieldError(input, ''));
	});

	setRoleDropdown();
	fetchStaff();
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
