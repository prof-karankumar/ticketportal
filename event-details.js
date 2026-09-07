const SUPABASE_URL = 'https://zftjzlootkvnquwiwsic.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Olfff104V9bCod1UkTbwyA_VgMLB3IE';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentEvent = null;

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

function formatDate(value, includeTime = false) {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString([], includeTime
        ? { dateStyle: "medium", timeStyle: "short" }
        : { dateStyle: "medium" }
    );
}

async function loadEventDetails() {
    const eventId = new URLSearchParams(window.location.search).get("id");

    if (!eventId) {
        showMessage("No event ID provided.");
        return;
    }

    const { data, error } = await _supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !data) {
        console.error("Event loading error:", error);
        showMessage("Event not found.");
        return;
    }

    currentEvent = data;
    renderEventDetails(data);
}

function showMessage(message) {
    document.getElementById("eventContent").innerHTML = `
        <p style="color: var(--subtext-color);">
            ${escapeHTML(message)}
            <a href="total-events.html" style="color: #026CDF;">Go back</a>
        </p>
    `;
}

function renderEventDetails(event) {
    const container = document.getElementById("eventContent");
    const fallbackImage = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmM8P5uvVCt-8ZlBmd2qmlJK-C7RpM07uW06KF_uMeKA&s=10";
    const imageUrl = event.event_image_url || fallbackImage;

    const statusColor = event.event_status === "Active"
        ? "#4CAF50"
        : event.event_status === "Broadcasted"
            ? "#026CDF"
            : "#FF9800";

    const safeEventUrl = event.event_url
        ? escapeHTML(event.event_url)
        : "";

    container.innerHTML = `
                <div class="event-hero" style="background-image: url('${escapeHTML(imageUrl)}')">
            <div class="event-hero-content">
                <h1>${escapeHTML(event.event_name || "Unknown Event")}</h1>
            </div>
        </div>

        <div class="event-info-card">
            <h3><i class="fas fa-info-circle"></i> Event Information</h3>

            <div class="info-grid">
                <div class="info-item">
                    <span class="label">Event Name</span>
                    <span class="value">${escapeHTML(event.event_name || "N/A")}</span>
                </div>

                <div class="info-item">
                    <span class="label">Venue</span>
                    <span class="value">${escapeHTML(event.venue_name || "N/A")}</span>
                </div>

                <div class="info-item">
                    <span class="label">Mapping ID</span>
                    <span class="value">${escapeHTML(event.event_mapping_id || "N/A")}</span>
                </div>

                <div class="info-item">
                    <span class="label">Event Link</span>
                    ${
                        safeEventUrl
                            ? `<a href="${safeEventUrl}" target="_blank" rel="noopener" style="color: #58a6ff; word-break: break-all;">
                                Open Event Link
                               </a>`
                            : `<span class="value">N/A</span>`
                    }
                </div>

                <div class="info-item">
                    <span class="label">Event ID</span>
                    <span class="value">${escapeHTML(event.event_id || "N/A")}</span>
                </div>

                <div class="info-item">
                    <span class="label">Event Date & Time</span>
                    <span class="value">${formatDate(event.event_start_time, true)}</span>
                </div>

                <div class="info-item">
                    <span class="label">Transfer Date</span>
                    <span class="value">${formatDate(event.transfer_date)}</span>
                </div>

                <div class="info-item">
                    <span class="label">List Cost %</span>
                    <span class="value">${escapeHTML(event.list_cost_percentage ?? 0)}%</span>
                </div>

                <div class="info-item">
                    <span class="label">Status</span>
                    <span class="value" style="color: ${statusColor}; font-weight: 600;">
                        ${escapeHTML(event.event_status || "N/A")}
                    </span>
                </div>
            </div>
        </div>

        <div class="event-info-card">
            <h3><i class="fas fa-cog"></i> Event Actions</h3>

            <div class="action-buttons">
                <button class="action-btn broadcast-btn" onclick="updateStatus('Broadcasted')">
                    <i class="fas fa-broadcast-tower"></i> Broadcast
                </button>

                <button class="action-btn stop-btn" onclick="updateStatus('Unbroadcasted')">
                    <i class="fas fa-stop"></i> Stop Broadcast
                </button>

                <button class="action-btn edit-btn" onclick="openEditModal()">
                    <i class="fas fa-edit"></i> Edit
                </button>

                <button class="action-btn delete-btn" onclick="deleteEvent()">
                    <i class="fas fa-trash"></i> Delete Event
                </button>
            </div>
        </div>
    `;
}

async function updateStatus(newStatus) {
    if (!currentEvent) return;

    const { data, error } = await _supabase
        .from("events")
        .update({ event_status: newStatus })
        .eq("id", currentEvent.id)
        .select("*");

    if (error) {
        console.error("Status update error:", error);
        alert("Status update failed: " + error.message);
        return;
    }

    if (!data || data.length === 0) {
        alert(
            "Status update nahi hua. Supabase mein UPDATE policy/check permissions verify karein."
        );
        return;
    }

        currentEvent = data[0];
    renderEventDetails(currentEvent);

    showPortalToast(
        `Successfully ${newStatus === "Broadcasted" ? "broadcasted" : "unbroadcasted"} event.`,
        newStatus === "Broadcasted" ? "broadcast-success" : "unbroadcast-success"
    );
}

async function deleteEvent() {
    if (!currentEvent) return;

    const confirmed = confirm(
        "Are you sure you want to delete this event? This cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await _supabase
        .from("events")
        .delete()
        .eq("id", currentEvent.id);

    if (error) {
        console.error("Delete error:", error);
        alert("Delete failed: " + error.message);
        return;
    }

    alert("Event deleted successfully.");
    window.location.href = "total-events.html";
}

function openEditModal() {
    if (!currentEvent) return;

    document.getElementById("editEventName").value = currentEvent.event_name || "";
    document.getElementById("editEventMappingID").value = currentEvent.event_mapping_id || "";
    document.getElementById("editVenueName").value = currentEvent.venue_name || "";
    document.getElementById("editEventID").value = currentEvent.event_id || "";

    if (currentEvent.event_start_time) {
        const date = new Date(currentEvent.event_start_time);
        const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 16);

        document.getElementById("editEventStartTime").value = localDate;
    } else {
        document.getElementById("editEventStartTime").value = "";
    }

    document.getElementById("editTransferDate").value =
        currentEvent.transfer_date ? currentEvent.transfer_date.slice(0, 10) : "";

    document.getElementById("editListCost").value =
        currentEvent.list_cost_percentage ?? "";

    document.getElementById("editEventStatus").value =
        currentEvent.event_status || "Unbroadcasted";

    document.getElementById("editEventURL").value = currentEvent.event_url || "";
    document.getElementById("editEventImageURL").value = currentEvent.event_image_url || "";

    document.getElementById("editModal").style.display = "flex";
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
    loadEventDetails();
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
        close();
        showPortalToast(
            `Successfully ${status === "Broadcasted" ? "broadcasted" : "unbroadcasted"} all events.`,
            status === "Broadcasted" ? "broadcast-success" : "unbroadcast-success"
        );
        loadEventDetails();
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

    loadEventDetails();

    document.getElementById("editForm").addEventListener("submit", async event => {
        event.preventDefault();

        if (!currentEvent) return;

        const updatedData = {
            event_name: document.getElementById("editEventName").value.trim(),
            event_mapping_id: document.getElementById("editEventMappingID").value.trim(),
            venue_name: document.getElementById("editVenueName").value.trim(),
            event_id: document.getElementById("editEventID").value.trim(),
            event_start_time: document.getElementById("editEventStartTime").value,
            transfer_date: document.getElementById("editTransferDate").value,
            list_cost_percentage: Number(document.getElementById("editListCost").value),
            event_status: document.getElementById("editEventStatus").value,
            event_url: document.getElementById("editEventURL").value.trim(),
            event_image_url: document.getElementById("editEventImageURL").value.trim()
        };

        const { data, error } = await _supabase
            .from("events")
            .update(updatedData)
            .eq("id", currentEvent.id)
            .select("*");

        if (error) {
            console.error("Event update error:", error);
            alert("Event update failed: " + error.message);
            return;
        }

        if (!data || data.length === 0) {
            alert(
                "Event update nahi hua. Supabase mein UPDATE policy/check permissions verify karein."
            );
            return;
        }

        currentEvent = data[0];
        document.getElementById("editModal").style.display = "none";
        renderEventDetails(currentEvent);
        alert("Event updated successfully.");
    });
});
