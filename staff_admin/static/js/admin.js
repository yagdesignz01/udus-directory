const AVATAR_COLORS = [
  "#0B1B33",
  "#33415C",
  "#8A6A1B",
  "#1D6B4E",
  "#5C3A21",
  "#2A4B7C",
  "#6B3F8F",
  "#1F5C7A",
];
let STAFF = [];
let activeStatus = "all";
let query = "";

// CSS classes and labels used for each account status.
const STATUS_BADGE = {
  active: {
    cls: "status-active",
    label: "Active",
  },
  suspended: {
    cls: "status-suspended",
    label: "Suspended",
  },
};

// Return two initials for a staff member's name.
function initials(name) {
  if (!name) return "U";

  const parts = name
    .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, "")
    .trim()
    .split(" ");

  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

const tbody = document.getElementById("tableBody");

// ==========================================
// STAFF FILTERING
// ==========================================
function getFilteredStaff() {
  const searchText = query.trim().toLowerCase();

  return STAFF.filter((staff) => {
    const safeStatus = (staff.status || "").toLowerCase();
    const statusMatches = activeStatus === "all" || safeStatus === activeStatus;
    const nameMatches =
      staff.name && staff.name.toLowerCase().includes(searchText);
    const idMatches = staff.id && staff.id.toLowerCase().includes(searchText);
    const searchMatches = !searchText || nameMatches || idMatches;

    return statusMatches && searchMatches;
  });
}

// ==========================================
// TABLE RENDERING
// ==========================================
function renderTable() {
  if (!tbody) return;

  const filtered = getFilteredStaff();

  tbody.innerHTML =
    filtered
      .map((staffMember, index) => {
        // 1. Set up the status badges safely
        const safeStatus = (staffMember.status || "").toLowerCase();
        const status = STATUS_BADGE[safeStatus] || {
          cls: "status-suspended",
          label: staffMember.status || "Unknown",
        };

        // 2. Render exactly 3 columns: Name & ID, Status, Actions
        return `
    <tr>
      <td style="padding: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; color: white; background:${AVATAR_COLORS[index % AVATAR_COLORS.length]}">
            ${initials(staffMember.name)}
          </div>
          <div>
            <div style="font-weight: 700; color: #12233f; font-size: 14.5px;">${staffMember.name}</div>
            <div style="font-size: 12.5px; color: #6b7a94; margin-top: 4px; font-weight: 500;">
              ${staffMember.id}
            </div>
          </div>
        </div>
      </td>
      <td style="padding: 16px;">
        <span class="${status.cls}" style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <span class="dot" style="width: 6px; height: 6px; border-radius: 50%;"></span> ${status.label}
        </span>
      </td>
      <td style="padding: 16px;">
        <div style="display: flex; gap: 8px;">
          <button onclick="openEditModal('${staffMember.id}', '${staffMember.name.replace(/'/g, "\\'")}', '${staffMember.status}')" style="padding: 8px 16px; border-radius: 8px; border: 1.5px solid var(--hairline); background: white; cursor: pointer; font-weight: 600; font-size: 13px; color: #12233f; transition: background 0.2s;">
            Edit
          </button>
          <button onclick="deleteStaff('${staffMember.id}', '${staffMember.name.replace(/'/g, "\\'")}')" style="padding: 8px 16px; border-radius: 8px; border: 1.5px solid #ffcdd2; background: #ffebee; cursor: pointer; font-weight: 600; font-size: 13px; color: #c62828;">
            Delete
          </button>
        </div>
      </td>
    </tr>`;
      })
      .join("") ||
    `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #6b7a94; font-weight: 500;">No staff accounts match your current filters.</td></tr>`;
}

// ==========================================
// DASHBOARD METRICS
// ==========================================
function updateDynamicMetrics(data) {
  const total = data.length;
  const activeCount = data.filter(
    (staff) => (staff.status || "").toLowerCase() === "active",
  ).length;
  const suspendedCount = data.filter(
    (staff) => (staff.status || "").toLowerCase() === "suspended",
  ).length;

  const totalElement = document.getElementById("bentoTotal");
  const activeElement = document.getElementById("bentoActive");
  const suspendedElement = document.getElementById("bentoSuspended");

  if (totalElement) totalElement.textContent = total;
  if (activeElement) activeElement.textContent = activeCount;
  if (suspendedElement) suspendedElement.textContent = suspendedCount;

  let percent = total > 0 ? Math.round((activeCount / total) * 100) : 0;
  const percentElement = document.getElementById("bentoActivePercent");
  const chart = document.getElementById("activeProgressChart");

  if (percentElement) percentElement.textContent = `${percent}%`;
  if (chart)
    chart.style.background = `conic-gradient(var(--udus-dgreen) ${percent}%, #F0F2F5 0%)`;

  const sidebarSuspended = document.getElementById("sidebarSuspendedCount");
  if (sidebarSuspended) sidebarSuspended.textContent = suspendedCount;
}

// ==========================================
// SEARCH AND NAVIGATION
// ==========================================
document.getElementById("searchInput")?.addEventListener("input", (event) => {
  query = event.target.value;
  renderTable();
});

document.getElementById("sidebarNav")?.addEventListener("click", (event) => {
  const link = event.target.closest(".nav-link");
  if (!link) return;

  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  link.classList.add("active");

  const targetId = link.getAttribute("data-target");
  document
    .querySelectorAll(".content-section")
    .forEach((section) => (section.style.display = "none"));
  const targetSection = document.getElementById(targetId);
  if (targetSection) targetSection.style.display = "block";

  if (targetId === "section-manage") {
    activeStatus = link.getAttribute("data-status");
    const titleElement = document.getElementById("tableSectionTitle");
    if (titleElement)
      titleElement.textContent =
        activeStatus === "all" ? "All Academic Staff" : "Suspended Staffs";
    renderTable();
  }
});

document.querySelector(".export-btn")?.addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8,Staff ID,Name,Account Status\n";
  STAFF.forEach(
    (staff) => (csvContent += `${staff.id},${staff.name},${staff.status}\n`),
  );
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "UDUS_CS_Staff_Directory.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ==========================================
// VALIDATION
// ==========================================
function validateNameInput(inputEl, errorEl, submitBtn) {
  if (!inputEl || !errorEl || !submitBtn) return true;
  const regex = /^[A-Za-z\s']+$/;
  const val = inputEl.value.trim();

  if (val === "") {
    errorEl.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
    return true;
  }

  if (!regex.test(val)) {
    errorEl.style.display = "block";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    return false;
  } else {
    errorEl.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.style.opacity = "1";
    return true;
  }
}

// ==========================================
// ADD STAFF MODAL
// ==========================================
const addModal = document.getElementById("addStaffModal");
const newNameInput = document.getElementById("newName");
const newNameError = document.getElementById("newNameError");
const addSubmitBtn = document.getElementById("addSubmitBtn");

document
  .querySelector(".add-btn")
  ?.addEventListener("click", () => (addModal.style.display = "flex"));
document
  .getElementById("closeAddModalBtn")
  ?.addEventListener("click", () => (addModal.style.display = "none"));
newNameInput?.addEventListener("input", () =>
  validateNameInput(newNameInput, newNameError, addSubmitBtn),
);

document
  .getElementById("addStaffForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateNameInput(newNameInput, newNameError, addSubmitBtn)) return;

    const newStaff = {
      id: document.getElementById("newId").value,
      name: newNameInput.value.trim(),
      status: document.getElementById("newStatus").value,
    };

    try {
      const response = await fetch("/api/staff/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });

      if (response.ok) {
        addModal.style.display = "none";
        document.getElementById("addStaffForm").reset();
        loadDataFromDatabase();
      }
    } catch (error) {
      console.error("Error saving staff:", error);
    }
  });

// ==========================================
// EDIT STAFF MODAL
// ==========================================
const editModal = document.getElementById("editStatusModal");
const editStaffNameInput = document.getElementById("editStaffNameInput");
const editNameError = document.getElementById("editNameError");
const editSubmitBtn = document.getElementById("editSubmitBtn");

document
  .getElementById("closeEditModalBtn")
  ?.addEventListener("click", () => (editModal.style.display = "none"));
editStaffNameInput?.addEventListener("input", () =>
  validateNameInput(editStaffNameInput, editNameError, editSubmitBtn),
);

window.openEditModal = function (id, name, currentStatus) {
  document.getElementById("editStaffId").value = id;
  editStaffNameInput.value = name;
  if (editNameError) editNameError.style.display = "none";
  if (editSubmitBtn) {
    editSubmitBtn.disabled = false;
    editSubmitBtn.style.opacity = "1";
  }
  document.getElementById("editStatusSelect").value =
    currentStatus.charAt(0).toUpperCase() +
    currentStatus.slice(1).toLowerCase();
  editModal.style.display = "flex";
};

document
  .getElementById("editStatusForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateNameInput(editStaffNameInput, editNameError, editSubmitBtn))
      return;

    const updateData = {
      id: document.getElementById("editStaffId").value,
      name: editStaffNameInput.value.trim(),
      status: document.getElementById("editStatusSelect").value,
    };

    try {
      const response = await fetch("/api/staff/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        editModal.style.display = "none";
        loadDataFromDatabase();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  });

window.deleteStaff = async function (id, name) {
  if (
    confirm(
      `Are you sure you want to completely delete ${name}? This action cannot be undone.`,
    )
  ) {
    try {
      const response = await fetch("/api/staff/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }),
      });

      if (response.ok) {
        loadDataFromDatabase();
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  }
};

// ==========================================
// DATA LOADING
// ==========================================
async function loadDataFromDatabase() {
  try {
    const response = await fetch("/api/staff/");
    STAFF = await response.json();
    updateDynamicMetrics(STAFF);
    renderTable();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

loadDataFromDatabase();

// ==========================================
// ADMIN SETTINGS
// ==========================================
async function loadAdminSettings() {
  try {
    const response = await fetch("/api/admin-settings/");
    const data = await response.json();

    if (response.ok) {
      document.getElementById("adminNameInput").value = data.name || "";
      document.getElementById("adminEmailInput").value = data.email || "";
      document.getElementById("adminDisplayName").textContent =
        data.name || "Admin";

      const avatar = document.getElementById("adminDisplayPhoto");

      if (data.profile_image) {
        avatar.innerHTML = `<img src="${data.profile_image}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
      } else {
        const nameParts = (data.name || "Admin User")
          .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, "")
          .trim()
          .split(" ");
        avatar.innerHTML = (
          nameParts[0][0] + (nameParts[1] ? nameParts[1][0] : "")
        ).toUpperCase();
      }
    }
  } catch (error) {
    console.error("Error loading admin settings:", error);
  }
}

// Load the settings as soon as this JavaScript file runs.
loadAdminSettings();

// Show a preview when the admin chooses a new image.
document
  .getElementById("adminImageUpload")
  ?.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) =>
        (document.getElementById("adminDisplayPhoto").innerHTML =
          `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`);
      reader.readAsDataURL(this.files[0]);
    }
  });

// Send changed admin settings to the server.
document
  .getElementById("adminSettingsForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("adminPasswordInput").value;
    const confirmPassword = document.getElementById(
      "adminConfirmPasswordInput",
    ).value;
    if (password && password !== confirmPassword)
      return alert("Passwords do not match!");

    const formData = new FormData();
    formData.append("name", document.getElementById("adminNameInput").value);
    formData.append("email", document.getElementById("adminEmailInput").value);

    if (password) {
      formData.append("password", password);
    }

    const fileInput = document.getElementById("adminImageUpload");
    if (fileInput.files.length > 0) {
      formData.append("profile_image", fileInput.files[0]);
    }

    const saveButton = document.querySelector("#adminSettingsForm .save-btn");
    saveButton.textContent = "Saving...";

    try {
      const response = await fetch("/api/admin-settings/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Admin Settings updated successfully!");
        document.getElementById("adminPasswordInput").value = "";
        document.getElementById("adminConfirmPasswordInput").value = "";
        loadAdminSettings();
      } else {
        alert("Failed to update settings.");
      }
    } catch (error) {
      alert("Network error.");
    } finally {
      saveButton.textContent = "Save Admin Changes";
    }
  });
