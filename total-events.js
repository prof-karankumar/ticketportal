const SUPABASE_URL = 'htt';
const SUPABASE_ANON_KEY = 'sb_publishable_Olfff104V9bCod1UkTbwyA_VgMLB3IE';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allEvents = [];
let selectedFilter = "";

function toggleTheme() {
    document.body.classList.toggle("light-mode");

    const icon = document.querySelector(".theme-toggle i");
    const isLight = document.body.classList.contains("light-mode");

    icon.className = isLight ? "fas fa-sun" : "fas fa-moon";
    localStorage.setItem("theme", isLight ? "light" : "dark");
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getSafeUrl(value) {
    const url = String(value || "").trim();

    if (!url) return "";

    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return "";
        }

        return escapeHTML(parsedUrl.href);
    } catch {
        return "";
    }
}

function applySelectedFilter(events) {
    if (selectedFilter === "broadcasted") {
        return events.filter(event => event.event_status === "Broadcasted");
    }

    if (selectedFilter === "unbroadcasted") {
        return events.filter(event => event.event_status === "Unbroadcasted");
    }

    if (selectedFilter === "upcoming") {
        const now = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(now.getDate() + 3);

        return events.filter(event => {
            if (!event.event_start_time) return false;

            const eventDate = new Date(event.event_start_time);
            return eventDate >= now && eventDate <= threeDaysLater;
        });
    }

    return events;
}

async function fetchAllEvents() {
    const { data, error } = await _supabase
        .from("events")
        .select("*")
        .order("event_start_time", { ascending: false });

    if (error) {
        console.error("Error fetching events:", error);
        document.getElementById("eventsGrid").innerHTML = `
            <div class="card">
                <h2>Error loading events</h2>
            </div>
        `;
        return;
    }

    allEvents = data || [];
    displayEvents(applySelectedFilter(allEvents));
}

function displayEvents(events) {
    const grid = document.getElementById("eventsGrid");

    if (!events.length) {
        grid.innerHTML = `
            <div class="card">
                <h2>No events found.</h2>
            </div>
        `;
        return;
    }

    grid.innerHTML = "";

    events.forEach(eventData => {
        const card = document.createElement("div");
        card.className = "card";
        card.title = eventData.event_name || "View event details";
        card.setAttribute(
            "aria-label",
            `View ${eventData.event_name || "event"} details`
        );

        const imageUrl = eventData.event_image_url ||
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmM8P5uvVCt-8ZlBmd2qmlJK-C7RpM07uW06KF_uMeKA&s=10";

        card.style.backgroundImage = `url('${imageUrl.replace(/'/g, "%27")}')`;
        card.style.cursor = "pointer";

        const safeEventUrl = getSafeUrl(eventData.event_url);
        const status = eventData.event_status || "Unbroadcasted";
        const isBroadcasted = status === "Broadcasted";
        const statusColor = isBroadcasted ? "#4CAF50" : "#ff4444";

        card.innerHTML = `
            <div style="
                position: absolute;
                inset: 0;
                z-index: 2;
                display: flex;
                align-items: flex-end;
                padding: 1.2rem;
                background: linear-gradient(
                    to top,
                    rgba(0, 0, 0, 0.95),
                    rgba(0, 0, 0, 0.25) 75%,
                    transparent
                );
                pointer-events: none;
            ">
                <div style="
                    width: 100%;
                    color: #ffffff;
                    text-shadow: 0 2px 5px rgba(0,0,0,0.8);
                ">
                    <div style="
                        font-size: 1.1rem;
                        font-weight: 700;
                        margin-bottom: 0.5rem;
                    ">
                        ${escapeHTML(eventData.event_name || "N/A")}
                    </div>

                    <div style="font-size: 0.85rem; margin-top: 0.25rem;">
                        <strong>Venue:</strong>
                        ${escapeHTML(eventData.venue_name || "N/A")}
                    </div>

                    <div style="font-size: 0.85rem; margin-top: 0.25rem;">
                        <strong>Mapping ID:</strong>
                        ${escapeHTML(eventData.event_mapping_id || "N/A")}
                    </div>

                    <div style="font-size: 0.85rem; margin-top: 0.25rem;">
                        <strong>Event Link:</strong>
                        ${
                            safeEventUrl
                                ? `
                                    <a
                                        href="${safeEventUrl}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style="
                                            color: #58a6ff;
                                            text-decoration: underline;
                                            pointer-events: auto;
                                            word-break: break-all;
                                        "
                                        onclick="event.stopPropagation()"
                                    >
                                        Open Link
                                    </a>
                                `
                                : "N/A"
                        }
                    </div>

                    <div style="
                        color: ${statusColor};
                        font-size: 0.78rem;
                        font-weight: 700;
                        margin-top: 0.6rem;
                    ">
                        ● ${escapeHTML(status)}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            window.location.href =
                `event-details.html?id=${encodeURIComponent(eventData.id)}`;
        });

        grid.appendChild(card);
    });
}

function searchCards() {
    const searchTerm = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    const filteredEvents = applySelectedFilter(allEvents).filter(eventData => {
        const searchableText = [
            eventData.event_name,
            eventData.event_mapping_id,
            eventData.event_url,
            eventData.venue_name
        ]
            .map(value => String(value || "").toLowerCase())
            .join(" ");

        return searchableText.includes(searchTerm);
    });

    displayEvents(filteredEvents);
}

function showPortalToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `portal-toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add("hide"); setTimeout(() => toast.remove(), 300); }, 3500);
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
        .from("events")
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
    fetchAllEvents();
}

function openBulkPasswordModal(status) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay bulk-password-modal";
    overlay.innerHTML = `<div class="modal-content" style="max-width:420px"><div class="modal-header"><h2><i class="fas fa-lock"></i> Confirm Bulk Action</h2><button class="close-btn" type="button">&times;</button></div><p class="modal-subtitle">Enter the security password to update all events.</p><form><div class="form-group"><label for="bulkPassword">Password</label><input type="password" id="bulkPassword" autocomplete="off" required></div><p class="bulk-password-error" style="display:none;color:#ff5555;margin-top:1rem">Invalid password.</p><button type="submit" class="submit-event-btn"><i class="fas fa-check"></i> Confirm</button></form></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector(".close-btn").addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    overlay.querySelector("form").addEventListener("submit", async event => {
        event.preventDefault();
        const errorEl = overlay.querySelector(".bulk-password-error");
        if (overlay.querySelector("#bulkPassword").value !== "aws-atm") { errorEl.style.display = "block"; return; }
        const { error } = await _supabase
            .from("events")
            .update({ event_status: status })
            .not("id", "is", null);
        if (error) { errorEl.textContent = "Bulk update failed: " + error.message; errorEl.style.display = "block"; return; }
        close(); showPortalToast(
        `Successfully ${status === "Broadcasted" ? "broadcasted" : "unbroadcasted"} all events.`,
        status === "Broadcasted" ? "broadcast-success" : "unbroadcast-success"
    ); fetchAllEvents();
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
}

document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
    setupBulkActions();
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        document.querySelector(".theme-toggle i").className = "fas fa-sun";
    }

    selectedFilter = new URLSearchParams(window.location.search).get("filter") || "";

    const titleEl = document.querySelector(".dashboard-title h1");

    const titles = {
        all: "TOTAL EVENTS",
        broadcasted: "BROADCASTED EVENTS",
        unbroadcasted: "UNBROADCASTED EVENTS",
        upcoming: "UPCOMING EVENTS (3 Days)"
    };

    if (titleEl) {
        titleEl.textContent = titles[selectedFilter] || "TOTAL EVENTS";
    }

    document
        .getElementById("searchInput")
        .addEventListener("input", searchCards);

    document
        .getElementById("searchBtn")
        .addEventListener("click", searchCards);

    fetchAllEvents();
});
