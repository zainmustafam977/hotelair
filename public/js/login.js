// login.js - Connect login form to the API safely and report useful errors.

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

function showError(message) {
	if (!errorMsg) return;
	errorMsg.hidden = false;
	errorMsg.style.display = "block";
	errorMsg.textContent = message;
}

if (form) {
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (errorMsg) {
			errorMsg.hidden = true;
			errorMsg.textContent = "";
		}

		const username = document.getElementById("username")?.value.trim();
		const password = document.getElementById("password")?.value || "";
		if (!username || !password) {
			showError("Username and password are required.");
			return;
		}

		const submitButton = form.querySelector("button[type=submit]");
		if (submitButton) submitButton.disabled = true;

		try {
			const response = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			const contentType = response.headers.get("content-type") || "";
			const data = contentType.includes("application/json")
				? await response.json()
				: { message: await response.text() };

			if (!response.ok) {
				throw new Error(data.message || data.error || "Login failed.");
			}

			localStorage.setItem("sessionUser", JSON.stringify(data.user));
			window.location.assign("dashboard.html");
		} catch (error) {
			showError(
				error.message === "Failed to fetch"
					? "The server is unavailable. Start Node.js with `node server.js` and try again."
					: error.message
			);
		} finally {
			if (submitButton) submitButton.disabled = false;
		}
	});
}
