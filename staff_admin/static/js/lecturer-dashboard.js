const currentStaffId = localStorage.getItem('currentStaffId');

if (!currentStaffId) window.location.replace('/lecturer-login/');

// ==========================================
// LOGOUT AND PAGE STATE
// ==========================================
function handleLogout() {
    localStorage.removeItem('currentStaffId');
    window.location.href = '/lecturer-login/';
}

document.getElementById('logoutLink')?.addEventListener('click', handleLogout);
document.getElementById('mobileLogoutBtn')?.addEventListener('click', handleLogout);
document.getElementById('discardBtn')?.addEventListener('click', () => window.location.reload());

// ==========================================
// NAVIGATION
// ==========================================
document.querySelectorAll('.nav-link[data-target]').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link[data-target]').forEach(sl => sl.classList.remove('active'));
        link.classList.add('active');
        const ts = document.getElementById(link.dataset.target);
        if (ts) window.scrollTo({ top: ts.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
    });
});

// ==========================================
// IMAGE UPLOAD PREVIEW
// ==========================================
document.getElementById('uploadTriggerBtn')?.addEventListener('click', () => document.getElementById('imageUpload')?.click());

document.getElementById('imageUpload')?.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const dp = document.getElementById('displayPhoto');
            if (dp) dp.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:20px;">`;
            const ss = document.querySelector('.save-status');
            if (ss) ss.innerHTML = '<span class="dot" style="background:var(--udus-plum)"></span> Unsaved photo changes';
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// ==========================================
// COURSE TAGS
// ==========================================
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

tagInput?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip(tagInput.value); } });
tagShell?.addEventListener('click', e => { const rb = e.target.closest('button[data-remove]'); if (rb) rb.closest('.tag-chip').remove(); });

// ==========================================
// CHECKBOX LOGIC
// ==========================================
document.getElementById('otherSpecCheckbox')?.addEventListener('change', function() {
    const input = document.getElementById('otherSpecInput');
    if(input) { input.disabled = !this.checked; if (this.checked) input.focus(); else input.value = ''; }
});
document.getElementById('otherAdminCheckbox')?.addEventListener('change', function() {
    const input = document.getElementById('otherAdminInput');
    if(input) { input.disabled = !this.checked; if (this.checked) input.focus(); else input.value = ''; }
});
document.getElementById('roleNoneCheckbox')?.addEventListener('change', function() {
    if (this.checked) {
        document.querySelectorAll('#adminRoleCheckboxes input[type="checkbox"]').forEach(cb => {
            if (cb.id !== 'roleNoneCheckbox') {
                cb.checked = false;
                if (cb.id === 'otherAdminCheckbox') { const inp = document.getElementById('otherAdminInput'); if (inp) { inp.disabled = true; inp.value = ''; } }
            }
        });
    }
});
document.querySelectorAll('#adminRoleCheckboxes input[type="checkbox"]:not(#roleNoneCheckbox)').forEach(cb => {
    cb.addEventListener('change', function() { if (this.checked) { const ncb = document.getElementById('roleNoneCheckbox'); if (ncb) ncb.checked = false; } });
});

// ==========================================
// PROFILE DATA
// ==========================================
async function loadProfileData() {
    if (!currentStaffId) return;
    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`);
        const data = await response.json();
        if (response.ok) {
            const nameEl = document.querySelector('.sidebar-profile .name');
            const titleEl = document.getElementById('sidebarTitle');
            if (nameEl) nameEl.textContent = data.name;
            if (titleEl) titleEl.textContent = data.title || 'Academic Staff';

            const fields = { profName: data.name, profTitle: data.title, profQual: data.highest_qualification, profBuilding: data.building, profFloor: data.floor, profOffice: data.office_number, profGuidance: data.guidance, profOfficeHours: data.working_hours, profEmail: data.email, profWhatsapp: data.whatsapp };
            for (const [id, val] of Object.entries(fields)) { const f = document.getElementById(id); if (f) f.value = val || ''; }

            if (data.specializations) {
                const specs = data.specializations.split(',').map(s => s.trim());
                document.querySelectorAll('#specializationCheckboxes input[type="checkbox"]').forEach(cb => {
                    if (cb.value !== 'Other' && specs.includes(cb.value)) cb.checked = true;
                });
                const otherSpecs = specs.filter(s => ![...document.querySelectorAll('#specializationCheckboxes input[type="checkbox"]')].map(c=>c.value).includes(s));
                if(otherSpecs.length > 0) { document.getElementById('otherSpecCheckbox').checked = true; document.getElementById('otherSpecInput').disabled = false; document.getElementById('otherSpecInput').value = otherSpecs[0]; }
            }

            if (data.administrative_roles) {
                const roles = data.administrative_roles.split(',').map(s => s.trim());
                document.querySelectorAll('#adminRoleCheckboxes input[type="checkbox"]').forEach(cb => {
                    if (cb.value !== 'Other' && roles.includes(cb.value)) cb.checked = true;
                });
                const otherRoles = roles.filter(s => ![...document.querySelectorAll('#adminRoleCheckboxes input[type="checkbox"]')].map(c=>c.value).includes(s));
                if(otherRoles.length > 0) { document.getElementById('otherAdminCheckbox').checked = true; document.getElementById('otherAdminInput').disabled = false; document.getElementById('otherAdminInput').value = otherRoles[0]; }
            }

            const dp = document.getElementById('displayPhoto');
            const sa = document.querySelector('.sidebar-avatar');
            if (data.profile_image) {
                const img = `<img src="${data.profile_image}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                if(dp) dp.innerHTML = img; if(sa) sa.innerHTML = img;
            } else {
                const inits = (data.name||"U").replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, '').trim().split(' ');
                const res = (inits[0][0] + (inits[1]?inits[1][0]: '')).toUpperCase();
                if(dp) dp.innerHTML = res; if(sa) sa.innerHTML = res;
            }

            if (tagShell && data.courses_taught) {
                tagShell.querySelectorAll('.tag-chip').forEach(c => c.remove());
                data.courses_taught.split(',').map(c => c.trim()).filter(c=>c).forEach(c => addChip(c));
            }
        }
    } catch (e) { console.error('Error fetching profile:', e); }
}
loadProfileData();

// ==========================================
// PASSWORD STRENGTH
// ==========================================
const passwordInput = document.getElementById('profPassword');
passwordInput?.addEventListener('input', function() {
    const val = this.value;
    const cont = document.getElementById('passwordStrengthContainer');
    const bar = document.getElementById('passwordStrengthBar');
    const lbl = document.getElementById('strengthLabel');
    if (val.length === 0) { cont.style.display = 'none'; return; }
    cont.style.display = 'block';
    let score = 0;
    if (val.length >= 8) score++; if (/[a-z]/.test(val)) score++; if (/[A-Z]/.test(val)) score++; if (/[0-9]/.test(val)) score++; if (/[^A-Za-z0-9]/.test(val)) score++;
    let txt = 'Weak', col = '#D32F2F', w = '33%';
    if (score >= 4 && val.length >= 8) { txt = 'Great'; col = 'var(--udus-dgreen)'; w = '100%'; } 
    else if (score >= 3 && val.length >= 6) { txt = 'Good'; col = '#F59E0B'; w = '66%'; }
    bar.style.width = w; bar.style.backgroundColor = col; lbl.textContent = txt; lbl.style.color = col;
});

// ==========================================
// PUBLISH PROFILE
// ==========================================
document.getElementById('publishBtn')?.addEventListener('click', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const selectedTitle = document.getElementById('profTitle')?.value;
    if (!selectedTitle) return Swal.fire({ title: 'Action Required', text: 'Please select your Title.', icon: 'warning', confirmButtonColor: '#9F4A71' });

    const specs = [];
    document.querySelectorAll('#specializationCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        if (cb.value === 'Other') { const v = document.getElementById('otherSpecInput')?.value.trim(); if(v) specs.push(v.replace(/,/g, '')); } else specs.push(cb.value);
    });
    const roles = [];
    document.querySelectorAll('#adminRoleCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        if (cb.value === 'Other') { const v = document.getElementById('otherAdminInput')?.value.trim(); if(v) roles.push(v.replace(/,/g, '')); } else roles.push(cb.value);
    });

    formData.append('title', selectedTitle);
    formData.append('highest_qualification', document.getElementById('profQual')?.value || '');
    formData.append('specializations', specs.join(', '));
    formData.append('administrative_roles', roles.join(', '));
    formData.append('building', document.getElementById('profBuilding')?.value || '');
    formData.append('floor', document.getElementById('profFloor')?.value || '');
    formData.append('office_number', document.getElementById('profOffice')?.value || '');
    formData.append('guidance', document.getElementById('profGuidance')?.value || '');
    formData.append('working_hours', document.getElementById('profOfficeHours')?.value || '');
    formData.append('email', document.getElementById('profEmail')?.value || '');
    formData.append('whatsapp', document.getElementById('profWhatsapp')?.value || '');
    formData.append('password', document.getElementById('profPassword')?.value || '');
    if (tagShell) formData.append('courses_taught', Array.from(tagShell.querySelectorAll('.tag-chip')).map(c => c.textContent.replace('✕', '').trim()).join(', '));
    const fi = document.getElementById('imageUpload');
    if (fi && fi.files.length > 0) formData.append('profile_image', fi.files[0]);

    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`, { method: 'POST', body: formData });
        if (response.ok) {
            document.getElementById('profPassword').value = '';
            Swal.fire({ title: 'Success!', text: 'Profile updated!', icon: 'success', confirmButtonColor: '#008001' });
            loadProfileData();
        } else Swal.fire({ title: 'Failed', text: 'Issue updating profile.', icon: 'error', confirmButtonColor: '#D32F2F' });
    } catch (e) { alert('Network Error.'); }
});
