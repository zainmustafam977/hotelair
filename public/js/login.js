// login.js - Connect login form to API

document.getElementById("loginForm").addEventListener("submit", async (e) => {
	e.preventDefault();

	const username = document.getElementById("username").value.trim();
	const password = document.getElementById("password").value.trim();
	const errorMsg = document.getElementById("errorMsg");

	try {
		// Fixed: Changed from localhost:3000 to relative URL for mobile compatibility
		const res = await fetch("/api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});

		const data = await res.json();
		if (!res.ok) throw new Error(data.message || "Login failed");

		// Save session and redirect
		localStorage.setItem("sessionUser", JSON.stringify(data.user));
		window.location.href = "dashboard.html";
	} catch (err) {
		errorMsg.style.display = "block";
		errorMsg.textContent = err.message;
	}
});
