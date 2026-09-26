// Different background colours used for staff initials.
const AVATAR_COLORS = [
  '#0B1B33', '#33415C', '#8A6A1B', '#1D6B4E', 
  '#5C3A21', '#2A4B7C', '#6B3F8F', '#1F5C7A'
];

let STAFF = [];
let activeStatus = 'all'; 
let query = '';

const STATUS_BADGE = {
  active: { cls: 'status-active', label: 'Active' },
  suspended: { cls: 'status-suspended', label: 'Suspended' }
};

function initials(name) {
  if (!name) return 'U';
  const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, '').trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

const tbody = document.getElementById('tableBody');

function getFilteredStaff() {
  const searchText = query.trim().toLowerCase();
  return STAFF.filter(staff => {
    const safeStatus = (staff.status || '').toLowerCase();
    const statusMatches = activeStatus === 'all' || safeStatus === activeStatus;
    const nameMatches = staff.name && staff.name.toLowerCase().includes(searchText);
    const idMatches = staff.id && staff.id.toLowerCase().includes(searchText);
    const searchMatches = !searchText || nameMatches || idMatches;
    return statusMatches && searchMatches;
  });
}

function renderTable() {
  if (!tbody) return;
  const filtered = getFilteredStaff();
  tbody.innerHTML = filtered.map((staffMember, index) => {
    const safeStatus = (staffMember.status || '').toLowerCase();
    const status = STATUS_BADGE[safeStatus] || { cls: 'status-suspended', label: staffMember.status || 'Unknown' };

    return `
    <tr>
      <td>
        <div class="staff-cell">
          <div class="staff-thumb" style="background:${AVATAR_COLORS[index % AVATAR_COLORS.length]}">${initials(staffMember.name)}</div>
          <div>
            <div class="staff-name">${staffMember.name}</div>
            <div class="staff-id mono">${staffMember.id}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${status.cls}"><span class="dot"></span>${status.label}</span></td>
      <td>
        <div class="actions-cell">
          <button class="action-btn" title="Edit Staff" onclick="openEditModal('${staffMember.id}', '${staffMember.name.replace(/'/g, "\\'")}', '${staffMember.status}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn danger" title="Delete Account" onclick="deleteStaff('${staffMember.id}', '${staffMember.name.replace(/'/g, "\\'")}')">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('') || `<tr class="empty-row"><td colspan="3">No staff accounts match your current filters.</td></tr>`;
}

function updateDynamicMetrics(data) {
  const total = data.length;
  const activeCount = data.filter(staff => (staff.status || '').toLowerCase() === 'active').length;
  const suspendedCount = data.filter(staff => (staff.status || '').toLowerCase() === 'suspended').length;
  
  const totalElement = document.getElementById('bentoTotal');
  const activeElement = document.getElementById('bentoActive');
  const suspendedElement = document.getElementById('bentoSuspended');

  if (totalElement) totalElement.textContent = total;
  if (activeElement) activeElement.textContent = activeCount;
  if (suspendedElement) suspendedElement.textContent = suspendedCount;
  
  let percent = 0;
  if (total > 0) percent = Math.round((activeCount / total) * 100);

  const percentElement = document.getElementById('bentoActivePercent');
  const chart = document.getElementById('activeProgressChart');

  if (percentElement) percentElement.textContent = `${percent}%`;
  if (chart) chart.style.background = `conic-gradient(var(--udus-dgreen) ${percent}%, #F0F2F5 0%)`;

  const sidebarSuspended = document.getElementById('sidebarSuspendedCount');
  if (sidebarSuspended) sidebarSuspended.textContent = suspendedCount;
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', event => {
    query = event.target.value;
    renderTable();
  });
}

const sidebarNav = document.getElementById('sidebarNav');
if (sidebarNav) {
  sidebarNav.addEventListener('click', event => {
    const link = event.target.closest('.nav-link');
    if (!link) return;

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const targetId = link.getAttribute('data-target');

    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
    });

    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.style.display = 'block';

    if (targetId === 'section-manage') {
      activeStatus = link.getAttribute('data-status');
      const titleElement = document.getElementById('tableSectionTitle');

      if (titleElement) {
        if (activeStatus === 'all') titleElement.textContent = 'All Academic Staff';
        if (activeStatus === 'suspended') titleElement.textContent = 'Suspended Staffs';
      }
      renderTable();
    }
  });
}

const exportBtn = document.querySelector('.export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    let csvContent = 'data:text/csv;charset=utf-8,Staff ID,Name,Account Status\n';
    STAFF.forEach(staff => {
      csvContent += `${staff.id},${staff.name},${staff.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'UDUS_CS_Staff_Directory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// --- NEW MODAL & VALIDATION LOGIC ---

function validateNameInput(inputEl, errorEl, submitBtn) {
  const regex = /^[A-Za-z\s']+$/; // Only letters, spaces, and apostrophes
  const val = inputEl.value.trim();
  
  if (val === '') {
    errorEl.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    return true;
  }
  
  if (!regex.test(val)) {
    errorEl.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    return false;
  } else {
    errorEl.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    return true;
  }
}

const addModal = document.getElementById('addStaffModal');
const addBtn = document.querySelector('.add-btn');
const newNameInput = document.getElementById('newName');
const newNameError = document.getElementById('newNameError');
const addSubmitBtn = document.getElementById('addSubmitBtn');

if (addBtn) {
  addBtn.addEventListener('click', () => {
    addModal.style.display = 'flex';
  });
}

const closeAddBtn = document.getElementById('closeAddModalBtn');
if (closeAddBtn) {
  closeAddBtn.addEventListener('click', () => {
    addModal.style.display = 'none';
  });
}

// Real-time validation for adding a staff member
newNameInput?.addEventListener('input', () => {
  validateNameInput(newNameInput, newNameError, addSubmitBtn);
});

const addForm = document.getElementById('addStaffForm');
if (addForm) {
  addForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateNameInput(newNameInput, newNameError, addSubmitBtn)) return;

    const newStaff = {
      id: document.getElementById('newId').value,
      name: newNameInput.value.trim(),
      status: document.getElementById('newStatus').value,
    };
    try {
      const response = await fetch('/api/staff/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });
      if (response.ok) {
        addModal.style.display = 'none';
        addForm.reset();
        loadDataFromDatabase();
      }
    } catch (error) {
      console.error('Error saving staff:', error);
    }
  });
}

const editModal = document.getElementById('editStatusModal');
const editStaffNameInput = document.getElementById('editStaffNameInput');
const editNameError = document.getElementById('editNameError');
const editSubmitBtn = document.getElementById('editSubmitBtn');

const closeEditBtn = document.getElementById('closeEditModalBtn');
if (closeEditBtn) {
  closeEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
  });
}

// Real-time validation for editing a staff member
editStaffNameInput?.addEventListener('input', () => {
  validateNameInput(editStaffNameInput, editNameError, editSubmitBtn);
});

// Update the modal opener to populate the new name input field
window.openEditModal = function(id, name, currentStatus) {
  document.getElementById('editStaffId').value = id;
  editStaffNameInput.value = name;
  
  // Reset validation states on open
  editNameError.style.display = 'none';
  editSubmitBtn.disabled = false;
  editSubmitBtn.style.opacity = '1';

  const formattedStatus = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase();
  document.getElementById('editStatusSelect').value = formattedStatus;
  
  editModal.style.display = 'flex';
};

const editForm = document.getElementById('editStatusForm');
if (editForm) {
  editForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateNameInput(editStaffNameInput, editNameError, editSubmitBtn)) return;

    const updateData = {
      id: document.getElementById('editStaffId').value,
      name: editStaffNameInput.value.trim(),
      status: document.getElementById('editStatusSelect').value
    };
    
    try {
      const response = await fetch('/api/staff/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (response.ok) {
        editModal.style.display = 'none';
        loadDataFromDatabase();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  });
}

window.deleteStaff = async function(id, name) {
  const message = `Are you sure you want to completely delete ${name}? This action cannot be undone.`;
  if (confirm(message)) {
    try {
      const response = await fetch('/api/staff/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
      });
      if (response.ok) loadDataFromDatabase();
    } catch (error) {
      console.error('Error deleting staff:', error);
    }
  }
};

const settingsForm = document.getElementById('adminSettingsForm');
if (settingsForm) {
  settingsForm.addEventListener('submit', event => {
    event.preventDefault();
    alert('System Settings and Admin Profile updated successfully!');
  });
}

async function loadDataFromDatabase() {
  try {
    const response = await fetch('/api/staff/');
    const data = await response.json();
    STAFF = data;
    updateDynamicMetrics(STAFF);
    renderTable();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

loadDataFromDatabase();

async function loadAdminSettings() {
  try {
    const response = await fetch('/api/admin-settings/');
    const data = await response.json();

    if (response.ok) {
      document.getElementById('adminNameInput').value = data.name || '';
      document.getElementById('adminEmailInput').value = data.email || '';
      document.getElementById('adminDisplayName').textContent = data.name || 'Admin';

      const nameParts = (data.name || 'Admin User').replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, '').trim().split(' ');
      const initials = (nameParts[0][0] + (nameParts[1] ? nameParts[1][0] : '')).toUpperCase();

      const avatar = document.getElementById('adminDisplayPhoto');
      if (data.profile_image) {
        avatar.innerHTML = `<img src="${data.profile_image}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
      } else {
        avatar.innerHTML = initials;
      }
    }
  } catch (error) {
    console.error('Error loading admin settings:', error);
  }
}

loadAdminSettings();

document.getElementById('adminImageUpload')?.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = function(event) {
      document.getElementById('adminDisplayPhoto').innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
    };
    reader.readAsDataURL(this.files[0]);
  }
});

document.getElementById('adminSettingsForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const password = document.getElementById('adminPasswordInput').value;
  const confirmPassword = document.getElementById('adminConfirmPasswordInput').value;

  if (password && password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  const formData = new FormData();
  formData.append('name', document.getElementById('adminNameInput').value);
  formData.append('email', document.getElementById('adminEmailInput').value);
  if (password) formData.append('password', password);

  const fileInput = document.getElementById('adminImageUpload');
  if (fileInput.files.length > 0) formData.append('profile_image', fileInput.files[0]);

  const saveButton = document.querySelector('#adminSettingsForm .save-btn');
  saveButton.textContent = 'Saving...';

  try {
    const response = await fetch('/api/admin-settings/', { method: 'POST', body: formData });
    if (response.ok) {
      alert('Admin Settings updated successfully!');
      document.getElementById('adminPasswordInput').value = '';
      document.getElementById('adminConfirmPasswordInput').value = '';
      loadAdminSettings();
    } else {
      alert('Failed to update settings. Check server connection.');
    }
  } catch (error) {
    console.error('Error saving admin settings:', error);
    alert('Network error.');
  } finally {
    saveButton.textContent = 'Save Admin Changes';
  }
});