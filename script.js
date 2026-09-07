const SUPABASE_URL = 'https://zftjzlootkvnquwiwsic.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Olfff104V9bCod1UkTbwyA_VgMLB3IE';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dashboardData = {
    totalAll: 0,
    totalBroadcasted: 0,
    totalUnbroadcasted: 0,
    upcoming: 0
};

const LOGIN_USERNAME = "karan";
const LOGIN_PASSWORD = "kumar";

let isLoggedIn = false;

function checkSavedLogin() {
    const savedLogin = localStorage.getItem("isLoggedIn");
    if (savedLogin === "true") {
        isLoggedIn = true;
        document.getElementById("loginBtn").textContent = "Logout";
        document.getElementById("loginModal").style.display = "none";
        return true;
    }
    return false;
}

function toggleTheme() {
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

async function fetchAndCalculateDashboard() {
    const { data, error } = await _supabase.from('eventss').select('*');

    if (error) {
        console.error("Error fetching events from Supabase:", error.message);
        return;
    }

    dashboardData.totalAll = data.length;
    dashboardData.totalBroadcasted = data.filter(e => e.event_status === 'Broadcasted').length;
    dashboardData.totalUnbroadcasted = data.filter(e => e.event_status === 'Unbroadcasted').length;

    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    dashboardData.upcoming = data.filter(e => {
        if (!e.event_start_time) return false;
        const eventDate = new Date(e.event_start_time);
        return eventDate >= now && eventDate <= threeDaysLater;
    }).length;

    updateDashboardUI();
}

function updateDashboardUI() {
    const titles = [
        `Total Events: ${dashboardData.totalAll}`,
        `Total Broadcasted: ${dashboardData.totalBroadcasted}`,
        `Total Unbroadcasted: ${dashboardData.totalUnbroadcasted}`,
        `Upcoming (3 Days): ${dashboardData.upcoming}`
    ];

    const numbers = [
        dashboardData.totalAll,
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

function loginUser() {
    isLoggedIn = true;
    localStorage.setItem("isLoggedIn", "true");

    document.getElementById("loginModal").style.display = "none";
    document.getElementById("loginBtn").textContent = "Logout";

    fetchAndCalculateDashboard();
}

function logoutUser() {
    isLoggedIn = false;
    localStorage.setItem("isLoggedIn", "false");

    document.getElementById("loginBtn").textContent = "Login";
    document.getElementById("eventModal").style.display = "none";

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";

    dashboardData.totalAll = 0;
    dashboardData.totalBroadcasted = 0;
    dashboardData.totalUnbroadcasted = 0;
    dashboardData.upcoming = 0;
    updateDashboardUI();
}

function showPortalToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `portal-toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function setupBulkActions() {
    const toggle = document.getElementById("bulkActionToggle");
    const menu = document.getElementById("bulkActionMenu");
    if (!toggle || !menu) return;

    toggle.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.querySelectorAll("[data-bulk-status]").forEach(button => {
        button.addEventListener("click", () => {
            const status = button.dataset.bulkStatus;
            if (status === "Broadcasted" || status === "Unbroadcasted") {
                openBulkPasswordModal(status);
            } else {
                updateAllEvents(status);
            }
        });
    });
}

async function updateAllEvents(status) {
    const { error } = await _supabase
        .from("eventss")
        .update({ event_status: status })
        .not("id", "is", null);

    if (error) {
        alert("Bulk update failed: " + error.message);
        return;
    }

    showPortalToast(
        `Successfully ${status === "Broadcasted" ? "broadcasted" : "unbroadcasted"} all events.`,
        status === "Broadcasted" ? "broadcast-success" : "unbroadcast-success"
    );
    fetchAndCalculateDashboard();
}

function openBulkPasswordModal(status) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay bulk-password-modal";
    overlay.innerHTML = `
        <div class="modal-content" style="max-width: 420px;">
            <div class="modal-header">
                <h2><i class="fas fa-lock"></i> Confirm Bulk Action</h2>
                <button class="close-btn" type="button">&times;</button>
            </div>
            <p class="modal-subtitle">Enter the security password to update all events.</p>
            <form>
                <div class="form-group">
                    <label for="bulkPassword">Password</label>
                    <input type="password" id="bulkPassword" autocomplete="off" required>
                </div>
                <p class="bulk-password-error" style="display:none; color:#ff5555; margin-top:1rem;">Invalid password.</p>
                <button type="submit" class="submit-event-btn"><i class="fas fa-check"></i> Confirm</button>
            </form>
        </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector(".close-btn").addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    overlay.querySelector("form").addEventListener("submit", async event => {
        event.preventDefault();
        const errorEl = overlay.querySelector(".bulk-password-error");
        if (overlay.querySelector("#bulkPassword").value !== "aws-atm") {
            errorEl.style.display = "block";
            return;
        }
        const { error } = await _supabase
            .from("eventss")
            .update({ event_status: status })
            .not("id", "is", null);
        if (error) {
            errorEl.textContent = "Bulk update failed: " + error.message;
            errorEl.style.display = "block";
            return;
        }
        close();
        showPortalToast(
            `Successfully ${status === "Broadcasted" ? "broadcasted" : "unbroadcasted"} all events.`,
            status === "Broadcasted" ? "broadcast-success" : "unbroadcast-success"
        );
        fetchAndCalculateDashboard();
    });
}

function setupSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const menuButton = document.getElementById("menuToggleBtn");
    const closeButton = document.getElementById("sidebarCloseBtn");

    if (!sidebar || !overlay || !menuButton) return;

    const closeSidebar = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
    };

    menuButton.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("open");
        menuButton.setAttribute("aria-expanded", "true");
    });
    closeButton?.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);

    document.getElementById("sidebarAddEventBtn")?.addEventListener("click", event => {
        event.preventDefault();
        closeSidebar();
        document.getElementById("addEventNavBtn")?.click();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
    setupBulkActions();
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        document.querySelector(".theme-toggle i").className = "fas fa-sun";
    }

    checkSavedLogin();

    if (!isLoggedIn) {
        document.getElementById("loginModal").style.display = "flex";
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

    document.querySelectorAll(".card").forEach((card, index) => {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
            const filterMap = ["all", "broadcasted", "unbroadcasted", "upcoming"];
            window.location.href = `total-events.html?filter=${filterMap[index]}`;
        });
    });

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

    eventForm.addEventListener("submit", async event => {
        event.preventDefault();

        if (!isLoggedIn) {
            alert("Please login first.");
            return;
        }

        const eventName = document.getElementById("eventName").value;
        const eventMappingID = document.getElementById("eventMappingID").value;
        const venueName = document.getElementById("venueName").value;
        const eventID = document.getElementById("eventID").value;
        const eventStartTime = document.getElementById("eventStartTime").value;
        const transferDate = document.getElementById("transferDate").value;
        const listCost = document.getElementById("listCost").value;
        const eventStatus = document.getElementById("eventStatus").value;
        const eventURL = document.getElementById("eventURL").value;
        const eventimageURL = document.getElementById("eventimageURL").value;

        const newEventData = {
            event_name: eventName,
            event_mapping_id: eventMappingID,
            venue_name: venueName,
            event_id: eventID,
            event_start_time: eventStartTime,
            transfer_date: transferDate,
            list_cost_percentage: parseFloat(listCost),
            event_status: eventStatus,
            event_url: eventURL,
            event_image_url: eventimageURL
        };

        const { data, error } = await _supabase
            .from('eventss')
            .insert([newEventData]);

        if (error) {
            console.error("Error saving event:", error.message);
            alert("Failed to save event to database: " + error.message);
            return;
        }

        await fetchAndCalculateDashboard();
        
        eventForm.reset();
        eventModal.style.display = "none";

        alert(`Success! Event "${eventName}" has been added and saved to Supabase.`);
    });

    const homeLink = document.querySelector('a[href="#"].protected-link');
    if (homeLink) {
        homeLink.addEventListener("click", event => {
            event.preventDefault();
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isLoggedIn) {
            fetchAndCalculateDashboard();
        }
    });

    window.addEventListener('focus', () => {
        if (isLoggedIn) {
            fetchAndCalculateDashboard();
        }
    });

    if (isLoggedIn) {
        fetchAndCalculateDashboard();
    }
});
