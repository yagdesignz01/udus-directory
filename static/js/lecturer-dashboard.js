const currentStaffId = localStorage.getItem('currentStaffId');

// Redirect if not logged in
if (!currentStaffId) {
    window.location.replace('/lecturer/');
}

// ==========================================
// 1. ACTIVATE ALL BUTTONS SAFELY
// ==========================================
function handleLogout() {
    localStorage.removeItem('currentStaffId');
    window.location.href = '/lecturer/';
}
document.getElementById('logoutLink')?.addEventListener('click', handleLogout);
document.getElementById('mobileLogoutBtn')?.addEventListener('click', handleLogout);

document.getElementById('discardBtn')?.addEventListener('click', () => {
    window.location.reload();
});

// Sidebar scrolling
document.querySelectorAll('.nav-link[data-target]').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link[data-target]').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const target = document.getElementById(link.dataset.target);
        if (target) {
            const y = target.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({top: y, behavior: 'smooth'});
        }
    });
});

// Image Upload Trigger
document.getElementById('uploadTriggerBtn')?.addEventListener('click', () => {
    document.getElementById('imageUpload')?.click();
});

document.getElementById('imageUpload')?.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const displayPhoto = document.getElementById('displayPhoto');
            if(displayPhoto) displayPhoto.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:20px;">`;
            
            const saveStatus = document.querySelector('.save-status');
            if(saveStatus) saveStatus.innerHTML = '<span class="dot" style="background:var(--udus-plum)"></span> Unsaved photo changes';
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Tags
const tagShell = document.getElementById('tagShell');
const tagInput = document.getElementById('tagInput');

function addChip(value) {
    if (!value.trim() || !tagShell || !tagInput) return;
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${value.trim().toUpperCase()}<button data-remove="${value.trim()}">✕</button>`;
    tagShell.insertBefore(chip, tagInput);
    tagInput.value = '';
}

tagInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addChip(tagInput.value);
    }
});

tagShell?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-remove]');
    if (btn) btn.closest('.tag-chip').remove();
});

// ==========================================
// 2. FETCH DATA WITHOUT FREEZING
// ==========================================
async function loadProfileData() {
    if (!currentStaffId) return;
    
    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`);
        const data = await response.json();

        if (response.ok) {
            // Safely inject text
            const nameEl = document.querySelector('.sidebar-profile .name');
            const rankEl = document.querySelector('.sidebar-profile .rank');
            if(nameEl) nameEl.textContent = data.name;
            if(rankEl) rankEl.textContent = `${data.rank} · ${data.unit}`;

            const fields = {
                'profName': data.name,
                'profRank': data.rank,
                'profQual': data.highest_qualification,
                'profResearch': data.research_interests,
                'profBuilding': data.building,
                'profFloor': data.floor,
                'profOffice': data.office_number,
                'profGuidance': data.guidance,
                'profOfficeHours': data.working_hours,
                'profEmail': data.email,
                'profWhatsapp': data.whatsapp
            };

            for (const [id, value] of Object.entries(fields)) {
                const el = document.getElementById(id);
                if (el) el.value = value || '';
            }

            const displayPhoto = document.getElementById('displayPhoto');
            const sidebarAvatar = document.querySelector('.sidebar-avatar');
            
            if (data.profile_image && data.profile_image.trim() !== "") {
                const imgHTML = `<img src="${data.profile_image}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                if(displayPhoto) displayPhoto.innerHTML = imgHTML;
                if(sidebarAvatar) sidebarAvatar.innerHTML = imgHTML;
            } else {
                const parts = (data.name || "User").replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, '').trim().split(' ');
                const init = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
                if(displayPhoto) displayPhoto.innerHTML = init;
                if(sidebarAvatar) sidebarAvatar.innerHTML = init;
            }

            if(tagShell && data.courses_taught) {
                tagShell.querySelectorAll('.tag-chip').forEach(chip => chip.remove()); 
                const courses = data.courses_taught.split(',').map(c => c.trim()).filter(c => c);
                courses.forEach(course => addChip(course));
            }
        } else {
            console.warn("Could not fetch profile. Ensure server is running.", data.error);
        }
    } catch (error) {
        console.error("Network error fetching profile:", error);
    }
}

// Start fetching data immediately
loadProfileData();

// ==========================================
// 3. SAVE DATA
// ==========================================
document.getElementById('publishBtn')?.addEventListener('click', async () => {
    const formData = new FormData();
    
    // Safely append text data
    formData.append('highest_qualification', document.getElementById('profQual')?.value || '');
    formData.append('research_interests', document.getElementById('profResearch')?.value || '');
    formData.append('building', document.getElementById('profBuilding')?.value || '');
    formData.append('floor', document.getElementById('profFloor')?.value || '');
    formData.append('office_number', document.getElementById('profOffice')?.value || '');
    formData.append('guidance', document.getElementById('profGuidance')?.value || '');
    formData.append('working_hours', document.getElementById('profOfficeHours')?.value || '');
    formData.append('email', document.getElementById('profEmail')?.value || '');
    formData.append('whatsapp', document.getElementById('profWhatsapp')?.value || '');
    formData.append('password', document.getElementById('profPassword')?.value || '');

    if(tagShell) {
        const courseChips = Array.from(tagShell.querySelectorAll('.tag-chip')).map(chip => chip.textContent.replace('✕', '').trim());
        formData.append('courses_taught', courseChips.join(', '));
    }

    const fileInput = document.getElementById('imageUpload');
    if (fileInput && fileInput.files.length > 0) {
        formData.append('profile_image', fileInput.files[0]);
    }

    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const statusText = document.querySelector('.save-status');
            if(statusText) statusText.innerHTML = '<span class="dot" style="background:var(--udus-dark-green)"></span> All changes published';
            
            // Clear password box after saving
            const pwBox = document.getElementById('profPassword');
            if(pwBox) pwBox.value = '';
            
            alert('Profile updated successfully!');
            loadProfileData(); 
        } else {
            alert("Failed to save changes. Check server connection.");
        }
    } catch (error) {
        console.error("Error saving profile:", error);
        alert("Network Error: Failed to connect to server.");
    }
});