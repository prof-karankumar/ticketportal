const dashboardData = {
    totalActive: 47,
    totalBroadcasted: 32,
    totalUnbroadcasted: 15,
    upcoming: 8
};

const LOGIN_USERNAME = "karan";
const LOGIN_PASSWORD = "kumar";

let isLoggedIn = false;

function toggleTheme() {
    if (!isLoggedIn) {
        alert("Please login first.");
        return;
    }

    const body = document.body;
    const toggleIcon = document.querySelector(".theme-toggle i");

    body.classList.toggle("light-mode");

    if (body.classList.contains("light-mode")) {
        toggleIcon.className = "fas fa-sun";
        localStorage.setItem("theme", "light");
    } else {
        toggleIcon.className = "fas fa-moon";
        localStorage.setItem("theme", "dark");
    }
}

function updateDashboard() {
    const titles = [
        `Total Active Events: ${dashboardData.totalActive}`,
        `Total Broadcasted: ${dashboardData.totalBroadcasted}`,
        `Total Unbroadcasted: ${dashboardData.totalUnbroadcasted}`,
        `Upcoming (3 Days): ${dashboardData.upcoming}`
    ];

    const numbers = [
        dashboardData.totalActive,
        dashboardData.totalBroadcasted,
        dashboardData.totalUnbroadcasted,
        dashboardData.upcoming
    ];

    document.querySelectorAll(".card h2").forEach((card, index) => {
        card.innerHTML = `${titles[index].split(":")[0]}:
            <span style="font-size:1.4rem;display:block;margin-top:4px;color:#FFFFFF;">
                ${numbers[index]}
            </span>`;
    });
}

function searchCards() {
    const searchTerm = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    document.querySelectorAll(".card").forEach(card => {
        const cardText = card.textContent.toLowerCase();
        card.style.display = cardText.includes(searchTerm) ? "flex" : "none";
    });
}

function loginUser() {
    isLoggedIn = true;

    document.getElementById("loginModal").style.display = "none";
    document.getElementById("loginBtn").textContent = "Logout";

    document.querySelectorAll("button, input, select, a").forEach(element => {
        element.removeAttribute("disabled");
    });

    updateDashboard();
}

function logoutUser() {
    isLoggedIn = false;

    document.getElementById("loginModal").style.display = "flex";
    document.getElementById("loginBtn").textContent = "Login";
    document.getElementById("eventModal").style.display = "none";

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        document.querySelector(".theme-toggle i").className = "fas fa-sun";
    }

    const loginForm = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");
    const loginError = document.getElementById("loginError");

    loginForm.addEventListener("submit", event => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (username === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
            loginError.style.display = "none";
            loginUser();
        } else {
            loginError.style.display = "block";
        }
    });

    loginBtn.addEventListener("click", event => {
        event.preventDefault();

        if (isLoggedIn) {
            logoutUser();
        } else {
            document.getElementById("loginModal").style.display = "flex";
        }
    });

    document.getElementById("searchInput").addEventListener("input", searchCards);
    document.getElementById("searchBtn").addEventListener("click", searchCards);

    const eventModal = document.getElementById("eventModal");
    const addEventNavBtn = document.getElementById("addEventNavBtn");
    const closeModalBtn = document.getElementById("closeModal");
    const eventForm = document.getElementById("eventForm");

    addEventNavBtn.addEventListener("click", event => {
        event.preventDefault();

        if (!isLoggedIn) {
            alert("Please login first.");
            return;
        }

        eventModal.style.display = "flex";
    });

    closeModalBtn.addEventListener("click", () => {
        eventModal.style.display = "none";
    });

    window.addEventListener("click", event => {
        if (event.target === eventModal) {
            eventModal.style.display = "none";
        }
    });

    eventForm.addEventListener("submit", event => {
        event.preventDefault();

        if (!isLoggedIn) {
            alert("Please login first.");
            return;
        }

        const eventName = document.getElementById("eventName").value;
        const eventStatus = document.getElementById("eventStatus").value;

        dashboardData.totalActive++;

        if (eventStatus === "Broadcasted") {
            dashboardData.totalBroadcasted++;
        } else if (eventStatus === "Unbroadcasted") {
            dashboardData.totalUnbroadcasted++;
        }

        updateDashboard();
        eventForm.reset();
        eventModal.style.display = "none";

        alert(`Success! Event "${eventName}" has been added.`);
    });

    document.querySelectorAll(".protected-link").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            if (!isLoggedIn) {
                alert("Please login first.");
            }
        });
    });

    updateDashboard();
});