let currentStaffId = null;

// Create short initials when a lecturer has not uploaded a photo.
function getInitials(fullName) {
    const nameParts = fullName
        .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s*/i, '')
        .trim()
        .split(' ');

    const firstInitial = nameParts[0][0];
    const secondInitial = nameParts[1] ? nameParts[1][0] : '';

    return (firstInitial + secondInitial).toUpperCase();
}

// Listen for the lecturer login button.
document.getElementById('loginBtn').addEventListener('click', async event => {
    event.preventDefault();

    const staffIdInput = document.getElementById('staffId').value.trim();
    const passwordInput = document.getElementById('password').value.trim();

    if (!staffIdInput || !passwordInput) {
        alert('Please enter both your Staff ID and Password.');
        return;
    }

    // Change the button text while the server checks the login.
    const loginButton = document.getElementById('loginBtn');
    const originalText = loginButton.innerHTML;
    loginButton.innerHTML = 'Verifying...';

    try {
        const response = await fetch('/api/lecturer/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                staff_id: staffIdInput,
                password: passwordInput
            })
        });
        const data = await response.json();

        if (response.ok) {
            currentStaffId = data.staff_id;
            
            // Show the dashboard after a successful login.
            document.getElementById('screen-login').classList.remove('active');
            document.getElementById('screen-dashboard').classList.add('active');
            window.scrollTo(0, 0);

            await loadProfileData();
            
        } else {
            alert(data.error || 'Login failed. Check your credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Server error. Make sure your Django server is running.');
    } finally {
        loginButton.innerHTML = originalText;
    }
});

// Return to the login screen when either logout button is clicked.
function handleLogout() {
    currentStaffId = null;
    document.getElementById('screen-dashboard').classList.remove('active');
    document.getElementById('screen-login').classList.add('active');
    document.getElementById('password').value = ''; 
    window.scrollTo(0, 0);
}
document
    .getElementById('logoutLink')
    .addEventListener('click', handleLogout);

document
    .getElementById('mobileLogoutBtn')
    .addEventListener('click', handleLogout);

// Show or hide the password text when the eye button is clicked.
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

document.getElementById('togglePw').addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.4 20.4 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.5 20.5 0 0 1-2.16 3.19M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>';
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>';
    }
});

// Load the lecturer profile from the database.
async function loadProfileData() {
    if (!currentStaffId) return;

    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`);
        const data = await response.json();

        if (response.ok) {
            // Put the name and rank into the sidebar.
            document.querySelector('.sidebar-profile .name').textContent = data.name;
            document.querySelector('.sidebar-profile .rank').textContent = `${data.rank} · ${data.unit}`;

            // Put the saved values into their matching input fields.
            document.getElementById('profName').value = data.name || '';
            document.getElementById('profRank').value = data.rank || '';
            document.getElementById('profQual').value = data.highest_qualification || '';
            document.getElementById('profResearch').value = data.research_interests || '';
            document.getElementById('profBuilding').value = data.building || '';
            document.getElementById('profFloor').value = data.floor || '';
            document.getElementById('profOffice').value = data.office_number || '';
            document.getElementById('profGuidance').value = data.guidance || '';
            document.getElementById('profEmail').value = data.email || '';
            document.getElementById('profWhatsapp').value = data.whatsapp || '';

            const displayPhoto = document.getElementById('displayPhoto');
            const sidebarAvatar = document.querySelector('.sidebar-avatar');

            if (data.profile_image) {
                const imgHTML = `<img src="${data.profile_image}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                displayPhoto.innerHTML = imgHTML;
                sidebarAvatar.innerHTML = imgHTML;
            } else {
                const init = getInitials(data.name);
                displayPhoto.innerHTML = init;
                sidebarAvatar.innerHTML = init;
            }

            // Rebuild the course chips from the saved course list.
            const tagShell = document.getElementById('tagShell');
            tagShell.querySelectorAll('.tag-chip').forEach(chip => chip.remove());

            if (data.courses_taught) {
                const courses = data.courses_taught
                    .split(',')
                    .map(course => course.trim())
                    .filter(course => course);

                courses.forEach(course => addChip(course));
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Show a preview when a new lecturer image is selected.
document.getElementById('imageUpload').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();

        reader.onload = function(event) {
            document.getElementById('displayPhoto').innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:20px;">`;
            document.querySelector('.save-status').innerHTML = '<span class="dot" style="background:var(--udus-plum)"></span> Unsaved photo changes';
        };

        reader.readAsDataURL(this.files[0]);
    }
});

// Save the edited lecturer profile to the database.
document.getElementById('publishBtn').addEventListener('click', async () => {
    if (!currentStaffId) return;

    const formData = new FormData();

    formData.append('highest_qualification', document.getElementById('profQual').value);
    formData.append('research_interests', document.getElementById('profResearch').value);
    formData.append('building', document.getElementById('profBuilding').value);
    formData.append('floor', document.getElementById('profFloor').value);
    formData.append('office_number', document.getElementById('profOffice').value);
    formData.append('guidance', document.getElementById('profGuidance').value);
    formData.append('email', document.getElementById('profEmail').value);
    formData.append('whatsapp', document.getElementById('profWhatsapp').value);

    // Convert the course chips back into one comma-separated value.
    const courseChips = Array.from(
        document.querySelectorAll('.tag-chip')
    ).map(chip => chip.textContent.replace('✕', '').trim());

    formData.append('courses_taught', courseChips.join(', '));

    const fileInput = document.getElementById('imageUpload');
    if (fileInput.files.length > 0) {
        formData.append('profile_image', fileInput.files[0]);
    }

    try {
        const response = await fetch(`/api/lecturer/profile/${currentStaffId}/`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const statusText = document.querySelector('.save-status');
            statusText.innerHTML = '<span class="dot" style="background:var(--udus-dark-green)"></span> All changes published';
            alert('Profile updated successfully!');
            await loadProfileData();
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save changes.');
    }
});

// These elements are used for adding and removing course chips.
const tagShell = document.getElementById('tagShell');
const tagInput = document.getElementById('tagInput');

function addChip(value) {
    if (!value.trim()) return;

    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${value.trim().toUpperCase()}<button data-remove="${value.trim()}">✕</button>`;

    tagShell.insertBefore(chip, tagInput);
    tagInput.value = '';
}

tagInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addChip(tagInput.value);
    }
});

tagShell.addEventListener('click', event => {
    const removeButton = event.target.closest('button[data-remove]');

    if (removeButton) {
        removeButton.closest('.tag-chip').remove();
    }
});

// Scroll smoothly to the selected profile section.
document.querySelectorAll('.nav-link[data-target]').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelectorAll('.nav-link[data-target]').forEach(sidebarLink => {
            sidebarLink.classList.remove('active');
        });

        link.classList.add('active');
        const targetSection = document.getElementById(link.dataset.target);

        if (targetSection) {
            const targetPosition = (
                targetSection.getBoundingClientRect().top
                + window.scrollY
                - 100
            );

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});