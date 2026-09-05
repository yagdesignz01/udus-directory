const AVATAR_COLORS = ['#0B1B33','#33415C','#8A6A1B','#1D6B4E','#5C3A21','#2A4B7C','#6B3F8F','#1F5C7A'];

let STAFF = [];
let activeUnit = 'all';
let activeStatus = 'all'; 
let query = '';

const UNIT_BADGE = {
  "Computer Science": {cls:"badge-cs", label:"Computer Science"},
  "Software Engineering": {cls:"badge-se", label:"Software Engineering"},
  "Cyber Security": {cls:"badge-cyb", label:"Cyber Security"}
};
const STATUS_BADGE = {
  active: {cls:"status-active", label:"Active"},
  suspended: {cls:"status-suspended", label:"Suspended"}
};

function initials(name){
  if (!name) return 'U';
  const parts = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i,'').trim().split(' ');
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

const tbody = document.getElementById('tableBody');

function renderTable(){
  if (!tbody) return;
  const filtered = STAFF.filter(s=>{
    const unitMatch = activeUnit === 'all' || s.unit === activeUnit;
    const safeStatus = (s.status || '').toLowerCase();
    const statusMatch = activeStatus === 'all' || safeStatus === activeStatus;
    const q = query.trim().toLowerCase();
    const qMatch = !q || (s.name && s.name.toLowerCase().includes(q)) || (s.id && s.id.toLowerCase().includes(q));
    return unitMatch && statusMatch && qMatch;
  });

  tbody.innerHTML = filtered.map((s,i)=>{
    const unit = UNIT_BADGE[s.unit] || {cls:"badge-cs", label: s.unit || "Unknown"};
    const safeStatus = (s.status || '').toLowerCase();
    const status = STATUS_BADGE[safeStatus] || {cls:"status-suspended", label: s.status || "Unknown"};

    return `
    <tr>
      <td>
        <div class="staff-cell">
          <div class="staff-thumb" style="background:${AVATAR_COLORS[i % AVATAR_COLORS.length]}">${initials(s.name)}</div>
          <div>
            <div class="staff-name">${s.name}</div>
            <div class="staff-id mono">${s.id}</div>
          </div>
        </div>
      </td>
      <td class="rank-text">${s.rank}</td>
      <td><span class="badge ${unit.cls}"><span class="dot"></span>${unit.label}</span></td>
      <td><span class="badge ${status.cls}"><span class="dot"></span>${status.label}</span></td>
      <td>
        <div class="actions-cell">
          <button class="action-btn" title="Edit Status" onclick="openEditModal('${s.id}', '${s.name.replace(/'/g, "\\'")}', '${s.status}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn danger" title="Delete Account" onclick="deleteStaff('${s.id}', '${s.name.replace(/'/g, "\\'")}')">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('') || `<tr class="empty-row"><td colspan="5">No staff accounts match your current filters.</td></tr>`;
}

function updateDynamicMetrics(data) {
  const total = data.length;
  const activeCount = data.filter(s => (s.status || '').toLowerCase() === 'active').length;
  const suspendedCount = data.filter(s => (s.status || '').toLowerCase() === 'suspended').length;
  
  // THE MISSING MATH: Counting the units
  const csCount = data.filter(s => s.unit === 'Computer Science').length;
  const seCount = data.filter(s => s.unit === 'Software Engineering').length;
  const cybCount = data.filter(s => s.unit === 'Cyber Security').length;
  
  const elTotal = document.getElementById('bentoTotal');
  const elActive = document.getElementById('bentoActive');
  const elSuspended = document.getElementById('bentoSuspended');
  if (elTotal) elTotal.textContent = total;
  if (elActive) elActive.textContent = activeCount;
  if (elSuspended) elSuspended.textContent = suspendedCount;
  
  // Use UDUS Dark Green for the Circular Chart
  let percent = 0;
  if (total > 0) percent = Math.round((activeCount / total) * 100);
  const elPercentText = document.getElementById('bentoActivePercent');
  const chart = document.getElementById('activeProgressChart');
  if (elPercentText) elPercentText.textContent = `${percent}%`;
  if (chart) chart.style.background = `conic-gradient(var(--udus-dgreen) ${percent}%, #F0F2F5 0%)`;

  // THE MISSING INJECTION: Sending the numbers to the specific tabs
  const tabAll = document.querySelector('.unit-tab[data-unit="all"] .count');
  const tabCS = document.querySelector('.unit-tab[data-unit="Computer Science"] .count');
  const tabSE = document.querySelector('.unit-tab[data-unit="Software Engineering"] .count');
  const tabCyb = document.querySelector('.unit-tab[data-unit="Cyber Security"] .count');
  
  if(tabAll) tabAll.textContent = `(${total})`;
  if(tabCS) tabCS.textContent = `(${csCount})`;
  if(tabSE) tabSE.textContent = `(${seCount})`;
  if(tabCyb) tabCyb.textContent = `(${cybCount})`;

  const sidebarSuspended = document.getElementById('sidebarSuspendedCount');
  if(sidebarSuspended) sidebarSuspended.textContent = suspendedCount;
}

const searchInput = document.getElementById('searchInput');
if(searchInput) searchInput.addEventListener('input', e=>{ query = e.target.value; renderTable(); });

const unitTabs = document.getElementById('unitTabs');
if(unitTabs) {
  unitTabs.addEventListener('click', e=>{
    const tab = e.target.closest('.unit-tab');
    if(!tab) return;
    document.querySelectorAll('.unit-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    activeUnit = tab.dataset.unit;
    renderTable();
  });
}

const sidebarNav = document.getElementById('sidebarNav');
if(sidebarNav) {
  sidebarNav.addEventListener('click', e => {
    const link = e.target.closest('.nav-link');
    if(!link) return;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const targetId = link.getAttribute('data-target');
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    const targetSec = document.getElementById(targetId);
    if (targetSec) targetSec.style.display = 'block';

    if (targetId === 'section-manage') {
       activeStatus = link.getAttribute('data-status');
       const titleEl = document.getElementById('tableSectionTitle');
       if(titleEl) {
         if(activeStatus === 'all') titleEl.textContent = "All Academic Staff";
         if(activeStatus === 'suspended') titleEl.textContent = "Suspended Staffs";
       }
       renderTable();
    }
  });
}

const exportBtn = document.querySelector('.export-btn');
if(exportBtn) {
  exportBtn.addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Staff ID,Name,Academic Rank,Academic Unit,Account Status\n";
    STAFF.forEach(s => { csvContent += `${s.id},${s.name},${s.rank},${s.unit},${s.status}\n`; });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "UDUS_CS_Staff_Directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

const addModal = document.getElementById('addStaffModal');
const addBtn = document.querySelector('.add-btn');
if(addBtn) addBtn.addEventListener('click', () => addModal.style.display = 'flex');

const closeAddBtn = document.getElementById('closeAddModalBtn');
if(closeAddBtn) closeAddBtn.addEventListener('click', () => addModal.style.display = 'none');

const addForm = document.getElementById('addStaffForm');
if(addForm) {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newStaff = {
      id: document.getElementById('newId').value,
      name: document.getElementById('newName').value,
      rank: document.getElementById('newRank').value,
      unit: document.getElementById('newUnit').value,
      status: document.getElementById('newStatus').value,
    };
    try {
      const response = await fetch('/api/staff/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });
      if(response.ok) {
        addModal.style.display = 'none'; 
        addForm.reset();
        loadDataFromDatabase(); 
      }
    } catch (error) { console.error("Error saving staff:", error); }
  });
}

const editModal = document.getElementById('editStatusModal');
const closeEditBtn = document.getElementById('closeEditModalBtn');
if(closeEditBtn) closeEditBtn.addEventListener('click', () => editModal.style.display = 'none');

window.openEditModal = function(id, name, currentStatus) {
    document.getElementById('editStaffId').value = id;
    document.getElementById('editStaffName').textContent = `Staff: ${name}`;
    const formattedStatus = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).toLowerCase();
    document.getElementById('editStatusSelect').value = formattedStatus;
    editModal.style.display = 'flex';
};

const editForm = document.getElementById('editStatusForm');
if(editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updateData = {
      id: document.getElementById('editStaffId').value,
      status: document.getElementById('editStatusSelect').value
    };
    try {
      const response = await fetch('/api/staff/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if(response.ok) {
        editModal.style.display = 'none'; 
        loadDataFromDatabase(); 
      }
    } catch (error) { console.error("Error updating status:", error); }
  });
}

window.deleteStaff = async function(id, name) {
    if(confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) {
        try {
            const response = await fetch('/api/staff/', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: id })
            });
            if(response.ok) {
              loadDataFromDatabase(); 
            }
        } catch (error) { console.error("Error deleting staff:", error); }
    }
};

const settingsForm = document.getElementById('adminSettingsForm');
if (settingsForm) {
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert("System Settings and Admin Profile updated successfully!");
  });
}

async function loadDataFromDatabase() {
  try {
      const response = await fetch('/api/staff/');
      const data = await response.json();
      STAFF = data;
      updateDynamicMetrics(STAFF);
      renderTable();
  } catch (error) { console.error("Error fetching data:", error); }
}

loadDataFromDatabase();

// ==========================================
// SUPER ADMIN SETTINGS LOGIC
// ==========================================
async function loadAdminSettings() {
    try {
        const response = await fetch('/api/admin-settings/');
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('adminNameInput').value = data.name || "";
            document.getElementById('adminEmailInput').value = data.email || "";
            document.getElementById('adminDisplayName').textContent = data.name || "Admin";
            
            const initials = (data.name || "Admin User").replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, '').trim().split(' ');
            const initText = (initials[0][0] + (initials[1] ? initials[1][0] : '')).toUpperCase();
            
            const avatar = document.getElementById('adminDisplayPhoto');
            if (data.profile_image) {
                avatar.innerHTML = `<img src="${data.profile_image}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
            } else {
                avatar.innerHTML = initText;
            }
        }
    } catch(e) { console.error("Error loading admin settings:", e); }
}

// Load settings immediately
loadAdminSettings();

// Image Upload Preview
document.getElementById('adminImageUpload')?.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('adminDisplayPhoto').innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Save Admin Data
document.getElementById('adminSettingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pw = document.getElementById('adminPasswordInput').value;
    const confirmPw = document.getElementById('adminConfirmPasswordInput').value;
    
    if (pw && pw !== confirmPw) {
        alert("Passwords do not match!");
        return;
    }

    const formData = new FormData();
    formData.append('name', document.getElementById('adminNameInput').value);
    formData.append('email', document.getElementById('adminEmailInput').value);
    if (pw) formData.append('password', pw);
    
    const fileInput = document.getElementById('adminImageUpload');
    if (fileInput.files.length > 0) {
        formData.append('profile_image', fileInput.files[0]);
    }

    const btn = document.querySelector('#adminSettingsForm .save-btn');
    btn.textContent = "Saving...";

    try {
        const response = await fetch('/api/admin-settings/', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert("Admin Settings updated successfully!");
            document.getElementById('adminPasswordInput').value = '';
            document.getElementById('adminConfirmPasswordInput').value = '';
            loadAdminSettings(); // Reload to get updated photo from database
        } else {
            alert("Failed to update settings. Check server connection.");
        }
    } catch(e) { 
        console.error("Error saving admin settings:", e); 
        alert("Network error."); 
    } finally {
        btn.textContent = "Save Admin Changes";
    }
});